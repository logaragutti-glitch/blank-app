/** Port for text embeddings, used to populate InspirationImage.embedding (pgvector). */
export abstract class EmbeddingPort {
  abstract embed(text: string): Promise<number[]>;
}
