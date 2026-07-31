const generateMock = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    images: { generate: generateMock },
  })),
}));

// eslint-disable-next-line import/first
import { OpenAiConceptualRenderProvider } from "./openai-conceptual-render.provider";
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

describe("OpenAiConceptualRenderProvider", () => {
  beforeEach(() => {
    generateMock.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns the base64 image from the OpenAI response", async () => {
    generateMock.mockResolvedValue({ data: [{ b64_json: "fake-base64-bytes" }] });

    const provider = new OpenAiConceptualRenderProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual({ imageBase64: "fake-base64-bytes", mimeType: "image/png" });
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-image-1", size: "1024x1024" }),
    );
  });

  it("throws when the response has no image data", async () => {
    generateMock.mockResolvedValue({ data: [] });
    const provider = new OpenAiConceptualRenderProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/returned no results/);
  });
});
