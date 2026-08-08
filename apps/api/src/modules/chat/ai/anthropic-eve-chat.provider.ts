import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { EVE_CHAT_SYSTEM_PROMPT } from "./prompts/eve-chat.prompt";
import { EveChatPort, type EveChatInput, type EveChatProjectContext, type EveChatProposalComponentSummary } from "./eve-chat.port";

// Portuguese labels matching Capitulo 7's own naming (03-product-spec.md) —
// same data as proposal-pdf-builder.ts's own copy, kept separately here
// since it's this provider's own presentation concern (a prompt-formatting
// detail), not a shared domain type. Falls back to the raw type for any
// value not in this map, so a future ComponentType is never silently
// dropped from what EVE can see.
const COMPONENT_LABELS: Record<string, string> = {
  COVER: "Capa",
  BIA_STORY: "História da Bia",
  COUPLE_STORY: "História do casal",
  CONCEPT: "Conceito criativo",
  MOODBOARD: "Moodboard",
  PALETTE: "Paleta",
  ENTRANCE: "Entrada",
  CEREMONY: "Cerimônia",
  CAKE_TABLE: "Mesa do bolo",
  LOUNGE: "Lounge",
  GUEST_TABLES: "Mesas dos convidados",
  BAR: "Bar",
  BUFFET: "Buffet",
  DANCE_FLOOR: "Pista",
  LIGHTING: "Iluminação",
  FLORALS: "Florais",
  TIMELINE: "Cronograma",
  INVESTMENT: "Investimento",
};

// Renders one component's actual content into a short, readable line —
// same content-shape switch proposal-pdf-builder.ts and
// ProposalComponentCard (apps/web) already use, just as plain text instead
// of a formatted page. Falls back to whatever string fields exist rather
// than a type-by-type case for narrative components, since they all share
// the same title/description-or-name/text shape.
function formatComponent(component: EveChatProposalComponentSummary): string {
  const label = COMPONENT_LABELS[component.type] ?? component.type;
  const { content } = component;

  switch (component.type) {
    case "PALETTE": {
      const colors = (content.colors as string[] | undefined) ?? [];
      return `- ${label}: ${colors.length > 0 ? colors.join(", ") : "ainda sem cores definidas"}`;
    }
    case "MOODBOARD": {
      const parts = (["fabrics", "flowers", "furniture", "lighting", "architecture"] as const)
        .map((key) => (content[key] as string[] | undefined) ?? [])
        .filter((items) => items.length > 0)
        .flat();
      return `- ${label}: ${parts.length > 0 ? parts.join(", ") : "ainda sem itens definidos"}`;
    }
    case "TIMELINE": {
      const steps = (content.steps as { label: string; description: string }[] | undefined) ?? [];
      if (steps.length === 0) return `- ${label}: ainda sem etapas definidas`;
      return `- ${label}: ${steps.map((step) => `${step.label} (${step.description})`).join("; ")}`;
    }
    case "INVESTMENT": {
      const includes = (content.includes as string[] | undefined) ?? [];
      const amount = content.amount as number | null;
      const currency = (content.currency as string | undefined) ?? "";
      const amountText = amount != null ? `${currency} ${amount.toLocaleString("pt-BR")}`.trim() : "ainda não definido";
      return `- ${label}: valor ${amountText}${includes.length > 0 ? `; inclui: ${includes.join(", ")}` : ""}`;
    }
    default: {
      const title = (content.title as string | undefined) ?? (content.name as string | undefined) ?? (content.conceptName as string | undefined);
      const description = (content.description as string | undefined) ?? (content.text as string | undefined);
      return `- ${label}${title ? `: "${title}"` : ""}${description ? ` — ${description}` : ""}`;
    }
  }
}

function formatContext(context: EveChatProjectContext): string {
  const { latestProposal } = context;

  return `## Dados reais deste projeto
- Casal: ${context.clientNames}
- Tipo de evento: ${context.eventType}
- Data/hora da cerimônia: ${context.ceremonyDateTime ?? "ainda não definida"}
- Convidados esperados: ${context.guestsExpected ?? "não informado"}
- Orçamento do evento: ${context.budgetAmount != null ? `R$ ${context.budgetAmount}` : "não informado"}
- Espaço: ${context.venueName ?? "ainda não definido"}

### Proposta
${
  latestProposal
    ? `Status: ${latestProposal.status} · Conceito: ${latestProposal.conceptName ?? "ainda sem nome"} · WOW Score: ${latestProposal.wowScore ?? "ainda não calculado"}`
    : "Nenhuma proposta gerada ainda para este projeto."
}

### Conteúdo da proposta (${context.proposalComponents.length} ${context.proposalComponents.length === 1 ? "seção" : "seções"})
${
  context.proposalComponents.length === 0
    ? "A proposta ainda não tem seções geradas (ou ainda não existe proposta)."
    : [...context.proposalComponents]
        .sort((a, b) => a.order - b.order)
        .map(formatComponent)
        .join("\n")
}

### Tarefas (${context.tasks.length})
${
  context.tasks.length === 0
    ? "Nenhuma tarefa cadastrada ainda."
    : context.tasks
        .map((task) => `- "${task.title}" — status: ${task.status}${task.dueDate ? `, prazo: ${task.dueDate}` : ""}`)
        .join("\n")
}

### Equipe (${context.team.length})
${
  context.team.length === 0
    ? "Ninguém foi atribuído a este projeto ainda."
    : context.team.map((member) => `- ${member.name} (${member.role})`).join("\n")
}

### Fornecedores (${context.suppliers.length})
${
  context.suppliers.length === 0
    ? "Nenhum fornecedor vinculado a este projeto ainda."
    : context.suppliers
        .map((supplier) => `- ${supplier.name} (${supplier.category}) — status: ${supplier.status}`)
        .join("\n")
}`;
}

@Injectable()
export class AnthropicEveChatProvider implements EveChatPort {
  private client: Anthropic | undefined;
  private readonly model = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-5";

  private getClient(): Anthropic {
    this.client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async reply(input: EveChatInput): Promise<string> {
    const system = `${EVE_CHAT_SYSTEM_PROMPT}\n\n${formatContext(input.context)}`;

    const message = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [
        ...input.history.map((entry) => ({
          role: entry.role === "USER" ? ("user" as const) : ("assistant" as const),
          content: entry.content,
        })),
        { role: "user" as const, content: input.question },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("EVE did not return a text reply.");
    }
    // A reply cut off mid-sentence is worse than an honest error — see the
    // proposal-components truncation bug this same check was added for.
    if (message.stop_reason === "max_tokens") {
      throw new Error("EVE's reply was cut off (max_tokens reached) — try a shorter question.");
    }
    return textBlock.text;
  }
}
