import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticoCriativo } from "@eve-os/types";
import {
  DIAGNOSTICO_CRIATIVO_PROMPT_VERSION,
  DIAGNOSTICO_CRIATIVO_SYSTEM_PROMPT,
  DIAGNOSTICO_CRIATIVO_TOOL_NAME,
  buildDiagnosticoCriativoToolSchema,
} from "./prompts/diagnostico-criativo.prompt";
import { DiagnosticoCriativoPort } from "./diagnostico-criativo.port";
import type { DiagnosticoCriativoInput, DiagnosticoCriativoResult } from "./diagnostico-criativo.port";

function buildUserPrompt(input: DiagnosticoCriativoInput): string {
  const { client, event, venue, inspirationImages, candidateStyles, catalogMaterials } = input;

  return `## Briefing do casal
- Nomes: ${client.partnerOneName}${client.partnerTwoName ? ` & ${client.partnerTwoName}` : ""}
- Estilo de vida: ${client.lifestyleTags.join(", ") || "não informado"}
- Hobbies: ${client.hobbies.join(", ") || "não informado"}
- Como se conheceram: ${client.howTheyMet ?? "não informado"}
- Gosta de praia: ${client.likesBeach ?? "não informado"} / Gosta de campo: ${client.likesCountryside ?? "não informado"}
- Restrições alimentares: ${client.dietaryRestrictions.join(", ") || "nenhuma"}
- Orçamento do casal: ${client.budgetAmount ?? "não informado"} ${client.budgetCurrency}

## Evento
- Tipo: ${event.type}
- Convidados esperados: ${event.guestsExpected ?? "não informado"}
- Data/hora da cerimônia: ${event.ceremonyDateTime ?? "não informado"}
- Orçamento do evento: ${event.budgetAmount ?? "não informado"}

## Espaço
- Nome: ${venue.name}
- Notas de recomendação do espaço: ${venue.recommendationNotes.join("; ") || "nenhuma"}
- Clima típico: ${venue.typicalClimate ?? "não informado"}
- Restrições estruturais: ${venue.structuralConstraints ?? "nenhuma"}

## Imagens de inspiração analisadas (Agente 2 / Vision AI)
${
  inspirationImages.length === 0
    ? "(nenhuma imagem analisada ainda)"
    : inspirationImages
        .map(
          (image, index) =>
            `${index + 1}. ${image.visionDescription ?? "(sem descrição)"} — tags: ${JSON.stringify(image.visionTags ?? {})}`,
        )
        .join("\n")
}

## Estilos candidatos (Knowledge Graph)
${candidateStyles
  .map(
    (style) =>
      `- id=${style.id} nome="${style.name}" scores=${JSON.stringify(style.dimensionScores)} paleta=${style.paletteColors.join(", ")} mobiliário=${style.furnitureNotes.join(", ")} lounge=${style.loungeNotes.join(", ")}`,
  )
  .join("\n")}

## Catálogo de materiais disponíveis (Knowledge Graph)
${catalogMaterials
  .map(
    (material) =>
      `- "${material.name}" (${material.category})${material.neverRecommend ? " [NUNCA RECOMENDAR]" : ""} — emoções: ${material.emotions.join(", ") || "n/a"} — compatível com: ${material.compatibleStyleNames.join(", ") || "n/a"}`,
  )
  .join("\n")}

Analise tudo acima e produza o Diagnóstico Criativo chamando a tool.`;
}

@Injectable()
export class AnthropicDiagnosticoCriativoProvider implements DiagnosticoCriativoPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_DIAGNOSTICO_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async generate(input: DiagnosticoCriativoInput): Promise<DiagnosticoCriativoResult> {
    const candidateStyleIds = input.candidateStyles.map((style) => style.id);
    if (candidateStyleIds.length === 0) {
      throw new Error(
        "No candidate EventStyles available for this organization — seed the Knowledge Graph first.",
      );
    }

    const message = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 1536,
      system: DIAGNOSTICO_CRIATIVO_SYSTEM_PROMPT,
      tools: [buildDiagnosticoCriativoToolSchema(candidateStyleIds)],
      tool_choice: { type: "tool", name: DIAGNOSTICO_CRIATIVO_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Agente 1 did not return a structured Diagnostico Criativo (no tool_use block).");
    }

    const result = toolUse.input as {
      perfilCasal: string;
      atmosferaDesejada: string;
      estiloPredominanteId: string;
      estiloPredominante: string;
      paletaSugerida?: string[];
      mobiliarioSugerido?: string[];
      iluminacaoSugerida?: string;
      materiaisRecomendados?: string[];
      compatibilidadeComEspaco: string;
      justificativa: string;
    };

    const diagnosis: DiagnosticoCriativo = {
      perfilCasal: result.perfilCasal,
      atmosferaDesejada: result.atmosferaDesejada,
      estiloPredominante: result.estiloPredominante,
      paletaSugerida: result.paletaSugerida ?? [],
      mobiliarioSugerido: result.mobiliarioSugerido ?? [],
      iluminacaoSugerida: result.iluminacaoSugerida ?? "",
      materiaisRecomendados: result.materiaisRecomendados ?? [],
      compatibilidadeComEspaco: result.compatibilidadeComEspaco,
      justificativa: result.justificativa,
      promptVersion: DIAGNOSTICO_CRIATIVO_PROMPT_VERSION,
    };

    return {
      diagnosis,
      matchedEventStyleId: candidateStyleIds.includes(result.estiloPredominanteId)
        ? result.estiloPredominanteId
        : null,
    };
  }
}
