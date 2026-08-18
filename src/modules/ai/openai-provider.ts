import type { AiProvider, GenerateStructuredInput, GenerateTextInput } from "./provider";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_DELAYS_MS = [400, 1_200] as const;
const MAX_ERROR_BODY_LENGTH = 4_000;

const RETRYABLE_HTTP_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504]);

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export interface OpenAiProviderOptions {
  requestTimeoutMs?: number;
  retryDelaysMs?: readonly number[];
}

class OpenAiRequestError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`OpenAI request failed: ${status}${body ? ` ${body}` : ""}`.trim());
    this.name = "OpenAiRequestError";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAiRequestError) {
    return RETRYABLE_HTTP_STATUSES.has(error.status);
  }

  if (error instanceof Error) {
    return error.name === "AbortError" || error.name === "TimeoutError";
  }

  return false;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Modelos ocasionalmente envolvem JSON em uma cerca Markdown ou acrescentam uma
 * frase curta apesar da instrução. Aceitamos somente essas variações mecânicas;
 * a validação estrutural continua sendo responsabilidade do schema Zod.
 */
function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1];
  const candidates = [
    trimmed,
    fenced,
    (() => {
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      return start >= 0 && end > start ? trimmed.slice(start, end + 1) : undefined;
    })(),
  ].filter((candidate): candidate is string => Boolean(candidate));

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new SyntaxError("A resposta da OpenAI não contém JSON válido");
}

function addUsage(first: GenerateTextInputResult["usage"], second: GenerateTextInputResult["usage"]) {
  return {
    inputTokens: first.inputTokens + second.inputTokens,
    outputTokens: first.outputTokens + second.outputTokens,
  };
}

type GenerateTextInputResult = Awaited<ReturnType<OpenAiProvider["generateText"]>>;

/**
 * Implementação de referência do AiProvider usando a OpenAI API. Chamada real via
 * fetch (sem SDK) para manter a dependência mínima até a Sprint 3, quando o motor de
 * entrevista e o orquestrador de documentos passam a consumir isto de fato.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  private readonly requestTimeoutMs: number;
  private readonly retryDelaysMs: readonly number[];

  constructor(
    private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "",
    private readonly model: string = "gpt-4o-mini",
    options: OpenAiProviderOptions = {},
  ) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  }

  async generateText({ system, prompt, maxTokens }: GenerateTextInput) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    let lastError: unknown;
    const maxAttempts = this.retryDelaysMs.length + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [
              ...(system ? [{ role: "system", content: system }] : []),
              { role: "user", content: prompt },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.text().catch(() => "")).slice(0, MAX_ERROR_BODY_LENGTH);
          throw new OpenAiRequestError(response.status, body);
        }

        const data = (await response.json()) as OpenAiResponse;
        const text = data.choices?.[0]?.message?.content;
        if (typeof text !== "string") {
          throw new Error("OpenAI response missing choices[0].message.content");
        }

        return {
          text,
          usage: {
            inputTokens: data.usage?.prompt_tokens ?? 0,
            outputTokens: data.usage?.completion_tokens ?? 0,
          },
        };
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts - 1 || !isRetryableError(error)) {
          throw error;
        }
      } finally {
        clearTimeout(timeout);
      }

      await wait(this.retryDelaysMs[attempt] ?? 0);
    }

    throw lastError instanceof Error ? lastError : new Error("Falha desconhecida na OpenAI");
  }

  async generateStructured<TShape>(input: GenerateStructuredInput<TShape>) {
    const first = await this.generateText({
      ...input,
      system: `${input.system ?? ""}\nResponda apenas com JSON válido, sem markdown.`.trim(),
    });

    try {
      const data = input.parse(parseJsonResponse(first.text));
      return { data, usage: first.usage };
    } catch (firstError) {
      const correctionPrompt = `${input.prompt}\n\nA resposta anterior não pôde ser validada (${errorMessage(
        firstError,
      ).slice(0, 1_000)}). Gere uma nova resposta corrigida, seguindo exatamente o formato solicitado. Retorne somente o objeto JSON, sem markdown, comentários ou texto adicional.`;
      const second = await this.generateText({
        ...input,
        prompt: correctionPrompt,
        system: `${input.system ?? ""}\nResponda apenas com JSON válido, sem markdown.`.trim(),
      });

      try {
        const data = input.parse(parseJsonResponse(second.text));
        return { data, usage: addUsage(first.usage, second.usage) };
      } catch (secondError) {
        throw new Error(
          `Resposta estruturada inválida após nova tentativa: ${errorMessage(secondError)}`,
        );
      }
    }
  }
}
