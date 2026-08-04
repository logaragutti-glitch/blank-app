const createMock = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

// eslint-disable-next-line import/first
import type { DiagnosticoCriativo } from "@eve-os/types";
// eslint-disable-next-line import/first
import { AnthropicProposalComponentsProvider } from "./anthropic-proposal-components.provider";
// eslint-disable-next-line import/first
import type { ProposalComponentsInput, ProposalComponentsResult } from "./proposal-components.port";

const DIAGNOSTICO: DiagnosticoCriativo = {
  perfilCasal: "Romântico contemporâneo",
  atmosferaDesejada: "Elegância leve e acolhedora",
  estiloPredominante: "Garden Fine Art",
  paletaSugerida: ["rosé", "verde sálvia", "champagne"],
  mobiliarioSugerido: ["madeira clara"],
  iluminacaoSugerida: "Luz quente e velas",
  materiaisRecomendados: ["Peônia"],
  compatibilidadeComEspaco: "A Villa Massari favorece cerimônia externa.",
  justificativa: "O casal indicou preferência natural e romântica.",
  promptVersion: "v1",
};

function buildInput(overrides: Partial<ProposalComponentsInput> = {}): ProposalComponentsInput {
  return {
    client: {
      partnerOneName: "Karen",
      partnerTwoName: "Daniel",
      howTheyMet: "Em uma viagem de amigos",
      proposalStory: "Ele pediu em casamento na praia",
    },
    event: { type: "WEDDING", guestsExpected: 100 },
    venue: {
      name: "Villa Massari",
      recommendationNotes: ["cerimônia externa"],
      structuralConstraints: null,
    },
    diagnostico: DIAGNOSTICO,
    ...overrides,
  };
}

function buildNarrativeBlock(label: string) {
  return { title: `Título ${label}`, description: `Descrição ${label}` };
}

function buildToolResult(): ProposalComponentsResult {
  return {
    concept: buildNarrativeBlock("Conceito"),
    coupleStory: buildNarrativeBlock("Casal"),
    entrance: buildNarrativeBlock("Entrada"),
    ceremony: buildNarrativeBlock("Cerimônia"),
    cakeTable: buildNarrativeBlock("Bolo"),
    lounge: buildNarrativeBlock("Lounge"),
    guestTables: buildNarrativeBlock("Mesas"),
    bar: buildNarrativeBlock("Bar"),
    buffet: buildNarrativeBlock("Buffet"),
    danceFloor: buildNarrativeBlock("Pista"),
    lighting: buildNarrativeBlock("Iluminação"),
    florals: buildNarrativeBlock("Florais"),
  };
}

describe("AnthropicProposalComponentsProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns the 12 narrative components from the tool_use block", async () => {
    const toolResult = buildToolResult();
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_proposal_components", input: toolResult }],
    });

    const provider = new AnthropicProposalComponentsProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual(toolResult);
  });

  it("throws when the model does not return a tool_use block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "desculpe" }] });
    const provider = new AnthropicProposalComponentsProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(
      /did not return structured proposal components/,
    );
  });

  it("throws a clear error instead of returning truncated components when max_tokens is hit", async () => {
    // Real Anthropic responses can exhaust max_tokens mid-JSON for a tool
    // call this large (12 narrative blocks) — the SDK still returns a
    // tool_use block, just with an incomplete/malformed `input`. This must
    // fail loudly here, not crash downstream reading `.title` off undefined.
    createMock.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "tool_use", name: "record_proposal_components", input: {} }],
    });
    const provider = new AnthropicProposalComponentsProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/truncated/);
  });

  it("throws a clear error when the tool_use input is missing required components", async () => {
    const incomplete: Partial<ProposalComponentsResult> = buildToolResult();
    delete incomplete.concept;
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_proposal_components", input: incomplete }],
    });
    const provider = new AnthropicProposalComponentsProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/missing or malformed: concept/);
  });

  it("throws a clear error when a component is malformed (missing title/description)", async () => {
    const toolResult = buildToolResult();
    const malformed = { ...toolResult, bar: { title: "Bar" } };
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_proposal_components", input: malformed }],
    });
    const provider = new AnthropicProposalComponentsProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/missing or malformed: bar/);
  });
});
