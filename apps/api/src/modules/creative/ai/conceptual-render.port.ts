export interface ConceptualRenderInput {
  conceptName: string;
  atmosferaDesejada: string;
  estiloPredominante: string;
  paletaSugerida: string[];
  venueName: string;
  /** Set when rendering one of the 10 narrative environments instead of the Capa's overall hero shot. */
  environmentTitle?: string;
  environmentDescription?: string;
}

export interface ConceptualRenderResult {
  imageBase64: string;
  mimeType: string;
}

/**
 * Port for the conceptual render (04-ai-bible.md, "Renders automaticos") —
 * a hero image for the Capa or for one of the 10 narrative environments.
 */
export abstract class ConceptualRenderPort {
  abstract generate(input: ConceptualRenderInput): Promise<ConceptualRenderResult>;
}
