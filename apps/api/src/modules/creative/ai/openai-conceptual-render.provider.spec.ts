const generateMock = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    images: { generate: generateMock },
  })),
}));

// eslint-disable-next-line import/first
import { OpenAIConceptualRenderProvider } from "./openai-conceptual-render.provider";
// eslint-disable-next-line import/first
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

describe("OpenAIConceptualRenderProvider", () => {
  beforeEach(() => {
    generateMock.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("returns the Base64 image data from the OpenAI response", async () => {
    generateMock.mockResolvedValue({
      output_format: "png",
      data: [{ b64_json: "fake-base64-bytes" }],
    });

    const provider = new OpenAIConceptualRenderProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual({ imageBase64: "fake-base64-bytes", mimeType: "image/png" });
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-image-1",
        n: 1,
        size: "1024x1024",
        quality: "high",
        output_format: "png",
      }),
    );
  });

  it("throws when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAIConceptualRenderProvider();

    await expect(provider.generate(buildInput())).rejects.toThrow(/OPENAI_API_KEY/);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("propagates the OpenAI API error", async () => {
    generateMock.mockRejectedValue(new Error("Billing hard limit reached"));
    const provider = new OpenAIConceptualRenderProvider();

    await expect(provider.generate(buildInput())).rejects.toThrow(/Billing hard limit reached/);
  });

  it("throws when the response has no Base64 image data", async () => {
    generateMock.mockResolvedValue({ data: [] });
    const provider = new OpenAIConceptualRenderProvider();

    await expect(provider.generate(buildInput())).rejects.toThrow(/returned no results/);
  });
});
