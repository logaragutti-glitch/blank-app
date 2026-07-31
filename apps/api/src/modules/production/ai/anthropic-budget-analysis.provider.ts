import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  BUDGET_ANALYSIS_SYSTEM_PROMPT,
  BUDGET_ANALYSIS_TOOL_NAME,
  buildBudgetAnalysisToolSchema,
} from "./prompts/budget-analysis.prompt";
import { BudgetAnalysisPort } from "./budget-analysis.port";
import type { BudgetAnalysisInput, BudgetAnalysisResult } from "./budget-analysis.port";

function buildUserPrompt(input: BudgetAnalysisInput): string {
  const { conceptName, event, diagnostico, catalogMaterials } = input;

  return `## Conceito
${conceptName}

## Evento
- Tipo: ${event.type}
- Convidados esperados: ${event.guestsExpected ?? "não informado"}

## Diagnóstico Criativo (Agente 1)
- Atmosfera desejada: ${diagnostico.atmosferaDesejada}
- Estilo predominante: ${diagnostico.estiloPredominante}

## Materiais com custo conhecido no catálogo
${catalogMaterials.map((material) => `- ${material.name} (${material.category})`).join("\n") || "nenhum"}

Estime a quantidade necessária de cada material relevante chamando a tool.`;
}

@Injectable()
export class AnthropicBudgetAnalysisProvider implements BudgetAnalysisPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_BUDGET_ANALYSIS_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async generate(input: BudgetAnalysisInput): Promise<BudgetAnalysisResult> {
    const message = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 2048,
      system: BUDGET_ANALYSIS_SYSTEM_PROMPT,
      tools: [buildBudgetAnalysisToolSchema(input.catalogMaterials.map((material) => material.name))],
      tool_choice: { type: "tool", name: BUDGET_ANALYSIS_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Agente 4 did not return a structured budget analysis (no tool_use block).");
    }

    return toolUse.input as BudgetAnalysisResult;
  }
}
