import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";
import { BudgetAnalysisPort } from "../src/modules/production/ai/budget-analysis.port";
import type { BudgetAnalysisResult } from "../src/modules/production/ai/budget-analysis.port";
import { ProductionPlanPort } from "../src/modules/production/ai/production-plan.port";
import type { ProductionPlanResult } from "../src/modules/production/ai/production-plan.port";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// Garden Fine Art style, Peonia material (estimatedUnitCost: 45), Flores da
// Serra supplier (FLORIST, estimatedCost: 3800) and Equipe Raiz Montagens
// (ASSEMBLY_CREW, estimatedCost: 2400), both preferred at Villa Massari.
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};
const productionPlanMock: jest.Mocked<ProductionPlanPort> = {
  generate: jest.fn(),
};
const budgetAnalysisMock: jest.Mocked<BudgetAnalysisPort> = {
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
      .overrideProvider(BudgetAnalysisPort)
      .useValue(budgetAnalysisMock)
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

  it("returns 400 when generating a plan before the proposal has been approved", async () => {
    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/plan`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/must be approved/);
    expect(productionPlanMock.generate).not.toHaveBeenCalled();
  });

  it("approves the proposal, unblocking production plan generation", async () => {
    const response = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/approve`)
      .set(...auth)
      .expect(201);
    expect(response.body.status).toBe("APPROVED");
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

    // Grounded in the real catalog: every material connected as compatible
    // with the matched Garden Fine Art style (see prisma/seed.ts), never
    // anything marked neverRecommend (e.g. Neon).
    const [generateCall] = productionPlanMock.generate.mock.calls;
    const catalogMaterialNames = (generateCall?.[0].catalogMaterials ?? []).map((material) => material.name);
    expect(catalogMaterialNames).toEqual(
      expect.arrayContaining(["Peônia", "Lisianthus", "Rosa Inglesa", "Gaze", "Organza", "Linho"]),
    );
    expect(catalogMaterialNames).not.toContain("Neon");

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

describe("Budget Analysis (e2e)", () => {
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
      .overrideProvider(BudgetAnalysisPort)
      .useValue(budgetAnalysisMock)
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
      .send({ partnerOneName: "Bianca", partnerTwoName: "Diego", venueId })
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
      .post("/production/proposals/00000000-0000-0000-0000-000000009999/budget-analysis")
      .set(...auth)
      .expect(404);
  });

  it("returns 400 when generating a budget analysis before the proposal has been approved", async () => {
    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/must be approved/);
    expect(budgetAnalysisMock.generate).not.toHaveBeenCalled();
  });

  it("returns 400 for the get endpoint before a budget analysis has been generated (after approval)", async () => {
    const approveResponse = await request(app.getHttpServer())
      .post(`/creative/proposals/${proposalId}/approve`)
      .set(...auth)
      .expect(201);
    expect(approveResponse.body.status).toBe("APPROVED");

    const response = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(400);
    expect(response.body.message).toMatch(/no budget analysis yet/);
  });

  it("generates and persists the budget analysis, grounded in real catalog costs", async () => {
    const result: BudgetAnalysisResult = {
      materialEstimates: [{ materialName: "Peônia", estimatedQuantity: 40 }],
    };
    budgetAnalysisMock.generate.mockResolvedValueOnce(result);

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(201);

    // Grounded in the real seed data: Peônia costs 45/unit, so 40 units is
    // a materialsCost of 1800. Flores da Serra (the only FLORIST supplier,
    // preferred at Villa Massari) costs 3800. Nothing here is invented —
    // Agente 4 only supplied the quantity (40); the rest is arithmetic.
    expect(response.body.lineItems).toEqual([
      { materialName: "Peônia", category: "FLOWER", estimatedQuantity: 40, unitCost: 45, lineTotal: 1800 },
    ]);
    expect(response.body.bestValueSuppliers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "FLORIST", supplierName: "Flores da Serra", estimatedCost: 3800 }),
      ]),
    );
    expect(response.body.materialsCost).toBe(1800);
    const expectedSuppliersCost = response.body.bestValueSuppliers.reduce(
      (sum: number, supplier: { estimatedCost: number }) => sum + supplier.estimatedCost,
      0,
    );
    expect(response.body.suppliersCost).toBe(expectedSuppliersCost);
    expect(response.body.totalEstimatedCost).toBe(1800 + expectedSuppliersCost);
    expect(response.body.hasIncompleteData).toBe(false);

    // Only materials with a known cost are ever offered to the model.
    const [generateCall] = budgetAnalysisMock.generate.mock.calls;
    const catalogMaterialNames = (generateCall?.[0].catalogMaterials ?? []).map((material) => material.name);
    expect(catalogMaterialNames).toContain("Peônia");

    const getResponse = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(200);
    expect(getResponse.body.id).toBe(response.body.id);
  });

  it("regenerating replaces the budget analysis wholesale rather than creating a new row", async () => {
    const secondResult: BudgetAnalysisResult = {
      materialEstimates: [{ materialName: "Peônia", estimatedQuantity: 10 }],
    };
    budgetAnalysisMock.generate.mockResolvedValueOnce(secondResult);

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(201);
    expect(response.body.lineItems).toEqual([
      { materialName: "Peônia", category: "FLOWER", estimatedQuantity: 10, unitCost: 45, lineTotal: 450 },
    ]);

    const getResponse = await request(app.getHttpServer())
      .get(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(200);
    expect(getResponse.body.id).toBe(response.body.id);
    expect(getResponse.body.materialsCost).toBe(450);
  });

  it("returns 503 with a clear message when Agente 4 fails to generate the budget analysis", async () => {
    budgetAnalysisMock.generate.mockRejectedValueOnce(new Error("simulated Anthropic outage"));

    const response = await request(app.getHttpServer())
      .post(`/production/proposals/${proposalId}/budget-analysis`)
      .set(...auth)
      .expect(503);
    expect(response.body.message).toMatch(/simulated Anthropic outage/);
  });
});
