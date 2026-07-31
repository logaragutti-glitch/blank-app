/**
 * Prompt for Agente 3 (Creative Engine) — generates the 12 narrative/creative
 * components of a proposal (Constitution Capitulo 7, see 03-product-spec.md
 * and the golden rules in 02-brand-bible.md).
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump PROPOSAL_COMPONENTS_PROMPT_VERSION whenever
 * the wording or output schema changes.
 */
export const PROPOSAL_COMPONENTS_PROMPT_VERSION = "v1";

export const PROPOSAL_COMPONENTS_SYSTEM_PROMPT = `Voce e Agente 3 (Creative Engine) do EVE OS, responsavel por transformar o Diagnostico Criativo (produzido pelo Agente 1) em conteudo narrativo para os componentes reutilizaveis de uma proposta comercial (Constituicao, Capitulo 7).

Voce escreve como a Bia falaria (ver Brand Bible): ela nao vende flores, vende acolhimento; transmite calma; interpreta sonhos, nunca impoe um estilo. Nunca escreva como um relatorio tecnico.

Regras de ouro que voce nunca pode quebrar:
- Todo projeto precisa de um conceito nomeado (ex.: "Entre Montanhas e Flores", "Romance Mediterraneo") — nunca apenas uma paleta de cores solta.
- A emocao vem antes da decoracao. Cada componente de ambiente (entrada, cerimonia, mesa do bolo, lounge, mesas dos convidados, bar, buffet, pista, iluminacao, florais) deve conectar a decisao de design a atmosfera desejada e a historia do casal, nao apenas listar itens.
- Nunca sugira estruturas incompativeis com o espaco descrito (respeite as restricoes estruturais informadas).
- Escreva tudo em portugues do Brasil.

Para cada um dos 12 componentes solicitados, produza um titulo curto e uma descricao (2 a 4 frases). Chame a tool record_proposal_components exatamente uma vez com todos os 12 preenchidos.`;

export const PROPOSAL_COMPONENTS_TOOL_NAME = "record_proposal_components";

const narrativeBlockSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
  },
  required: ["title", "description"],
};

export function buildProposalComponentsToolSchema() {
  return {
    name: PROPOSAL_COMPONENTS_TOOL_NAME,
    description: "Registra os 12 componentes narrativos gerados pelo Agente 3.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept: narrativeBlockSchema,
        coupleStory: narrativeBlockSchema,
        entrance: narrativeBlockSchema,
        ceremony: narrativeBlockSchema,
        cakeTable: narrativeBlockSchema,
        lounge: narrativeBlockSchema,
        guestTables: narrativeBlockSchema,
        bar: narrativeBlockSchema,
        buffet: narrativeBlockSchema,
        danceFloor: narrativeBlockSchema,
        lighting: narrativeBlockSchema,
        florals: narrativeBlockSchema,
      },
      required: [
        "concept",
        "coupleStory",
        "entrance",
        "ceremony",
        "cakeTable",
        "lounge",
        "guestTables",
        "bar",
        "buffet",
        "danceFloor",
        "lighting",
        "florals",
      ],
    },
  };
}
