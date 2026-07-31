import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type { VisionTags } from "@eve-os/types";
import {
  VISION_ANALYSIS_PROMPT_VERSION,
  VISION_ANALYSIS_SYSTEM_PROMPT,
  VISION_ANALYSIS_TOOL_NAME,
  VISION_ANALYSIS_TOOL_SCHEMA,
} from "./prompts/vision-analysis.prompt";
import type { AnalyzeImageInput, VisionAnalysisResult } from "./vision-analysis.port";
import { VisionAnalysisPort } from "./vision-analysis.port";

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

function assertSupportedMimeType(mimeType: string): asserts mimeType is SupportedMimeType {
  if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error(
      `Unsupported image type "${mimeType}" for Vision AI. Supported: ${SUPPORTED_MIME_TYPES.join(", ")}`,
    );
  }
}

@Injectable()
export class AnthropicVisionAnalysisProvider implements VisionAnalysisPort {
  // Constructed lazily so a missing ANTHROPIC_API_KEY fails only when this
  // feature is actually used, not at NestJS boot (see OpenAiEmbeddingProvider
  // for the same reasoning — the OpenAI SDK crashes app startup otherwise).
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_VISION_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async analyze({ base64, mimeType }: AnalyzeImageInput): Promise<VisionAnalysisResult> {
    assertSupportedMimeType(mimeType);

    const message = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 1024,
      system: VISION_ANALYSIS_SYSTEM_PROMPT,
      tools: [VISION_ANALYSIS_TOOL_SCHEMA],
      tool_choice: { type: "tool", name: VISION_ANALYSIS_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
            { type: "text", text: "Analyze this inspiration image." },
          ],
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Vision AI did not return a structured analysis (no tool_use block).");
    }

    const input = toolUse.input as VisionTags & { description: string };
    const { description, ...tags } = input;

    return {
      tags: tags as VisionTags,
      description,
      promptVersion: VISION_ANALYSIS_PROMPT_VERSION,
    };
  }
}
