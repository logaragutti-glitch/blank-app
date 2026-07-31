/**
 * Prompt for Agente 1 (Briefing Engine / Motor de Interpretacao) —
 * 04-ai-bible.md, "O Diagnostico Criativo" and "O Motor de Interpretacao".
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump DIAGNOSTICO_CRIATIVO_PROMPT_VERSION whenever
 * the wording or output schema changes.
 */
export const DIAGNOSTICO_CRIATIVO_PROMPT_VERSION = "v1";

export const DIAGNOSTICO_CRIATIVO_SYSTEM_PROMPT = `Voce e Agente 1 (Briefing Engine / Motor de Interpretacao) do EVE OS, descrito na EVE OS AI Bible.

Sua missao e produzir o Diagnostico Criativo: um documento interno (nunca mostrado ao cliente) que combina as respostas do formulario, as imagens de inspiracao ja analisadas pelo Agente 2 (Vision AI), as caracteristicas do espaco, o orcamento disponivel e o conhecimento acumulado da marca (Knowledge Graph) para decidir: qual e o estilo predominante, qual emocao o casal deseja transmitir, qual paleta traduz melhor essa emocao, qual mobiliario reforca esse conceito, qual iluminacao valoriza o espaco, e se o projeto conversa com a arquitetura do local.

A emocao vem antes da decoracao. A decoracao e consequencia da historia. A historia sempre vem primeiro.

Regras de ouro que voce nunca pode quebrar:
- Nunca sugira um material marcado como "nao recomendar" (neverRecommend) na lista de materiais do catalogo.
- Nunca sugira estruturas ou materiais incompativeis com o orcamento informado.
- Nunca sugira estruturas inviaveis para o espaco descrito.
- Nunca misture estilos conflitantes sem justificativa explicita.
- O estilo predominante DEVE ser um dos estilos candidatos fornecidos (escolha pelo id); se nenhum se encaixar bem, escolha o mais proximo e explique a diferenca na justificativa — nunca invente um estilo fora da lista.
- Os materiais recomendados DEVEM vir da lista de materiais do catalogo fornecida — nunca invente materiais que nao estao no catalogo.

Chame a tool record_diagnostico_criativo exatamente uma vez com sua analise. Escreva todo o texto em portugues do Brasil, no tom da marca (acolhedor, nunca tecnico demais — ver Brand Bible).`;

export const DIAGNOSTICO_CRIATIVO_TOOL_NAME = "record_diagnostico_criativo";

export function buildDiagnosticoCriativoToolSchema(candidateStyleIds: string[]) {
  return {
    name: DIAGNOSTICO_CRIATIVO_TOOL_NAME,
    description: "Registra o Diagnostico Criativo estruturado para um evento.",
    input_schema: {
      type: "object" as const,
      properties: {
        perfilCasal: {
          type: "string",
          description: 'Ex.: "Romantico contemporaneo".',
        },
        atmosferaDesejada: {
          type: "string",
          description: 'Ex.: "Elegancia leve e acolhedora".',
        },
        estiloPredominanteId: {
          type: "string",
          enum: candidateStyleIds,
          description: "id de um dos estilos candidatos fornecidos.",
        },
        estiloPredominante: {
          type: "string",
          description: "Nome do estilo predominante escolhido (deve corresponder ao id acima).",
        },
        paletaSugerida: { type: "array", items: { type: "string" } },
        mobiliarioSugerido: { type: "array", items: { type: "string" } },
        iluminacaoSugerida: { type: "string" },
        materiaisRecomendados: {
          type: "array",
          items: { type: "string" },
          description: "Nomes de materiais, apenas do catalogo fornecido.",
        },
        compatibilidadeComEspaco: {
          type: "string",
          description: "Explicacao de como o projeto conversa (ou nao) com a arquitetura do local.",
        },
        justificativa: {
          type: "string",
          description: "Por que essas escolhas, referenciando o briefing e as inspiracoes.",
        },
      },
      required: [
        "perfilCasal",
        "atmosferaDesejada",
        "estiloPredominanteId",
        "estiloPredominante",
        "compatibilidadeComEspaco",
        "justificativa",
      ],
    },
  };
}
