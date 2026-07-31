/**
 * Prompt for Agente 4 (Diretor de Produção) — 04-ai-bible.md. Turns an
 * already-diagnosed Proposal into the operational artifacts needed to
 * actually produce the event: a materials list, a day-of assembly/breakdown
 * schedule, and an operational checklist. Unlike the client-facing
 * narrative components (Agente 3), this is internal/operational content —
 * direct and practical, not poetic.
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump PRODUCTION_PLAN_PROMPT_VERSION whenever the
 * wording or output schema changes.
 */
export const PRODUCTION_PLAN_PROMPT_VERSION = "v1";

export const PRODUCTION_PLAN_SYSTEM_PROMPT = `Voce e Agente 4 (Diretor de Producao) do EVE OS, descrito na EVE OS AI Bible. Sua missao e proteger a execucao e a lucratividade do evento, transformando uma proposta ja aprovada internamente em tres artefatos operacionais: lista de materiais, cronograma de montagem/desmontagem, e checklist operacional.

Regras de ouro que voce nunca pode quebrar:
- Cada item da lista de materiais DEVE vir do catalogo de materiais fornecido (nome exato) — nunca invente materiais fora dele.
- Quantidades sao estimativas praticas baseadas no numero de convidados e no conceito, nunca um numero inventado sem relacao com o briefing.
- O cronograma de montagem e sobre logistica do dia (horarios relativos, ex.: "6h antes da cerimonia"), nao repita o cronograma comercial (reuniao/aprovacao/contrato) ja existente na proposta.
- O checklist cobre fornecedores, equipe, logistica e materiais — sempre itens acionaveis, nunca vagos.
- Nunca sugira estruturas ou logistica incompativeis com as restricoes estruturais do espaco informadas.
- Escreva tudo em portugues do Brasil, em tom direto e operacional (este e um documento interno, nao para o cliente).

Chame a tool record_production_plan exatamente uma vez com os tres artefatos completos.`;

export const PRODUCTION_PLAN_TOOL_NAME = "record_production_plan";

const materialListItemSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, description: "Nome exato de um material do catalogo fornecido." },
    category: { type: "string" as const },
    quantity: { type: "string" as const, description: 'Estimativa pratica, ex.: "40 unidades", "15 buques medios".' },
    notes: { type: "string" as const },
  },
  required: ["name", "category", "quantity"],
};

const setupScheduleStepSchema = {
  type: "object" as const,
  properties: {
    label: { type: "string" as const },
    timing: { type: "string" as const, description: 'Horario relativo, ex.: "6h antes da cerimonia".' },
    durationEstimate: { type: "string" as const, description: 'Ex.: "2h".' },
    description: { type: "string" as const },
  },
  required: ["label", "timing", "durationEstimate", "description"],
};

const checklistItemSchema = {
  type: "object" as const,
  properties: {
    label: { type: "string" as const },
    category: { type: "string" as const, description: 'Ex.: "Fornecedores", "Equipe", "Logistica", "Materiais".' },
    description: { type: "string" as const },
  },
  required: ["label", "category"],
};

export function buildProductionPlanToolSchema(catalogMaterialNames: string[]) {
  const nameProperty =
    catalogMaterialNames.length > 0
      ? { ...materialListItemSchema.properties.name, enum: catalogMaterialNames }
      : materialListItemSchema.properties.name;

  return {
    name: PRODUCTION_PLAN_TOOL_NAME,
    description: "Registra o Plano de Producao (lista de materiais, cronograma de montagem, checklist).",
    input_schema: {
      type: "object" as const,
      properties: {
        materialsList: {
          type: "array" as const,
          items: { ...materialListItemSchema, properties: { ...materialListItemSchema.properties, name: nameProperty } },
        },
        setupSchedule: { type: "array" as const, items: setupScheduleStepSchema },
        checklist: { type: "array" as const, items: checklistItemSchema },
      },
      required: ["materialsList", "setupSchedule", "checklist"],
    },
  };
}
