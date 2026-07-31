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
import { AnthropicBudgetAnalysisProvider } from "./anthropic-budget-analysis.provider";
// eslint-disable-next-line import/first
import type { BudgetAnalysisInput, BudgetAnalysisResult } from "./budget-analysis.port";

const DIAGNOSTICO: DiagnosticoCriativo = {
  perfilCasal: "Romântico contemporâneo",
  atmosferaDesejada: "Elegância leve e acolhedora",
  estiloPredominante: "Garden Fine Art",
  paletaSugerida: ["rosé"],
  mobiliarioSugerido: ["madeira clara"],
  iluminacaoSugerida: "Luz quente",
  materiaisRecomendados: ["Peônia"],
  compatibilidadeComEspaco: "Combina bem",
  justificativa: "Porque sim",
  promptVersion: "v1",
};

function buildInput(overrides: Partial<BudgetAnalysisInput> = {}): BudgetAnalysisInput {
  return {
    conceptName: "Entre Montanhas e Flores",
    event: { type: "WEDDING", guestsExpected: 100 },
    diagnostico: DIAGNOSTICO,
    catalogMaterials: [{ name: "Peônia", category: "FLOWER" }],
    ...overrides,
  };
}

function buildToolResult(): BudgetAnalysisResult {
  return { materialEstimates: [{ materialName: "Peônia", estimatedQuantity: 40 }] };
}

describe("AnthropicBudgetAnalysisProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns the material estimates from the tool_use block", async () => {
    const toolResult = buildToolResult();
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_budget_analysis", input: toolResult }],
    });

    const provider = new AnthropicBudgetAnalysisProvider();
    const result = await provider.generate(buildInput());

    expect(result).toEqual(toolResult);
  });

  it("constrains material names to the catalog materials provided", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "record_budget_analysis", input: buildToolResult() }],
    });

    const provider = new AnthropicBudgetAnalysisProvider();
    await provider.generate(buildInput());

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          expect.objectContaining({
            input_schema: expect.objectContaining({
              properties: expect.objectContaining({
                materialEstimates: expect.objectContaining({
                  items: expect.objectContaining({
                    properties: expect.objectContaining({
                      materialName: expect.objectContaining({ enum: ["Peônia"] }),
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
    const provider = new AnthropicBudgetAnalysisProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(
      /did not return a structured budget analysis/,
    );
  });
});
