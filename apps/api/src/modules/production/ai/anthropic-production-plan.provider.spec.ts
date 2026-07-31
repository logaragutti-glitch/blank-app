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
import { AnthropicProductionPlanProvider } from "./anthropic-production-plan.provider";
// eslint-disable-next-line import/first
import type { ProductionPlanInput, ProductionPlanResult } from "./production-plan.port";

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

function buildInput(overrides: Partial<ProductionPlanInput> = {}): ProductionPlanInput {
  return {
    conceptName: "Entre Montanhas e Flores",
    event: { type: "WEDDING", guestsExpected: 100, ceremonyDateTime: "2027-03-20T18:00:00.000Z" },
    venue: {
      name: "Villa Massari",
      recommendationNotes: ["cerimônia externa"],
      structuralConstraints: null,
    },
    diagnostico: DIAGNOSTICO,
    catalogMaterials: [{ name: "Peônia", category: "FLOWER" }],
    ...overrides,
  };
}

function buildToolResult(): ProductionPlanResult {
  return {
    materialsList: [{ name: "Peônia", category: "FLOWER", quantity: "40 buquês médios" }],
    setupSchedule: [
      {
        label: "Montagem da decoração",
        timing: "6h antes da cerimônia",
        durationEstimate: "3h",
        description: "Instalação das flores, mobiliário e iluminação no jardim.",
      },
    ],
    checklist: [{ label: "Confirmar fornecedor de flores", category: "Fornecedores" }],
  };
}

describe("AnthropicProductionPlanProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns the production plan from the tool_use block", async () => {
    const toolResult = buildToolResult();
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_production_plan", input: toolResult }],
    });

    const provider = new AnthropicProductionPlanProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual(toolResult);
  });

  it("constrains the materials list to the catalog materials provided", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_production_plan", input: buildToolResult() }],
    });

    const provider = new AnthropicProductionPlanProvider();
    await provider.generate(buildInput());

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          expect.objectContaining({
            input_schema: expect.objectContaining({
              properties: expect.objectContaining({
                materialsList: expect.objectContaining({
                  items: expect.objectContaining({
                    properties: expect.objectContaining({
                      name: expect.objectContaining({ enum: ["Peônia"] }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        ],
      }),
    );
  });

  it("throws when the model does not return a tool_use block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "desculpe" }] });
    const provider = new AnthropicProductionPlanProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(/did not return a structured production plan/);
  });
});
