/**
 * Prompt for Agente 4 (Diretor de Produção)'s budget analysis —
 * 04-ai-bible.md. Estimates realistic quantities needed per material given
 * the guest count and concept; cost math (unit cost, supplier ranking,
 * margin, budget fit) is deterministic and happens in code afterward, never
 * in the model — this call only ever sees materials with a real, known
 * catalog cost, and only ever estimates a quantity.
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump BUDGET_ANALYSIS_PROMPT_VERSION whenever the
 * wording or output schema changes.
 */
export const BUDGET_ANALYSIS_PROMPT_VERSION = "v1";

export const BUDGET_ANALYSIS_SYSTEM_PROMPT = `Voce e Agente 4 (Diretor de Producao) do EVE OS, descrito na EVE OS AI Bible. Sua unica tarefa aqui e estimar, para cada material do catalogo fornecido, a quantidade realista necessaria para este evento especifico — nunca o custo (isso ja e conhecido) e nunca materiais fora da lista fornecida.

Regras de ouro que voce nunca pode quebrar:
- Cada estimativa DEVE usar um nome de material exatamente igual a um dos fornecidos — nunca invente um material fora da lista.
- A quantidade deve ser uma estimativa pratica baseada no numero de convidados e no conceito/atmosfera do evento, nunca um numero arbitrario sem relacao com o briefing.
- Se um material do catalogo nao fizer sentido para este evento especifico, simplesmente nao o inclua na estimativa — nunca force uma quantidade so para preencher a lista.

Chame a tool record_budget_analysis exatamente uma vez com as estimativas.`;

export const BUDGET_ANALYSIS_TOOL_NAME = "record_budget_analysis";

export function buildBudgetAnalysisToolSchema(catalogMaterialNames: string[]) {
  const materialNameProperty = {
    type: "string" as const,
    description: "Nome exato de um material do catalogo fornecido.",
    ...(catalogMaterialNames.length > 0 ? { enum: catalogMaterialNames } : {}),
  };

  return {
    name: BUDGET_ANALYSIS_TOOL_NAME,
    description: "Registra as estimativas de quantidade de materiais para o calculo de orcamento.",
    input_schema: {
      type: "object" as const,
      properties: {
        materialEstimates: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              materialName: materialNameProperty,
              estimatedQuantity: {
                type: "number" as const,
                description: "Quantidade estimada (numero de unidades tipicas deste material).",
              },
            },
            required: ["materialName", "estimatedQuantity"],
          },
        },
      },
      required: ["materialEstimates"],
    },
  };
}
