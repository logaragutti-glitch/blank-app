import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { ConceptualRenderPort } from "../src/modules/creative/ai/conceptual-render.port";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";
import { ProposalComponentsPort } from "../src/modules/creative/ai/proposal-components.port";
import type { ProposalComponentsResult } from "../src/modules/creative/ai/proposal-components.port";
import { StoragePort } from "../src/infrastructure/storage/storage.port";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// Garden Fine Art style, Peonia material.
const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

// Agente 1/3 (Anthropic), the image-generation provider, and object storage
// have no live credentials/infra in this environment (see conversation) —
// mocked here so the suite still exercises the real HTTP layer, context
// gathering (Client/Event/Venue/Knowledge Graph), and the Proposal/
// ProposalComponent writes to Postgres end to end.
const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};
const proposalComponentsMock: jest.Mocked<ProposalComponentsPort> = {
  generate: jest.fn(),
};
const conceptualRenderMock: jest.Mocked<ConceptualRenderPort> = {
  generate: jest.fn(),
};
const storageMock: jest.Mocked<StoragePort> = {
  upload: jest.fn().mockResolvedValue(undefined),
  getSignedDownloadUrl: jest.fn().mockImplementation(async (key: string) => `https://storage.example.com/${key}`),
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
  let auth: [string, string];

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

    const { accessToken } = await registerTestUser(app, ORGANIZATION_ID);
    auth = authHeader(accessToken);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 for an unknown event", async () => {
    await request(app.getHttpServer())
      .post("/creative/00000000-0000-0000-0000-000000009999/diagnostico-criativo")
      .set(...auth)
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
      .set(...auth)
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
      .set(...auth)
      .expect(201);

    expect(response.body.eventStyleId).toBe(gardenFineArtStyleId);
    expect(response.body.diagnosticoCriativo.estiloPredominante).toBe("Garden Fine Art");
    expect(response.body.diagnosticoCriativo.materiaisRecomendados).toEqual(["Peônia"]);
    expect(response.body.status).toBe("DRAFT");

    const listResponse = await request(app.getHttpServer())
      .get(`/creative/${eventId}/proposals`)
      .set(...auth)
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
      .set(...auth)
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
      .set(...auth)
      .expect(201);

    expect(typeof response.body.wowScore).toBe("number");
    expect(response.body.wowScore).toBeGreaterThan(0);
    expect(response.body.wowScore).toBeLessThanOrEqual(100);
  });

  it("returns 503 with a clear message when Agente 1 fails, without persisting a Proposal", async () => {
    diagnosticoCriativoMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({ partnerOneName: "Gabi", partnerTwoName: "Hugo", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const response = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .set(...auth)
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);

    const listResponse = await request(app.getHttpServer())
      .get(`/creative/${eventId}/proposals`)
      .set(...auth)
      .expect(200);
    expect(listResponse.body).toHaveLength(0);
  });
});

