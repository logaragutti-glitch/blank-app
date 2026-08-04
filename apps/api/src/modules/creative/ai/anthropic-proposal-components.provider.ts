import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
  PROPOSAL_COMPONENTS_TOOL_NAME,
  buildProposalComponentsToolSchema,
} from "./prompts/proposal-components.prompt";
import { ProposalComponentsPort } from "./proposal-components.port";
import type { NarrativeBlock, ProposalComponentsInput, ProposalComponentsResult } from "./proposal-components.port";

// Keys the tool schema marks as required (proposal-components.prompt.ts) —
// kept in sync here so a truncated/malformed response can be caught with a
// clear error instead of crashing downstream (buildProposalComponents /
// creative.controller.ts both read `.title`/`.description` off every one of
// these without guarding for undefined).
const REQUIRED_NARRATIVE_KEYS = [
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
] as const satisfies readonly (keyof ProposalComponentsResult)[];

function isNarrativeBlock(value: unknown): value is NarrativeBlock {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).title === "string" &&
    typeof (value as Record<string, unknown>).description === "string"
  );
}

function buildUserPrompt(input: ProposalComponentsInput): string {
  const { client, event, venue, diagnostico } = input;

  return `## Casal
- Nomes: ${client.partnerOneName}${client.partnerTwoName ? ` & ${client.partnerTwoName}` : ""}
- Como se conheceram: ${client.howTheyMet ?? "não informado"}
- Historia do pedido: ${client.proposalStory ?? "não informado"}

## Evento
- Tipo: ${event.type}
- Convidados esperados: ${event.guestsExpected ?? "não informado"}

## Espaço
- Nome: ${venue.name}
- Notas de recomendação do espaço: ${venue.recommendationNotes.join("; ") || "nenhuma"}
- Restrições estruturais: ${venue.structuralConstraints ?? "nenhuma"}

## Diagnóstico Criativo (Agente 1)
- Perfil do casal: ${diagnostico.perfilCasal}
- Atmosfera desejada: ${diagnostico.atmosferaDesejada}
- Estilo predominante: ${diagnostico.estiloPredominante}
- Paleta sugerida: ${diagnostico.paletaSugerida.join(", ")}
- Mobiliário sugerido: ${diagnostico.mobiliarioSugerido.join(", ")}
- Iluminação sugerida: ${diagnostico.iluminacaoSugerida}
- Materiais recomendados: ${diagnostico.materiaisRecomendados.join(", ")}
- Compatibilidade com o espaço: ${diagnostico.compatibilidadeComEspaco}
- Justificativa: ${diagnostico.justificativa}

Gere os 12 componentes narrativos chamando a tool.`;
}

@Injectable()
export class AnthropicProposalComponentsProvider implements ProposalComponentsPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_PROPOSAL_COMPONENTS_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async generate(input: ProposalComponentsInput): Promise<ProposalComponentsResult> {
    const message = await this.getClient().messages.create({
      // 12 narrative blocks (title + 2-4 sentence description each, in
      // Portuguese) routinely need more than the 2048 tokens this used to be
      // capped at — with a real API key that budget was silently exhausted
      // mid-JSON, so the tool call's `input` came back incomplete (fields
      // missing) and crashed downstream with "Cannot read properties of
      // undefined (reading 'title')" instead of failing with a clear error.
      max_tokens: 4096,
      model: this.model,
      system: PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
      tools: [buildProposalComponentsToolSchema()],
      tool_choice: { type: "tool", name: PROPOSAL_COMPONENTS_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "Agente 3 response was truncated before all 12 proposal components were generated (max_tokens reached) — try again or increase max_tokens.",
      );
    }

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Agente 3 did not return structured proposal components (no tool_use block).");
    }

    const result = toolUse.input as Partial<Record<(typeof REQUIRED_NARRATIVE_KEYS)[number], unknown>>;
    const missingOrMalformed = REQUIRED_NARRATIVE_KEYS.filter((key) => !isNarrativeBlock(result[key]));
    if (missingOrMalformed.length > 0) {
      throw new Error(
        `Agente 3 returned incomplete proposal components (missing or malformed: ${missingOrMalformed.join(", ")}).`,
      );
    }

    return result as unknown as ProposalComponentsResult;
  }
}
