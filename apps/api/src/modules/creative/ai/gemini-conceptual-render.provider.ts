import { Injectable } from "@nestjs/common";
import { buildConceptualRenderPrompt } from "./prompts/conceptual-render.prompt";
import { ConceptualRenderPort } from "./conceptual-render.port";
import type { ConceptualRenderInput, ConceptualRenderResult } from "./conceptual-render.port";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiInlineData {
  mimeType: string;
  data: string;
}

interface GeminiPart {
  inlineData?: GeminiInlineData;
}

interface GeminiGenerateContentResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
}

/**
 * Google AI Studio's Gemini image generation ("Nano Banana" family) — plain
 * REST via fetch (Node's built-in, no SDK needed) rather than a client
 * library, same shape the model itself is called with client-side in
 * AI Studio's own quickstart. Swapped in for OpenAiConceptualRenderProvider
 * per direct request.
 */
@Injectable()
export class GeminiConceptualRenderProvider implements ConceptualRenderPort {
  private readonly model = process.env.GOOGLE_AI_IMAGE_MODEL ?? "gemini-3-pro-image";
  private readonly imageSize = process.env.GOOGLE_AI_IMAGE_SIZE ?? "2K";

  async generate(input: ConceptualRenderInput): Promise<ConceptualRenderResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is not configured.");
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/${this.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildConceptualRenderPrompt(input) }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "1:1", imageSize: this.imageSize },
          },
        }),
      },
    );

    const data = (await response.json()) as GeminiGenerateContentResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `Google AI Studio returned HTTP ${response.status}.`);
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error("Google AI Studio image generation returned no results.");
    }

    return { imageBase64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
  }
}
