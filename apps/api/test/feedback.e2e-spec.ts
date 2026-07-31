import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Uses the Knowledge Graph seed data (prisma/seed.ts): Villa Massari venue,
// and "Flores da Serra" supplier (already seeded as preferred at Villa
// Massari) for the feedback -> Knowledge Graph reconciliation tests.
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

describe("Post-event feedback (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let eventId: string;
  let supplierId: string;
  let auth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const prisma = app.get(PrismaService);
    const venue = await prisma.venue.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Villa Massari" },
    });
    venueId = venue.id;
    const supplier = await prisma.supplier.findFirstOrThrow({
      where: { organizationId: ORGANIZATION_ID, name: "Flores da Serra" },
    });
    supplierId = supplier.id;

    const { accessToken } = await registerTestUser(app, ORGANIZATION_ID);
    auth = authHeader(accessToken);

    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({ partnerOneName: "Nina", partnerTwoName: "Otto", venueId })
      .expect(201);
    eventId = briefingResponse.body.event.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get(`/events/${eventId}/feedback`).expect(401);
  });

  it("returns 404 for an unknown event", async () => {
    await request(app.getHttpServer())
      .post("/events/00000000-0000-0000-0000-000000009999/feedback")
      .set(...auth)
      .send({ whatDelighted: "Tudo" })
      .expect(404);
  });

  it("returns 404 when no feedback has been recorded yet", async () => {
    await request(app.getHttpServer())
      .get(`/events/${eventId}/feedback`)
      .set(...auth)
      .expect(404);
  });

  it("rejects a rating outside the 1-5 range", async () => {
    await request(app.getHttpServer())
      .post(`/events/${eventId}/feedback`)
      .set(...auth)
      .send({ supplierPerformance: [{ supplierId: "supplier-1", rating: 9 }] })
      .expect(400);
  });

  it("records feedback and allows retrieving it", async () => {
    const response = await request(app.getHttpServer())
      .post(`/events/${eventId}/feedback`)
      .set(...auth)
      .send({
        whatDelighted: "A entrada surpreendeu os convidados",
        supplierPerformance: [{ supplierId: "supplier-1", rating: 5, notes: "Pontual e cuidadoso" }],
      })
      .expect(201);

    expect(response.body.whatDelighted).toBe("A entrada surpreendeu os convidados");
    expect(response.body.supplierPerformance).toEqual([
      { supplierId: "supplier-1", rating: 5, notes: "Pontual e cuidadoso" },
    ]);
    expect(response.body.setupAdjustments).toBeNull();

    const getResponse = await request(app.getHttpServer())
      .get(`/events/${eventId}/feedback`)
      .set(...auth)
      .expect(200);
    expect(getResponse.body.id).toBe(response.body.id);
  });

  it("upserts the same record incrementally instead of creating a new one", async () => {
    const secondResponse = await request(app.getHttpServer())
      .post(`/events/${eventId}/feedback`)
      .set(...auth)
      .send({ setupAdjustments: "Precisou reforçar a estrutura do lounge" })
      .expect(201);

    // Same feedback row (unique on eventId), and whatDelighted from the
    // first call is preserved — a field omitted from a later call doesn't
    // get cleared, since feedback is meant to be captured incrementally.
    expect(secondResponse.body.setupAdjustments).toBe("Precisou reforçar a estrutura do lounge");
    expect(secondResponse.body.whatDelighted).toBe("A entrada surpreendeu os convidados");

    const listResponse = await request(app.getHttpServer())
      .get(`/events/${eventId}/feedback`)
      .set(...auth)
      .expect(200);
    expect(listResponse.body.id).toBe(secondResponse.body.id);
  });

  describe("feedback -> Knowledge Graph reconciliation", () => {
    it("demotes a real supplier at this event's venue when rated 1 or 2", async () => {
      // Flores da Serra is seeded as preferred at Villa Massari.
      const before = await request(app.getHttpServer())
        .get(`/knowledge-graph/suppliers/${supplierId}`)
        .set(...auth)
        .expect(200);
      expect(before.body.preferredVenueIds).toContain(venueId);

      await request(app.getHttpServer())
        .post(`/events/${eventId}/feedback`)
        .set(...auth)
        .send({ supplierPerformance: [{ supplierId, rating: 1, notes: "Atraso na entrega" }] })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get(`/knowledge-graph/suppliers/${supplierId}`)
        .set(...auth)
        .expect(200);
      expect(after.body.preferredVenueIds).not.toContain(venueId);
      expect(after.body.performanceNotes).toMatch(/nota 1\/5.*Atraso na entrega/);
    });

    it("promotes the supplier back when rated 4 or 5", async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/feedback`)
        .set(...auth)
        .send({ supplierPerformance: [{ supplierId, rating: 5, notes: "Recuperou-se muito bem" }] })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get(`/knowledge-graph/suppliers/${supplierId}`)
        .set(...auth)
        .expect(200);
      expect(after.body.preferredVenueIds).toContain(venueId);
      expect(after.body.performanceNotes).toMatch(/nota 5\/5.*Recuperou-se muito bem/);
    });

    it("leaves the preference untouched for a neutral rating of 3", async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/feedback`)
        .set(...auth)
        .send({ supplierPerformance: [{ supplierId, rating: 3 }] })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get(`/knowledge-graph/suppliers/${supplierId}`)
        .set(...auth)
        .expect(200);
      // Still preferred from the previous (rating 5) step — a neutral
      // rating doesn't touch the preference either way.
      expect(after.body.preferredVenueIds).toContain(venueId);
      expect(after.body.performanceNotes).toMatch(/nota 3\/5/);
    });

    it("accepts feedback for an unknown supplier id without failing", async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/feedback`)
        .set(...auth)
        .send({ supplierPerformance: [{ supplierId: "00000000-0000-0000-0000-000000009999", rating: 5 }] })
        .expect(201);
    });
  });
});