describe("Creative / Proposal Components (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let proposalId: string;
  let auth: [string, string];
  let otherOrgAuth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
      .overrideProvider(ProposalComponentsPort)
      .useValue(proposalComponentsMock)
      .overrideProvider(ConceptualRenderPort)
      .useValue(conceptualRenderMock)
      .overrideProvider(StoragePort)
      .useValue(storageMock)
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

    const { accessToken } = await registerTestUser(app, ORGANIZATION_ID);
    auth = authHeader(accessToken);

    // A second Organization (same Tenant) to prove cross-tenant isolation:
    // a user from another org must not be able to reach this proposal's
    // components/document, even knowing its id.
    const otherOrg = await prisma.organization.create({
      data: { tenantId: TENANT_ID, name: "Other Org (e2e)" },
    });
    const { accessToken: otherAccessToken } = await registerTestUser(app, otherOrg.id);
    otherOrgAuth = authHeader(otherAccessToken);

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
      .set(...auth)
      .send({ partnerOneName: "Iris", partnerTwoName: "João", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const proposalResponse = await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .set(...auth)
      .expect(201);
    proposalId = proposalResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 for an unknown proposal", async () => {
    await request(app.getHttpServer())
      .post("/creative/proposals/00000000-0000-0000-0000-000000009999/components")
      .set(...auth)
      .expect(404);
  });

  it("returns 400 for the document endpoint before any component has been generated", async () => {
    const response = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/document`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/no components yet/);
  });

  it("generates and persists the 18 proposal components, and sets the Proposal's concept name", async () => {
    proposalComponentsMock.generate.mockResolvedValueOnce(buildProposalComponentsResult());

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/components`)
      .set(...auth)
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
      .set(...auth)
      .expect(200);
    expect(listResponse.body).toHaveLength(18);

    const otherOrgResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/components`)
      .set(...otherOrgAuth)
      .expect(404);
    expect(otherOrgResponse.body.message).toMatch(/Proposal not found/);
  });

  it("returns the assembled document (Proposal + ordered components) once components exist", async () => {
    const response = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/document`)
      .set(...auth)
      .expect(200);

    expect(response.body.proposal.id).toBe(proposalId);
    expect(response.body.components).toHaveLength(18);
    expect(response.body.components[0].type).toBe("COVER");
  });

  it("returns 404 for the document endpoint when the proposal does not exist", async () => {
    await request(app.getHttpServer())
      .get("/creative/proposals/00000000-0000-0000-0000-000000009999/document")
      .set(...auth)
      .expect(404);
  });

  it("returns 503 with a clear message when Agente 3 fails", async () => {
    proposalComponentsMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/components`)
      .set(...auth)
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);
  });

  it("generates a conceptual render for the Capa and attaches a signed URL on every subsequent read", async () => {
    conceptualRenderMock.generate.mockResolvedValueOnce({
      imageBase64: Buffer.from("fake-png-bytes").toString("base64"),
      mimeType: "image/png",
    });

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/render/COVER`)
      .set(...auth)
      .expect(201);

    expect(response.body.type).toBe("COVER");
    expect(response.body.content.renderStorageKey).toMatch(new RegExp(`^renders/${proposalId}/cover-`));
    expect(response.body.content.renderImageUrl).toBe(
      `https://storage.example.com/${response.body.content.renderStorageKey}`,
    );
    expect(storageMock.upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/png" }),
    );
    // The Capa's overall hero shot doesn't target a specific environment.
    expect(conceptualRenderMock.generate).toHaveBeenCalledWith(
      expect.objectContaining({ environmentTitle: undefined, environmentDescription: undefined }),
    );

    // The signed URL is recomputed on every read, not persisted — confirm
    // it shows up consistently on the components list and the document too.
    const componentsResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/components`)
      .set(...auth)
      .expect(200);
    const cover = componentsResponse.body.find((c: { type: string }) => c.type === "COVER");
    expect(cover.content.renderImageUrl).toBe(response.body.content.renderImageUrl);

    const documentResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/document`)
      .set(...auth)
      .expect(200);
    const documentCover = documentResponse.body.components.find((c: { type: string }) => c.type === "COVER");
    expect(documentCover.content.renderImageUrl).toBe(response.body.content.renderImageUrl);
  });

  it("generates a conceptual render for a narrative environment, scoped to its own title/description", async () => {
    conceptualRenderMock.generate.mockResolvedValueOnce({
      imageBase64: Buffer.from("fake-png-bytes").toString("base64"),
      mimeType: "image/png",
    });

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/render/ENTRANCE`)
      .set(...auth)
      .expect(201);

    expect(response.body.type).toBe("ENTRANCE");
    expect(response.body.content.renderStorageKey).toMatch(new RegExp(`^renders/${proposalId}/entrance-`));
    expect(response.body.content.renderImageUrl).toBe(
      `https://storage.example.com/${response.body.content.renderStorageKey}`,
    );
    expect(conceptualRenderMock.generate).toHaveBeenCalledWith(
      expect.objectContaining({ environmentTitle: "Título Entrada", environmentDescription: "Descrição Entrada" }),
    );

    // Regenerating the Capa afterwards must not disturb this environment's render.
    const componentsResponse = await request(app.getHttpServer())
      .get(`/creative/proposals/${proposalId}/components`)
      .set(...auth)
      .expect(200);
    const entrance = componentsResponse.body.find((c: { type: string }) => c.type === "ENTRANCE");
    expect(entrance.content.renderImageUrl).toBe(response.body.content.renderImageUrl);
  });

  it("returns 400 for a componentType with no physical scene to render (e.g. INVESTMENT)", async () => {
    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/render/INVESTMENT`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/componentType must be one of/);
  });

  it("returns 503 with a clear message when the conceptual render generation fails", async () => {
    conceptualRenderMock.generate.mockRejectedValueOnce(new Error("simulated OpenAI outage"));

    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/render/COVER`)
      .set(...auth)
      .expect(503);
    expect(response.body.message).toMatch(/simulated OpenAI outage/);
  });

  it("returns 404 for the render endpoint when the proposal does not exist", async () => {
    await request(app.getHttpServer())
      .post("/creative/proposals/00000000-0000-0000-0000-000000009999/render/COVER")
      .set(...auth)
      .expect(404);
  });
});
