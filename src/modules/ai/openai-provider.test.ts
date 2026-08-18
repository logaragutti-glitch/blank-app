import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiProvider } from "./openai-provider";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completion(content: string, promptTokens = 1, completionTokens = 2) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OpenAiProvider", () => {
  it("repete uma resposta 429 e conclui quando a tentativa seguinte funciona", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limit" } }, 429))
      .mockResolvedValueOnce(jsonResponse(completion("ok")));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key", "test-model", {
      requestTimeoutMs: 1_000,
      retryDelaysMs: [0],
    });

    await expect(provider.generateText({ prompt: "teste" })).resolves.toMatchObject({
      text: "ok",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não repete erros permanentes e preserva o corpo retornado pela API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "invalid api key" } }, 401));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("bad-key", "test-model", { retryDelaysMs: [0] });

    await expect(provider.generateText({ prompt: "teste" })).rejects.toThrow(
      /OpenAI request failed: 401.*invalid api key/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("faz uma nova tentativa quando o JSON não passa no parser e soma o uso das duas chamadas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(completion("não é json", 10, 11)))
      .mockResolvedValueOnce(jsonResponse(completion('```json\n{"value":"ok"}\n```', 20, 21)));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key", "test-model", { retryDelaysMs: [0] });
    const result = await provider.generateStructured({
      prompt: "Retorne {value: string}",
      parse: (raw) => {
        if (!raw || typeof raw !== "object" || !("value" in raw)) {
          throw new Error("campo value ausente");
        }
        return raw as { value: string };
      },
    });

    expect(result.data).toEqual({ value: "ok" });
    expect(result.usage).toEqual({ inputTokens: 30, outputTokens: 32 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
