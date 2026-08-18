import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { buildConceptualRenderPrompt } from "./prompts/conceptual-render.prompt";
import { ConceptualRenderPort } from "./conceptual-render.port";
import type { ConceptualRenderInput, ConceptualRenderResult } from "./conceptual-render.port";

type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
type ImageQuality = "low" | "medium" | "high" | "auto";

function getMimeType(outputFormat: string | undefined): string {
  switch (outputFormat) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

/**
 * OpenAI GPT Image provider for the conceptual render endpoint.
 *
 * Claude remains responsible for the text-oriented creative agents; this
 * provider is only responsible for turning the approved visual prompt into
 * the base64 image expected by the existing render pipeline.
 */
@Injectable()
export class OpenAIConceptualRenderProvider implements ConceptualRenderPort {
  private client: OpenAI | undefined;
  private readonly model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  private readonly size = (process.env.OPENAI_IMAGE_SIZE ?? "1024x1024") as ImageSize;
  private readonly quality = (process.env.OPENAI_IMAGE_QUALITY ?? "high") as ImageQuality;

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    this.client ??= new OpenAI({ apiKey });
    return this.client;
  }

  async generate(input: ConceptualRenderInput): Promise<ConceptualRenderResult> {
    const response = await this.getClient().images.generate({
      model: this.model,
      prompt: buildConceptualRenderPrompt(input),
      n: 1,
      size: this.size,
      quality: this.quality,
      output_format: "png",
    });

    const image = response.data?.[0];
    if (!image?.b64_json) {
      throw new Error("OpenAI image generation returned no results.");
    }

    return {
      imageBase64: image.b64_json,
      mimeType: getMimeType(response.output_format),
    };
  }
}
