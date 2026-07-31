import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  PRODUCTION_PLAN_SYSTEM_PROMPT,
  PRODUCTION_PLAN_TOOL_NAME,
  buildProductionPlanToolSchema,
} from "./prompts/production-plan.prompt";
import { ProductionPlanPort } from "./production-plan.port";
import type { ProductionPlanInput, ProductionPlanResult } from "./production-plan.port";

function buildUserPrompt(input: ProductionPlanInput): string {
  const { conceptName, event, venue, diagnostico, catalogMaterials } = input;

  return `## Conceito
${conceptName}

## Evento
- Tipo: ${event.type}
- Convidados esperados: ${event.guestsExpected ?? "não informado"}
- Data/hora da cerimônia: ${event.ceremonyDateTime ?? "não informada"}

## Espaço
- Nome: ${venue.name}
- Notas de recomendação do espaço: ${venue.recommendationNotes.join("; ") || "nenhuma"}
- Restrições estruturais: ${venue.structuralConstraints ?? "nenhuma"}

## Diagnóstico Criativo (Agente 1)
- Atmosfera desejada: ${diagnostico.atmosferaDesejada}
- Estilo predominante: ${diagnostico.estiloPredominante}
- Paleta sugerida: ${diagnostico.paletaSugerida.join(", ")}
- Mobiliário sugerido: ${diagnostico.mobiliarioSugerido.join(", ")}
- Iluminação sugerida: ${diagnostico.iluminacaoSugerida}
- Materiais recomendados: ${diagnostico.materiaisRecomendados.join(", ")}

## Catálogo de materiais disponível
${catalogMaterials.map((material) => `- ${material.name} (${material.category})`).join("\n") || "nenhum"}

Gere o Plano de Produção completo chamando a tool.`;
}

@Injectable()
export class AnthropicProductionPlanProvider implements ProductionPlanPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_PRODUCTION_PLAN_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async generate(input: ProductionPlanInput): Promise<ProductionPlanResult> {
    const message = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 4096,
      system: PRODUCTION_PLAN_SYSTEM_PROMPT,
      tools: [buildProductionPlanToolSchema(input.catalogMaterials.map((material) => material.name))],
      tool_choice: { type: "tool", name: PRODUCTION_PLAN_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Agente 4 did not return a structured production plan (no tool_use block).");
    }

    return toolUse.input as ProductionPlanResult;
  }
}
