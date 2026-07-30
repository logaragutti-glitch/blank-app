import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// Garden Fine Art style, Peonia material.
const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

// Agente 1 (Anthropic) has no live credentials in this environment (see
// conversation) — mocked here so the suite still exercises the real HTTP
// layer, context gathering (Client/Event/Venue/Knowledge Graph), and the
// Proposal write to Postgres end to end.
const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};

describe("Creative / Diagnostico Criativo (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let gardenFineArtStyleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
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
