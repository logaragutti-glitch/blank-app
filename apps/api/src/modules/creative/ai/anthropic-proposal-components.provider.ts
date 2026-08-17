import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
  PROPOSAL_COMPONENTS_TOOL_NAME,
  buildProposalComponentsToolSchema,
} from "./prompts/proposal-components.prompt";
import { ProposalComponentsPort } from "./proposal-components.port";
import type {
  NarrativeBlock,
  ProposalComponentsInput,
  ProposalComponentsResult,
  ProposalNarrativeKey,
} from "./proposal-components.port";

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

const NARRATIVE_COMPONENT_LABELS: Record<ProposalNarrativeKey, string> = {
  concept: "Conceito criativo",
  coupleStory: "História do casal",
  entrance: "Entrada",
  ceremony: "Cerimônia",
  cakeTable: "Mesa do bolo",
  lounge: "Lounge",
  guestTables: "Mesas dos convidados",
  bar: "Bar",
  buffet: "Buffet",
  danceFloor: "Pista de dança",
  lighting: "Iluminação",
  florals: "Florais",
};

function isNarrativeBlock(value: unknown): value is NarrativeBlock {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).title === "string" &&
    typeof (value as Record<string, unknown>).description === "string"
  );
}

const MAX_GENERATION_ATTEMPTS = 2;

function buildUserPrompt(
  input: ProposalComponentsInput,
  repairAttempt = false,
  previousError?: string,
): string {
  const { client, event, venue, diagnostico } = input;
  const repairInstruction = repairAttempt
    ? `\n\nEsta é uma tentativa de reparo. A resposta anterior não foi aceita porque ${previousError ?? "não trouxe todos os campos"}. Gere novamente os 12 componentes completos, chamando a tool uma única vez. Não omita nenhum campo e confirme internamente que cada bloco tem title e description.`
    : "";

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

Gere os 12 componentes narrativos chamando a tool.${repairInstruction}`;
}

function isRetryableStructuredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /truncated|missing or malformed|no tool_use|incomplete proposal components/i.test(error.message)
  );
}

@Injectable()
export class AnthropicProposalComponentsProvider implements ProposalComponentsPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_PROPOSAL_COMPONENTS_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  private async generateOnce(
    input: ProposalComponentsInput,
    repairAttempt: boolean,
    previousError?: string,
  ): Promise<ProposalComponentsResult> {
    const message = await this.getClient().messages.create({
      // 12 narrative blocks need a generous budget. A second pass is only
      // used for structured-output failures, never for auth/configuration
      // errors, so a missing API key is surfaced immediately.
      max_tokens: 6144,
      model: this.model,
      system: PROPOSAL_COMPONENTS_SYSTEM_PROMPT,
      tools: [buildProposalComponentsToolSchema()],
      tool_choice: { type: "tool", name: PROPOSAL_COMPONENTS_TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input, repairAttempt, previousError) }],
    });

    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "Agente 3 response was truncated before all 12 proposal components were generated (max_tokens reached).",
      );
    }

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(
        "Agente 3 did not return structured proposal components (no tool_use block).",
      );
    }

    const result = toolUse.input as Partial<
      Record<(typeof REQUIRED_NARRATIVE_KEYS)[number], unknown>
    >;
    const missingOrMalformed = REQUIRED_NARRATIVE_KEYS.filter(
      (key) => !isNarrativeBlock(result[key]),
    );
    if (missingOrMalformed.length > 0) {
      throw new Error(
        `Agente 3 returned incomplete proposal components (missing or malformed: ${missingOrMalformed.join(", ")}).`,
      );
    }

    return result as unknown as ProposalComponentsResult;
  }

  async generate(input: ProposalComponentsInput): Promise<ProposalComponentsResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        return await this.generateOnce(
          input,
          attempt > 0,
          lastError instanceof Error ? lastError.message : undefined,
        );
      } catch (error) {
        lastError = error;
        if (!isRetryableStructuredError(error) || attempt === MAX_GENERATION_ATTEMPTS - 1)
          throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Agente 3 failed without a diagnostic.");
  }

  async regenerate(
    input: ProposalComponentsInput,
    component: ProposalNarrativeKey,
    current: NarrativeBlock,
  ): Promise<NarrativeBlock> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        const label = NARRATIVE_COMPONENT_LABELS[component];
        const message = await this.getClient().messages.create({
          max_tokens: 1536,
          model: this.model,
          system: `${PROPOSAL_COMPONENTS_SYSTEM_PROMPT}\n\nNesta chamada, gere somente o componente solicitado.`,
          tools: [
            {
              name: "record_proposal_component",
              description: `Registra somente o componente ${label}.`,
              input_schema: {
                type: "object" as const,
                properties: {
                  title: { type: "string" as const },
                  description: { type: "string" as const },
                },
                required: ["title", "description"],
              },
            },
          ],
          tool_choice: { type: "tool", name: "record_proposal_component" },
          messages: [
            {
              role: "user",
              content: `${buildUserPrompt(input)}\n\nComponente a regenerar: ${label}.\nConteúdo atual: título="${current.title}"; descrição="${current.description}".\nGere somente este componente, mantendo coerência com o projeto e escrevendo 2 a 4 frases em português do Brasil.${attempt > 0 ? `\nA tentativa anterior falhou: ${lastError instanceof Error ? lastError.message : "resposta incompleta"}. Retorne title e description completos.` : ""}`,
            },
          ],
        });

        if (message.stop_reason === "max_tokens")
          throw new Error("Regeneração seletiva foi truncada por limite de tokens.");
        const toolUse = message.content.find((block) => block.type === "tool_use");
        if (!toolUse || toolUse.type !== "tool_use" || !isNarrativeBlock(toolUse.input)) {
          throw new Error(`Regeneração seletiva de ${label} retornou uma resposta incompleta.`);
        }
        return toolUse.input;
      } catch (error) {
        lastError = error;
        if (!isRetryableStructuredError(error) || attempt === MAX_GENERATION_ATTEMPTS - 1)
          throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Regeneração seletiva falhou sem diagnóstico.");
  }
}
