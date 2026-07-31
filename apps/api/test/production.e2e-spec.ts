import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";
import { ProductionPlanPort } from "../src/modules/production/ai/production-plan.port";
import type { ProductionPlanResult } from "../src/modules/production/ai/production-plan.port";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// Garden Fine Art style, Peonia material.
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};
const productionPlanMock: jest.Mocked<ProductionPlanPort> = {
  generate: jest.fn(),
};

function buildProductionPlanResult(): ProductionPlanResult {
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

describe("Production Plan (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let proposalId: string;
  let auth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
      .overrideProvider(ProductionPlanPort)
      .useValue(productionPlanMock)
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
      .send({ partnerOneName: "Sofia", partnerTwoName: "Rafael", venueId })
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

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get(`/production/proposals/${proposalId}/plan`).expect(401);
  });

  it("returns 404 for an unknown proposal", async () => {
    await request(app.getHttpServer())
      .post("/production/proposals/00000000-0000-0000-0000-000000009999/plan")
      .set(...auth)
      .expect(404);
  });

  it("returns 400 for the plan endpoint before a plan has been generated", async () => {
    const response = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/no production plan yet/);
  });

  it("generates and persists the production plan, grounded in the matched style's compatible materials", async () => {
    productionPlanMock.generate.mockResolvedValueOnce(buildProductionPlanResult());

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(201);

    expect(response.body.materialsList).toEqual(buildProductionPlanResult().materialsList);
    expect(response.body.setupSchedule).toEqual(buildProductionPlanResult().setupSchedule);
    expect(response.body.checklist).toEqual(buildProductionPlanResult().checklist);

    expect(productionPlanMock.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogMaterials: [{ name: "Peônia", category: "FLOWER" }],
      }),
    );

    const getResponse = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(200);
    expect(getResponse.body.id).toBe(response.body.id);
  });

  it("regenerating replaces the plan wholesale rather than creating a new row", async () => {
    const secondPlan: ProductionPlanResult = {
      materialsList: [{ name: "Peônia", category: "FLOWER", quantity: "60 buquês médios" }],
      setupSchedule: [],
      checklist: [],
    };
    productionPlanMock.generate.mockResolvedValueOnce(secondPlan);

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(201);
    expect(response.body.materialsList).toEqual(secondPlan.materialsList);

    const getResponse = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(200);
    expect(getResponse.body.id).toBe(response.body.id);
    expect(getResponse.body.materialsList).toEqual(secondPlan.materialsList);
  });

  it("returns 503 with a clear message when Agente 4 fails", async () => {
    productionPlanMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);
  });
});
