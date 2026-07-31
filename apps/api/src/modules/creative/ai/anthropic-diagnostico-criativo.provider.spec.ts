const createMock = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

// eslint-disable-next-line import/first
import { AnthropicDiagnosticoCriativoProvider } from "./anthropic-diagnostico-criativo.provider";
// eslint-disable-next-line import/first
import type { DiagnosticoCriativoInput } from "./diagnostico-criativo.port";

function buildInput(overrides: Partial<DiagnosticoCriativoInput> = {}): DiagnosticoCriativoInput {
  return {
    client: {
      partnerOneName: "Karen",
      partnerTwoName: "Daniel",
      lifestyleTags: ["Romântico", "Natural"],
      hobbies: [],
      howTheyMet: null,
      likesBeach: false,
      likesCountryside: true,
      budgetAmount: 26770,
      budgetCurrency: "BRL",
      dietaryRestrictions: [],
    },
    event: { type: "WEDDING", guestsExpected: 100, ceremonyDateTime: null, budgetAmount: 26770 },
    venue: {
      name: "Villa Massari",
      recommendationNotes: ["cerimônia externa", "iluminação quente"],
      typicalClimate: null,
      structuralConstraints: null,
    },
    inspirationImages: [
      { visionTags: { flowers: ["peônias"] }, visionDescription: "Um jardim romântico." },
    ],
    candidateStyles: [
      {
        id: "style-garden-fine-art",
        name: "Garden Fine Art",
        dimensionScores: { Luxuoso: 8, Natural: 7.8 },
        paletteColors: ["rosé", "verde sálvia"],
        furnitureNotes: ["madeira clara"],
        loungeNotes: ["fibra natural"],
      },
    ],
    catalogMaterials: [
      {
        name: "Peônia",
        category: "FLOWER",
        emotions: ["Romance"],
        neverRecommend: false,
        compatibleStyleNames: ["Garden Fine Art"],
      },
      {
        name: "Neon",
        category: "LIGHTING",
        emotions: [],
        neverRecommend: true,
        compatibleStyleNames: [],
      },
    ],
    ...overrides,
  };
}

describe("AnthropicDiagnosticoCriativoProvider", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("builds the diagnosis and resolves the matched event style id", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "record_diagnostico_criativo",
          input: {
            perfilCasal: "Romântico contemporâneo",
            atmosferaDesejada: "Elegância leve e acolhedora",
            estiloPredominanteId: "style-garden-fine-art",
            estiloPredominante: "Garden Fine Art",
            paletaSugerida: ["rosé", "verde sálvia", "champagne"],
            mobiliarioSugerido: ["madeira clara"],
            iluminacaoSugerida: "Luz quente e velas",
            materiaisRecomendados: ["Peônia"],
            compatibilidadeComEspaco: "A Villa Massari favorece cerimônia externa com essa paleta.",
            justificativa: "O casal indicou preferência natural e romântica.",
          },
        },
      ],
    });

    const provider = new AnthropicDiagnosticoCriativoProvider();
    const result = await provider.generate(buildInput());

    expect(result.matchedEventStyleId).toBe("style-garden-fine-art");
    expect(result.diagnosis.estiloPredominante).toBe("Garden Fine Art");
    expect(result.diagnosis.materiaisRecomendados).toEqual(["Peônia"]);
    expect(result.diagnosis.promptVersion).toBe("v1");
  });

  it("returns null matchedEventStyleId when the model picks an id outside the candidates", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "record_diagnostico_criativo",
          input: {
            perfilCasal: "x",
            atmosferaDesejada: "x",
            estiloPredominanteId: "not-a-real-id",
            estiloPredominante: "Algo inventado",
            compatibilidadeComEspaco: "x",
            justificativa: "x",
          },
        },
      ],
    });

    const provider = new AnthropicDiagnosticoCriativoProvider();
    const result = await provider.generate(buildInput());
    expect(result.matchedEventStyleId).toBeNull();
  });

  it("throws when there are no candidate styles", async () => {
    const provider = new AnthropicDiagnosticoCriativoProvider();
    await expect(provider.generate(buildInput({ candidateStyles: [] }))).rejects.toThrow(
      /No candidate EventStyles/,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("throws when the model does not return a tool_use block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "desculpe" }] });
    const provider = new AnthropicDiagnosticoCriativoProvider();
    await expect(provider.generate(buildInput())).rejects.toThrow(
      /did not return a structured Diagnostico Criativo/,
    );
  });
});
