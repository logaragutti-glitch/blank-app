const createMock = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

// eslint-disable-next-line import/first
import { AnthropicEveChatProvider } from "./anthropic-eve-chat.provider";
// eslint-disable-next-line import/first
import type { EveChatInput } from "./eve-chat.port";

function buildInput(overrides: Partial<EveChatInput> = {}): EveChatInput {
  return {
    context: {
      clientNames: "Karen & Daniel",
      eventType: "WEDDING",
      ceremonyDateTime: null,
      guestsExpected: 100,
      budgetAmount: 26770,
      venueName: "Villa Massari",
      latestProposal: { status: "DRAFT", conceptName: "Jardim Romântico", wowScore: 87 },
      tasks: [{ title: "Confirmar buffet", status: "TODO", dueDate: null }],
      team: [{ name: "Bia", role: "Cerimonialista" }],
      suppliers: [{ name: "Flores da Serra", category: "FLORIST", status: "BOOKED" }],
    },
    history: [],
    question: "Qual o status da proposta?",
    ...overrides,
  };
}

describe("AnthropicEveChatProvider", () => {
  let provider: AnthropicEveChatProvider;

  beforeEach(() => {
    createMock.mockReset();
    provider = new AnthropicEveChatProvider();
  });

  it("returns EVE's text reply, grounded by the context and history", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "A proposta está em rascunho, com o conceito Jardim Romântico." }],
    });

    const result = await provider.reply(buildInput());

    expect(result).toBe("A proposta está em rascunho, com o conceito Jardim Romântico.");
    const call = createMock.mock.calls[0]?.[0];
    expect(call.system).toContain("Karen & Daniel");
    expect(call.system).toContain("Confirmar buffet");
    expect(call.messages).toEqual([{ role: "user", content: "Qual o status da proposta?" }]);
  });

  it("includes prior turns in the messages array", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Claro, mais alguma coisa?" }],
    });

    await provider.reply(
      buildInput({
        history: [
          { role: "USER", content: "Oi EVE" },
          { role: "ASSISTANT", content: "Oi! Como posso ajudar?" },
        ],
      }),
    );

    const call = createMock.mock.calls[0]?.[0];
    expect(call.messages).toEqual([
      { role: "user", content: "Oi EVE" },
      { role: "assistant", content: "Oi! Como posso ajudar?" },
      { role: "user", content: "Qual o status da proposta?" },
    ]);
  });

  it("throws when the reply is truncated (max_tokens)", async () => {
    createMock.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "resposta cortada..." }],
    });

    await expect(provider.reply(buildInput())).rejects.toThrow(/cut off/);
  });

  it("throws when no text block is returned", async () => {
    createMock.mockResolvedValue({ stop_reason: "end_turn", content: [] });
    await expect(provider.reply(buildInput())).rejects.toThrow(/did not return a text reply/);
  });
});
