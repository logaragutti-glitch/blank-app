import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

// Uses the Knowledge Graph seed data (prisma/seed.ts) for a real Organization id.
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 when registering against an unknown organization", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        organizationId: "00000000-0000-0000-0000-000000009999",
        email: "someone@evefestas.com",
        password: "supersecret1",
        name: "Someone",
      })
      .expect(404);
  });

  it("rejects a password shorter than 8 characters", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email: "short@evefestas.com", password: "short", name: "Someone" })
      .expect(400);
  });

  it("registers a user and issues a usable access token", async () => {
    const email = `register-${Date.now()}@evefestas.com`;
    const registerResponse = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email, password: "supersecret1", name: "Nova Usuária" })
      .expect(201);

    expect(registerResponse.body.user.email).toBe(email);
    expect(registerResponse.body.user.role).toBe("MEMBER");
    expect(registerResponse.body.user).not.toHaveProperty("passwordHash");
    expect(typeof registerResponse.body.accessToken).toBe("string");

    await request(app.getHttpServer())
      .get("/knowledge-graph/styles")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);
  });

  it("returns 409 when registering the same email twice", async () => {
    const email = `duplicate-${Date.now()}@evefestas.com`;
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email, password: "supersecret1", name: "Primeira" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email, password: "supersecret1", name: "Segunda" })
      .expect(409);
  });

  it("logs in with the right password and rejects the wrong one", async () => {
    const email = `login-${Date.now()}@evefestas.com`;
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email, password: "supersecret1", name: "Login Tester" })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "supersecret1" })
      .expect(201);
    expect(typeof loginResponse.body.accessToken).toBe("string");

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "wrong-password" })
      .expect(401);
  });

  it("rejects requests to protected endpoints with no token, and with a garbage token", async () => {
    await request(app.getHttpServer()).get("/knowledge-graph/styles").expect(401);
    await request(app.getHttpServer())
      .get("/knowledge-graph/styles")
      .set("Authorization", "Bearer not-a-real-token")
      .expect(401);
  });

  it("still allows /health with no token", async () => {
    await request(app.getHttpServer()).get("/health").expect(200);
  });
});
