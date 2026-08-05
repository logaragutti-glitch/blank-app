import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { EVE_CHAT_SYSTEM_PROMPT } from "./prompts/eve-chat.prompt";
import { EveChatPort, type EveChatInput, type EveChatProjectContext } from "./eve-chat.port";

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
