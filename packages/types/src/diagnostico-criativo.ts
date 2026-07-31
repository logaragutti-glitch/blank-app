/**
 * Diagnostico Criativo — Agente 1 / Motor de Interpretacao (04-ai-bible.md).
 * Internal document, never shown to the client; the structured base every
 * later decision (concept, palette, moodboard, component selection) reads
 * from instead of re-deriving from raw briefing data each time.
 */
export interface DiagnosticoCriativo {
  perfilCasal: string;
  atmosferaDesejada: string;
  estiloPredominante: string;
  paletaSugerida: string[];
  mobiliarioSugerido: string[];
  iluminacaoSugerida: string;
  materiaisRecomendados: string[];
  compatibilidadeComEspaco: string;
  justificativa: string;
  /** Prompt version that produced this diagnosis, for traceability. */
  promptVersion: string;
}
