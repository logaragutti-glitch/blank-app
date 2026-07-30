import type { Client, DiagnosticoCriativo, Event, Venue } from "@eve-os/types";
import { buildProposalComponents } from "./proposal-component-builder";
import type { ProposalComponentsResult } from "./ai/proposal-components.port";

function auditFields() {
  return {
    id: "id-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
  };
}

const CLIENT: Client = {
  ...auditFields(),
  partnerOneName: "Karen",
  partnerTwoName: "Daniel",
  partnerOneProfession: null,
  partnerTwoProfession: null,
  city: null,
  religion: null,
  hobbies: [],
  howTheyMet: null,
  proposalStory: null,
  familyTradition: null,
  lifestyleTags: [],
  likesBeach: null,
  likesCountryside: null,
  budgetAmount: 26770,
  budgetCurrency: "BRL",
  dietaryRestrictions: [],
  accessibilityNeeds: null,
  additionalDetails: null,
};

const EVENT: Event = {
  ...auditFields(),
  type: "WEDDING",
  status: "DIAGNOSED",
  clientId: "client-1",
  venueId: "venue-1",
  guestsExpected: 100,
  ceremonyDateTime: "2026-12-01T18:00:00.000Z",
  budgetAmount: 30000,
  dnaScores: null,
  genome: null,
};

const VENUE: Venue = {
  ...auditFields(),
  name: "Villa Massari",
  structuralConstraints: "Pé-direito baixo no salão interno",
  ceilingHeightMeters: null,
  powerOutlets: null,
  guestCapacity: null,
  existingFurniture: null,
  typicalClimate: null,
  recommendationNotes: ["cerimônia externa"],
};

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

function buildNarrativeBlock(label: string) {
  return { title: `Título ${label}`, description: `Descrição ${label}` };
}

const NARRATIVE: ProposalComponentsResult = {
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

describe("buildProposalComponents", () => {
  it("produces all 18 components, one per ComponentType, in Capitulo 7 order", () => {
    const components = buildProposalComponents({
      client: CLIENT,
      event: EVENT,
      venue: VENUE,
      diagnostico: DIAGNOSTICO,
      narrative: NARRATIVE,
    });

    expect(components).toHaveLength(18);
    expect(components.map((c) => c.type)).toEqual([
      "COVER",
      "BIA_STORY",
      "COUPLE_STORY",
      "CONCEPT",
      "MOODBOARD",
      "PALETTE",
      "ENTRANCE",
      "CEREMONY",
      "CAKE_TABLE",
      "LOUNGE",
      "GUEST_TABLES",
      "BAR",
      "BUFFET",
      "DANCE_FLOOR",
      "LIGHTING",
      "FLORALS",
      "TIMELINE",
      "INVESTMENT",
    ]);
    expect(components.map((c) => c.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ]);
  });

  it("builds the COVER content from the concept name and couple/venue data", () => {
    const components = buildProposalComponents({
      client: CLIENT,
      event: EVENT,
      venue: VENUE,
      diagnostico: DIAGNOSTICO,
      narrative: NARRATIVE,
    });
    const cover = components.find((c) => c.type === "COVER");

    expect(cover?.content).toEqual({
      conceptName: "Título Conceito",
      coupleNames: "Karen & Daniel",
      eventDate: EVENT.ceremonyDateTime,
      venueName: "Villa Massari",
    });
  });

  it("builds the PALETTE content directly from the diagnostico's suggested palette", () => {
    const components = buildProposalComponents({
      client: CLIENT,
      event: EVENT,
      venue: VENUE,
      diagnostico: DIAGNOSTICO,
      narrative: NARRATIVE,
    });
    const palette = components.find((c) => c.type === "PALETTE");
    expect(palette?.content).toEqual({ colors: DIAGNOSTICO.paletaSugerida });
  });

  it("builds the INVESTMENT content with the golden-rule includes list before any amount", () => {
    const components = buildProposalComponents({
      client: CLIENT,
      event: EVENT,
      venue: VENUE,
      diagnostico: DIAGNOSTICO,
      narrative: NARRATIVE,
    });
    const investment = components.find((c) => c.type === "INVESTMENT");
    expect(investment?.content).toEqual({
      includes: [
        "Desenvolvimento criativo",
        "Projeto personalizado",
        "Direção artística",
        "Logística",
        "Montagem",
        "Desmontagem",
        "Coordenação no dia do evento",
      ],
      amount: EVENT.budgetAmount,
      currency: CLIENT.budgetCurrency,
    });
  });
});
