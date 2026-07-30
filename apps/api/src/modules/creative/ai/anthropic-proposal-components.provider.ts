import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
  PROPOSAL_COMPONENTS_TOOL_NAME,
  buildProposalComponentsToolSchema,
} from "./prompts/proposal-components.prompt";
import { ProposalComponentsPort } from "./proposal-components.port";
import type { ProposalComponentsInput, ProposalComponentsResult } from "./proposal-components.port";

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
      model: this.model,
      max_tokens: 2048,
      system: PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
      tools: [buildProposalComponentsToolSchema()],
      tool_choice: { type: "tool", name: PROPOSAL_COMPONENTS_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Agente 3 did not return structured proposal components (no tool_use block).");
    }

    return toolUse.input as ProposalComponentsResult;
  }
}
