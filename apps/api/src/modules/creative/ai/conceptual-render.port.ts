export interface ConceptualRenderInput {
  conceptName: string;
  atmosferaDesejada: string;
  estiloPredominante: string;
  paletaSugerida: string[];
  venueName: string;
}

export interface ConceptualRenderResult {
  imageBase64: string;
  mimeType: string;
}

/** Port for the conceptual render (04-ai-bible.md, "Renders automaticos") — the Capa's hero image. */
export abstract class ConceptualRenderPort {
  abstract generate(input: ConceptualRenderInput): Promise<ConceptualRenderResult>;
}
