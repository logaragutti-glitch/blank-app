import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Runs against the Knowledge Graph seed data (prisma/seed.ts), which must
// have been applied to the database pointed at by DATABASE_URL before this
// suite runs (see package.json "pretest:e2e" / CI workflow).
const SEEDED_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

describe("Knowledge Graph (e2e)", () => {
  let app: INestApplication;
  let auth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const { accessToken } = await registerTestUser(app, SEEDED_ORGANIZATION_ID);
    auth = authHeader(accessToken);
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get("/knowledge-graph/styles").expect(401);
  });

  it("GET /knowledge-graph/styles includes the seeded Garden Fine Art style", async () => {
    const response = await request(app.getHttpServer())
      .get("/knowledge-graph/styles")
      .set(...auth)
      .expect(200);

    const gardenFineArt = response.body.find((style: { name: string }) => style.name === "Garden Fine Art");
    expect(gardenFineArt).toBeDefined();
    expect(gardenFineArt.dimensionScores).toEqual({ Luxuoso: 8, Natural: 7.8 });
    expect(gardenFineArt.paletteColors).toEqual(["rosé", "verde sálvia", "champagne"]);
  });

  it("GET /knowledge-graph/materials reflects Peonia's documented compatibility", async () => {
    const response = await request(app.getHttpServer())
      .get("/knowledge-graph/materials")
      .set(...auth)
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
      .set(...auth)
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
      .set(...auth)
      .expect(404);
  });

  it("GET /knowledge-graph/suppliers includes Flores da Serra as preferred at Villa Massari", async () => {
    const [suppliersResponse, venuesResponse] = await Promise.all([
      request(app.getHttpServer()).get("/knowledge-graph/suppliers").set(...auth).expect(200),
      request(app.getHttpServer()).get("/knowledge-graph/venues").set(...auth).expect(200),
    ]);

    const floresDaSerra = suppliersResponse.body.find(
      (supplier: { name: string }) => supplier.name === "Flores da Serra",
    );
    expect(floresDaSerra).toBeDefined();
    expect(floresDaSerra.category).toBe("FLORIST");

    const villaMassari = venuesResponse.body.find((venue: { name: string }) => venue.name === "Villa Massari");
    expect(floresDaSerra.preferredVenueIds).toContain(villaMassari.id);
  });

  it("GET /knowledge-graph/suppliers/:id -> 404 for an unknown id", async () => {
    await request(app.getHttpServer())
      .get("/knowledge-graph/suppliers/00000000-0000-0000-0000-000000009999")
      .set(...auth)
      .expect(404);
  });

  it("creates and updates a Material (Sprint 5+ item 9, apps/admin)", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/knowledge-graph/materials")
      .set(...auth)
      .send({ name: "Ranúnculo", category: "FLOWER", estimatedUnitCost: 38 })
      .expect(201);

    expect(createResponse.body.name).toBe("Ranúnculo");
    expect(createResponse.body.neverRecommend).toBe(false);
    expect(createResponse.body.compatibleStyleIds).toEqual([]);
    expect(createResponse.body.estimatedUnitCost).toBe(38);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/knowledge-graph/materials/${createResponse.body.id}`)
      .set(...auth)
      .send({ estimatedUnitCost: 42 })
      .expect(200);
    expect(updateResponse.body.estimatedUnitCost).toBe(42);
    // Untouched fields are preserved by the partial update.
    expect(updateResponse.body.name).toBe("Ranúnculo");

    await request(app.getHttpServer())
      .patch("/knowledge-graph/materials/00000000-0000-0000-0000-000000009999")
      .set(...auth)
      .send({ name: "X" })
      .expect(404);
  });

  it("creates and updates a Venue", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/knowledge-graph/venues")
      .set(...auth)
      .send({ name: "Sítio das Palmeiras", guestCapacity: 120 })
      .expect(201);

    expect(createResponse.body.name).toBe("Sítio das Palmeiras");
    expect(createResponse.body.guestCapacity).toBe(120);
    expect(createResponse.body.recommendationNotes).toEqual([]);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/knowledge-graph/venues/${createResponse.body.id}`)
      .set(...auth)
      .send({ recommendationNotes: ["luz natural"] })
      .expect(200);
    expect(updateResponse.body.recommendationNotes).toEqual(["luz natural"]);

    await request(app.getHttpServer())
      .patch("/knowledge-graph/venues/00000000-0000-0000-0000-000000009999")
      .set(...auth)
      .send({ name: "X" })
      .expect(404);
  });

  it("creates and updates a Supplier", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/knowledge-graph/suppliers")
      .set(...auth)
      .send({ name: "Doces da Vó", category: "CATERING" })
      .expect(201);

    expect(createResponse.body.name).toBe("Doces da Vó");
    expect(createResponse.body.preferredVenueIds).toEqual([]);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/knowledge-graph/suppliers/${createResponse.body.id}`)
      .set(...auth)
      .send({ estimatedCost: 5200 })
      .expect(200);
    expect(updateResponse.body.estimatedCost).toBe(5200);

    await request(app.getHttpServer())
      .patch("/knowledge-graph/suppliers/00000000-0000-0000-0000-000000009999")
      .set(...auth)
      .send({ name: "X" })
      .expect(404);
  });

  it("creates and updates an EventStyle, tolerating a missing embeddings provider", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/knowledge-graph/styles")
      .set(...auth)
      .send({ name: "Praia ao Entardecer", dimensionScores: { Natural: 9, Intimista: 7 } })
      .expect(201);

    expect(createResponse.body.name).toBe("Praia ao Entardecer");
    expect(createResponse.body.dimensionScores).toEqual({ Natural: 9, Intimista: 7 });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/knowledge-graph/styles/${createResponse.body.id}`)
      .set(...auth)
      .send({ paletteColors: ["areia", "coral"] })
      .expect(200);
    expect(updateResponse.body.paletteColors).toEqual(["areia", "coral"]);

    await request(app.getHttpServer())
      .patch("/knowledge-graph/styles/00000000-0000-0000-0000-000000009999")
      .set(...auth)
      .send({ name: "X" })
      .expect(404);
  });
});
