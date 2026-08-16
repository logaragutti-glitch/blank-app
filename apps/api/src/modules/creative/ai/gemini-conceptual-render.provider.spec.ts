import { GeminiConceptualRenderProvider } from "./gemini-conceptual-render.provider";
import type { ConceptualRenderInput } from "./conceptual-render.port";

function buildInput(): ConceptualRenderInput {
  return {
    conceptName: "Entre Montanhas e Flores",
    atmosferaDesejada: "Elegância leve e acolhedora",
    estiloPredominante: "Garden Fine Art",
    paletaSugerida: ["rosé", "verde sálvia"],
    venueName: "Villa Massari",
  };
}

describe("GeminiConceptualRenderProvider", () => {
  const originalApiKey = process.env.GOOGLE_AI_API_KEY;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = "test-key";
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.GOOGLE_AI_API_KEY = originalApiKey;
  });

  it("returns the inline image data from the Gemini response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ inlineData: { mimeType: "image/png", data: "fake-base64-bytes" } }] } },
        ],
      }),
    });

    const provider = new GeminiConceptualRenderProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual({ imageBase64: "fake-base64-bytes", mimeType: "image/png" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gemini-3-pro-image:generateContent?key=test-key");
    expect(JSON.parse(init.body as string)).toMatchObject({
      generationConfig: { responseModalities: ["IMAGE"] },
    });
  });

  it("throws when GOOGLE_AI_API_KEY is not configured", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    const provider = new GeminiConceptualRenderProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/GOOGLE_AI_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws with the API's own error message when the request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "API key not valid" } }),
    });

    const provider = new GeminiConceptualRenderProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/API key not valid/);
  });

  it("throws when the response has no image data", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });

    const provider = new GeminiConceptualRenderProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/returned no results/);
  });
});
