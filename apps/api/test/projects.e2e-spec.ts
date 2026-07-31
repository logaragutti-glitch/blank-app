import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { authHeader, registerTestUser } from "./auth-test-helper";

const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

describe("Projects (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
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

    const { accessToken } = await registerTestUser(app, ORGANIZATION_ID);
    auth = authHeader(accessToken);
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get("/projects").expect(401);
  });

  it("lists a newly created project with its client and venue names, and no proposal yet", async () => {
    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({ partnerOneName: "Paula", partnerTwoName: "Renato", venueId })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const response = await request(app.getHttpServer()).get("/projects").set(...auth).expect(200);

    const project = response.body.find((p: { eventId: string }) => p.eventId === eventId);
    expect(project).toBeDefined();
    expect(project.clientNames).toBe("Paula & Renato");
    expect(project.venueName).toBe("Villa Massari");
    expect(project.latestProposal).toBeNull();
  });
});
