/**
 * Prompt for the conceptual render (04-ai-bible.md, "Renders automaticos") —
 * a hero image either for the proposal's Capa (the event as a whole) or for
 * one of the 10 narrative environments (Entrada, Cerimonia, Mesa do bolo...),
 * giving the couple a unique visual representation of the concept instead of
 * only generic inspiration references.
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump CONCEPTUAL_RENDER_PROMPT_VERSION whenever the
 * wording changes.
 */
export const CONCEPTUAL_RENDER_PROMPT_VERSION = "v2";

export interface ConceptualRenderPromptInput {
  conceptName: string;
  atmosferaDesejada: string;
  estiloPredominante: string;
  paletaSugerida: string[];
  venueName: string;
  /**
   * When rendering one of the 10 narrative environments rather than the
   * Capa's overall hero shot, the environment's own narrative title/
   * description (Agente 3's output) — the specific scene to depict.
   */
  environmentTitle?: string;
  environmentDescription?: string;
}

export function buildConceptualRenderPrompt(input: ConceptualRenderPromptInput): string {
  const {
    conceptName,
    atmosferaDesejada,
    estiloPredominante,
    paletaSugerida,
    venueName,
    environmentTitle,
    environmentDescription,
  } = input;

  const sceneLine =
    environmentTitle && environmentDescription
      ? `Ambiente especifico a retratar: "${environmentTitle}" — ${environmentDescription}`
      : `Cena: imagem de capa representando o casamento como um todo, sem focar em um ambiente especifico.`;

  return `Fotografia editorial de casamento, estilo Fine Art, ultra realista, luz natural quente.

Conceito: "${conceptName}".
${sceneLine}
Atmosfera: ${atmosferaDesejada}.
Estilo predominante: ${estiloPredominante}.
Paleta de cores: ${paletaSugerida.join(", ") || "tons neutros e naturais"}.
Local: ${venueName}.

Composicao ampla mostrando a decoracao do ambiente (flores, mobiliario, iluminacao), sem pessoas, sem rostos, sem texto ou tipografia na imagem. Elegante, sofisticado, romantico, nunca genérico ou de banco de imagens.`;
}
