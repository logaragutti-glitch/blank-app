/**
 * WOW Score (04-ai-bible.md, "O Indice WOW") — indicador interno (0-100) de
 * originalidade e coerencia de uma proposta, usado para sinalizar propostas
 * que precisam de revisao humana antes de serem enviadas. Nunca exposto ao
 * cliente.
 *
 * A Constituicao nao define uma formula exata (apenas o conceito e um
 * exemplo de decomposicao por dimensoes emocionais), entao esta e uma
 * heuristica v1, deliberadamente simples e documentada, para ser calibrada
 * com dados reais mais adiante:
 *
 * - Coerencia: o quao proximo o perfil emocional do evento (Event.dnaScores)
 *   esta do perfil do estilo escolhido pelo Agente 1
 *   (EventStyle.dimensionScores) — quanto menor a diferenca media entre as
 *   dimensoes em comum, mais coerente o projeto.
 * - Originalidade: o quanto o perfil emocional do evento se distingue de um
 *   perfil "plano" (todas as dimensoes iguais) — medido pelo desvio-padrao
 *   das pontuacoes, ja que um evento com uma assinatura emocional forte e
 *   distintiva (poucas dimensoes muito altas, o resto baixo) tende a gerar
 *   um conceito mais memoravel do que um perfil uniforme e generico.
 *
 * Sem dnaScores (evento ainda nao caracterizado) ou sem estilo casado,
 * retorna null — o WOW Score so faz sentido quando ha dados reais para
 * calcular sobre.
 */
export function computeWowScore(
  dnaScores: Record<string, number> | null,
  matchedStyleDimensionScores: Record<string, number> | null,
): number | null {
  if (!dnaScores || Object.keys(dnaScores).length === 0) return null;

  const values = Object.values(dnaScores);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  // A pontuacao maxima teorica (0/100/100/.../0) tem desvio-padrao proximo
  // de 50 para poucas dimensoes altas — escalamos por 2 e limitamos a 100.
  const originality = clamp(stdDev * 2, 0, 100);

  let coherence = 70; // baseline neutro quando nao ha estilo casado para comparar.
  if (matchedStyleDimensionScores && Object.keys(matchedStyleDimensionScores).length > 0) {
    const sharedKeys = Object.keys(dnaScores).filter((key) => key in matchedStyleDimensionScores);
    if (sharedKeys.length > 0) {
      const avgAbsDiff =
        sharedKeys.reduce((sum, key) => sum + Math.abs((dnaScores[key] ?? 0) - (matchedStyleDimensionScores[key] ?? 0)), 0) /
        sharedKeys.length;
      coherence = clamp(100 - avgAbsDiff, 0, 100);
    }
  }

  return Math.round(coherence * 0.6 + originality * 0.4);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
