import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { buildConceptualRenderPrompt } from "./prompts/conceptual-render.prompt";
import { ConceptualRenderPort } from "./conceptual-render.port";
import type { ConceptualRenderInput, ConceptualRenderResult } from "./conceptual-render.port";

@Injectable()
export class OpenAiConceptualRenderProvider implements ConceptualRenderPort {
  // Lazy client, same reasoning as OpenAiEmbeddingProvider — the SDK throws
  // immediately at construction if no API key is set, which would crash
  // NestJS DI at boot in environments without OPENAI_API_KEY configured.
  private client: OpenAI | undefined;
  private readonly model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

  private getClient(): OpenAI {
    this.client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return this.client;
  }

  async generate(input: ConceptualRenderInput): Promise<ConceptualRenderResult> {
    const response = await this.getClient().images.generate({
      model: this.model,
      prompt: buildConceptualRenderPrompt(input),
      size: "1024x1024",
    });

    const [image] = response.data ?? [];
    if (!image?.b64_json) {
      throw new Error("OpenAI image generation returned no results.");
    }

    return { imageBase64: image.b64_json, mimeType: "image/png" };
  }
}
