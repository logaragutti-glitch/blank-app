import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

// Runs against the Knowledge Graph seed data (prisma/seed.ts), which must
// have been applied to the database pointed at by DATABASE_URL before this
// suite runs (see package.json "pretest:e2e" / CI workflow).
const SEEDED_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

describe("Knowledge Graph (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /knowledge-graph/styles includes the seeded Garden Fine Art style", async () => {
    const response = await request(app.getHttpServer())
      .get("/knowledge-graph/styles")
      .query({ organizationId: SEEDED_ORGANIZATION_ID })
      .expect(200);

    const gardenFineArt = response.body.find((style: { name: string }) => style.name === "Garden Fine Art");
    expect(gardenFineArt).toBeDefined();
    expect(gardenFineArt.dimensionScores).toEqual({ Luxuoso: 8, Natural: 7.8 });
    expect(gardenFineArt.paletteColors).toEqual(["rosé", "verde sálvia", "champagne"]);
  });

  it("GET /knowledge-graph/materials reflects Peonia's documented compatibility", async () => {
    const response = await request(app.getHttpServer())
      .get("/knowledge-graph/materials")
      .query({ organizationId: SEEDED_ORGANIZATION_ID })
      .expect(200);

    const peonia = response.body.find((material: { name: string }) => material.name === "Peônia");
    expect(peonia).toBeDefined();
    expect(peonia.compatibleStyleIds).toHaveLength(1);
    expect(peonia.incompatibleStyleIds).toHaveLength(2);

    const neon = response.body.find((material: { name: string }) => material.name === "Neon");
    expect(neon.neverRecommend).toBe(true);
  });

  it("GET /knowledge-graph/venues includes Villa Massari with its recommendation notes", async () => {
    const response = await request(app.getHttpServer())
      .get("/knowledge-graph/venues")
      .query({ organizationId: SEEDED_ORGANIZATION_ID })
      .expect(200);

    const villaMassari = response.body.find((venue: { name: string }) => venue.name === "Villa Massari");
    expect(villaMassari).toBeDefined();
    expect(villaMassari.recommendationNotes).toEqual(
      expect.arrayContaining(["cerimônia externa", "iluminação quente"]),
    );
  });

  it("GET /knowledge-graph/venues/:id -> 404 for an unknown id", async () => {
    await request(app.getHttpServer())
      .get("/knowledge-graph/venues/00000000-0000-0000-0000-000000009999")
      .query({ organizationId: SEEDED_ORGANIZATION_ID })
      .expect(404);
  });
});
