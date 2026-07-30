const createMock = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

// eslint-disable-next-line import/first
import { AnthropicVisionAnalysisProvider } from "./anthropic-vision-analysis.provider";

describe("AnthropicVisionAnalysisProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("extracts tags and description from the tool_use block", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "record_vision_analysis",
          input: {
            flowers: ["peônias", "lisianthus"],
            colors: ["rosé", "verde sálvia"],
            description: "Um jardim romântico com tons suaves.",
          },
        },
      ],
    });

    const provider = new AnthropicVisionAnalysisProvider();
    const result = await provider.analyze({ base64: "ZmFrZQ==", mimeType: "image/jpeg" });

    expect(result.description).toBe("Um jardim romântico com tons suaves.");
    expect(result.tags.flowers).toEqual(["peônias", "lisianthus"]);
    expect(result.promptVersion).toBe("v1");
  });

  it("throws when the model does not return a tool_use block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "sorry, no." }] });

    const provider = new AnthropicVisionAnalysisProvider();
    await expect(
      provider.analyze({ base64: "ZmFrZQ==", mimeType: "image/jpeg" }),
    ).rejects.toThrow(/did not return a structured analysis/);
  });

  it("rejects unsupported mime types before calling the API", async () => {
    const provider = new AnthropicVisionAnalysisProvider();
    await expect(
      provider.analyze({ base64: "ZmFrZQ==", mimeType: "image/bmp" }),
    ).rejects.toThrow(/Unsupported image type/);
    expect(createMock).not.toHaveBeenCalled();
  });
});
