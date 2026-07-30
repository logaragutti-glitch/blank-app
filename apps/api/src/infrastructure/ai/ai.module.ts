import { Global, Module } from "@nestjs/common";
import { EmbeddingPort } from "./embedding.port";
import { OpenAiEmbeddingProvider } from "./openai-embedding.provider";

/**
 * Generic AI infrastructure shared across domain modules — currently just
 * text embeddings (used by both the Briefing Engine's inspiration images
 * and the Knowledge Graph's EventStyle semantic search). Vision analysis
 * and Diagnostico Criativo generation stay local to the modules that own
 * that specific business logic (briefing, creative).
 */
@Global()
@Module({
  providers: [{ provide: EmbeddingPort, useClass: OpenAiEmbeddingProvider }],
  exports: [EmbeddingPort],
})
export class AiModule {}
