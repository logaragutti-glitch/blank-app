/**
 * Prompt for the conceptual render (04-ai-bible.md, "Renders automaticos") —
 * a single hero image for the proposal's Capa, giving the couple a unique
 * visual representation of the concept instead of only generic inspiration
 * references.
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump CONCEPTUAL_RENDER_PROMPT_VERSION whenever the
 * wording changes.
 */
export const CONCEPTUAL_RENDER_PROMPT_VERSION = "v1";

export interface ConceptualRenderPromptInput {
  conceptName: string;
  atmosferaDesejada: string;
  estiloPredominante: string;
  paletaSugerida: string[];
  venueName: string;
}

export function buildConceptualRenderPrompt(input: ConceptualRenderPromptInput): string {
  const { conceptName, atmosferaDesejada, estiloPredominante, paletaSugerida, venueName } = input;

  return `Fotografia editorial de casamento, estilo Fine Art, ultra realista, luz natural quente.

Conceito: "${conceptName}".
Atmosfera: ${atmosferaDesejada}.
Estilo predominante: ${estiloPredominante}.
Paleta de cores: ${paletaSugerida.join(", ") || "tons neutros e naturais"}.
Local: ${venueName}.

Composicao ampla mostrando a decoracao do ambiente (flores, mobiliario, iluminacao), sem pessoas, sem rostos, sem texto ou tipografia na imagem. Elegante, sofisticado, romantico, nunca genérico ou de banco de imagens.`;
}
