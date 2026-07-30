import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";
import { ProposalComponentsPort } from "../src/modules/creative/ai/proposal-components.port";
import type { ProposalComponentsResult } from "../src/modules/creative/ai/proposal-components.port";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// Garden Fine Art style, Peonia material.
const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

// Agente 1/3 (Anthropic) have no live credentials in this environment (see
// conversation) — mocked here so the suite still exercises the real HTTP
// layer, context gathering (Client/Event/Venue/Knowledge Graph), and the
// Proposal/ProposalComponent writes to Postgres end to end.
const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};
const proposalComponentsMock: jest.Mocked<ProposalComponentsPort> = {
  generate: jest.fn(),
};

function buildNarrativeBlock(label: string) {
  return { title: `Título ${label}`, description: `Descrição ${label}` };
}

function buildProposalComponentsResult(): ProposalComponentsResult {
  return {
    concept: buildNarrativeBlock("Entre Montanhas e Flores"),
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

describe("Creative / Diagnostico Criativo (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let gardenFineArtStyleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
      .overrideProvider(ProposalComponentsPort)
      .useValue(proposalComponentsMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const prisma = app.get(PrismaService);
    const venue = await prisma.venue.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Villa Massari" },
    });
    venueId = venue.id;
    const style = await prisma.eventStyle.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Garden Fine Art" },
    });
    gardenFineArtStyleId = style.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 for an unknown event", async () => {
    await request(app.getHttpServer())
      .post("/creative/00000000-0000-0000-0000-000000009999/diagnostico-criativo")
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .expect(404);
  });

  it("generates the Diagnostico Criativo and persists it as a Proposal", async () => {
    diagnosticoCriativoMock.generate.mockResolvedValueOnce({
      diagnosis: {
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
      },
      matchedEventStyleId: gardenFineArtStyleId,
    });

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .send({
        partnerOneName: "Elis",
        partnerTwoName: "Fábio",
        lifestyleTags: ["Romântico", "Natural"],
        venueId,
      })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const response = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .expect(201);

    expect(response.body.eventStyleId).toBe(gardenFineArtStyleId);
    expect(response.body.diagnosticoCriativo.estiloPredominante).toBe("Garden Fine Art");
    expect(response.body.diagnosticoCriativo.materiaisRecomendados).toEqual(["Peônia"]);
    expect(response.body.status).toBe("DRAFT");

    const listResponse = await request(app.getHttpServer())
      .get(`/creative/${eventId}/proposals`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(response.body.id);
  });

  it("computes the WOW Score from the event's emotional profile and the matched style", async () => {
    diagnosticoCriativoMock.generate.mockResolvedValueOnce({
      diagnosis: {
        perfilCasal: "Romântico contemporâneo",
        atmosferaDesejada: "Elegância leve e acolhedora",
        estiloPredominante: "Garden Fine Art",
        paletaSugerida: ["rosé", "verde sálvia"],
        mobiliarioSugerido: ["madeira clara"],
        iluminacaoSugerida: "Luz quente e velas",
        materiaisRecomendados: ["Peônia"],
        compatibilidadeComEspaco: "A Villa Massari favorece cerimônia externa.",
        justificativa: "O casal indicou preferência natural e romântica.",
        promptVersion: "v1",
      },
      matchedEventStyleId: gardenFineArtStyleId,
    });

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .send({ partnerOneName: "Lia", partnerTwoName: "Theo", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    // The GENOME's dnaScores aren't captured by any endpoint yet (a
    // separate, not-yet-built capability) — set directly for this test,
    // using the same dimension names as the seeded Garden Fine Art style
    // (dimensionScores: { Luxuoso: 8.0, Natural: 7.8 }) so the coherence
    // half of computeWowScore has real shared dimensions to compare.
    const prisma = app.get(PrismaService);
    await prisma.event.update({
      where: { id: eventId },
      data: { dnaScores: { Luxuoso: 82, Natural: 78 } },
    });

    const response = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .expect(201);

    expect(typeof response.body.wowScore).toBe("number");
    expect(response.body.wowScore).toBeGreaterThan(0);
    expect(response.body.wowScore).toBeLessThanOrEqual(100);
  });

  it("returns 503 with a clear message when Agente 1 fails, without persisting a Proposal", async () => {
    diagnosticoCriativoMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .send({ partnerOneName: "Gabi", partnerTwoName: "Hugo", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const response = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);

    const listResponse = await request(app.getHttpServer())
      .get(`/creative/${eventId}/proposals`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(200);
    expect(listResponse.body).toHaveLength(0);
  });
});

describe("Creative / Proposal Components (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let proposalId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
      .overrideProvider(ProposalComponentsPort)
      .useValue(proposalComponentsMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const prisma = app.get(PrismaService);
    const venue = await prisma.venue.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Villa Massari" },
    });
    venueId = venue.id;
    const gardenFineArtStyle = await prisma.eventStyle.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Garden Fine Art" },
    });

    diagnosticoCriativoMock.generate.mockResolvedValueOnce({
      diagnosis: {
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
      },
      matchedEventStyleId: gardenFineArtStyle.id,
    });

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .send({ partnerOneName: "Iris", partnerTwoName: "João", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const proposalResponse = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .query({ tenantId: TENANT_ID, organizationId: ORGANIZATION_ID })
      .expect(201);
    proposalId = proposalResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 for an unknown proposal", async () => {
    await request(app.getHttpServer())
      .post("/creative/proposals/00000000-0000-0000-0000-000000009999/components")
      .query({ organizationId: ORGANIZATION_ID })
      .expect(404);
  });

  it("returns 400 for the document endpoint before any component has been generated", async () => {
    const response = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/document`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(400);
    expect(response.body.message).toMatch(/no components yet/);
  });

  it("generates and persists the 18 proposal components, and sets the Proposal's concept name", async () => {
    proposalComponentsMock.generate.mockResolvedValueOnce(buildProposalComponentsResult());

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/components`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(201);

    expect(response.body).toHaveLength(18);
    const componentTypes = response.body.map((component: { type: string }) => component.type);
    expect(componentTypes).toEqual([
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

    const concept = response.body.find((c: { type: string }) => c.type === "CONCEPT");
    expect(concept.content.name).toBe("Título Entre Montanhas e Flores");

    const listResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/components`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(200);
    expect(listResponse.body).toHaveLength(18);

    const proposalsResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/components`)
      .query({ organizationId: "00000000-0000-0000-0000-000000000099" })
      .expect(404);
    expect(proposalsResponse.body.message).toMatch(/Proposal not found/);
  });

  it("returns the assembled document (Proposal + ordered components) once components exist", async () => {
    const response = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/document`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(200);

    expect(response.body.proposal.id).toBe(proposalId);
    expect(response.body.components).toHaveLength(18);
    expect(response.body.components[0].type).toBe("COVER");
  });

  it("returns 404 for the document endpoint when the proposal does not exist", async () => {
    await request(app.getHttpServer())
      .get("/creative/proposals/00000000-0000-0000-0000-000000009999/document")
      .query({ organizationId: ORGANIZATION_ID })
      .expect(404);
  });

  it("returns 503 with a clear message when Agente 3 fails", async () => {
    proposalComponentsMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/components`)
      .query({ organizationId: ORGANIZATION_ID })
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);
  });
});
