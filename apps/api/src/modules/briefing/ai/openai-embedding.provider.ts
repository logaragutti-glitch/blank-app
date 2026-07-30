import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { EmbeddingPort } from "./embedding.port";

/** Must match the `vector(1536)` column width in schema.prisma. */
export const EMBEDDING_DIMENSIONS = 1536;

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingPort {
  // Constructed lazily (on first real use) rather than in the constructor:
  // the OpenAI SDK throws immediately if no API key is configured, which
  // would otherwise crash NestJS DI at boot even when nothing calls embed()
  // yet (e.g. no OPENAI_API_KEY configured in this environment).
  private client: OpenAI | undefined;
  private readonly model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  private getClient(): OpenAI {
    this.client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return this.client;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.getClient().embeddings.create({
      model: this.model,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const [embedding] = response.data;
    if (!embedding) {
      throw new Error("OpenAI embeddings API returned no results.");
    }
    return embedding.embedding;
  }
}
