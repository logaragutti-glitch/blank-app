const createMock = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: { create: createMock },
  })),
}));

// eslint-disable-next-line import/first
import { OpenAiEmbeddingProvider } from "./openai-embedding.provider";

describe("OpenAiEmbeddingProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns the embedding vector for the given text", async () => {
    const fakeVector = new Array(1536).fill(0).map((_, i) => i / 1536);
    createMock.mockResolvedValue({ data: [{ embedding: fakeVector }] });

    const provider = new OpenAiEmbeddingProvider();
    const result = await provider.embed("Um jardim romântico com tons suaves.");

    expect(result).toHaveLength(1536);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: "Um jardim romântico com tons suaves.", dimensions: 1536 }),
    );
  });

  it("throws when the API returns no embeddings", async () => {
    createMock.mockResolvedValue({ data: [] });
    const provider = new OpenAiEmbeddingProvider();
    await expect(provider.embed("texto")).rejects.toThrow(/returned no results/);
  });
});
