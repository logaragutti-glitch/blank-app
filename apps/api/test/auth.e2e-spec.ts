import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { EmailPort } from "../src/infrastructure/email/email.port";

// Uses the Knowledge Graph seed data (prisma/seed.ts) for a real Organization id.
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

// No real email provider is configured in this environment (see
// docs/11-deployment-guide.md) — mocked here so the suite can capture the
// reset link's raw token and exercise the real forgot/reset round trip.
const emailMock: jest.Mocked<EmailPort> = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailPort)
      .useValue(emailMock)
      .compile();
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

  it("completes the forgot/reset password round trip and lets the user log in with the new password", async () => {
    const email = `forgot-${Date.now()}@evefestas.com`;
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ organizationId: ORGANIZATION_ID, email, password: "original-pass1", name: "Esquecida" })
      .expect(201);

    emailMock.sendPasswordResetEmail.mockClear();
    const forgotResponse = await request(app.getHttpServer())
      .post("/auth/forgot-password")
      .send({ email })
      .expect(201);
    expect(forgotResponse.body.message).toMatch(/if that email is registered/i);
    expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const resetUrl = emailMock.sendPasswordResetEmail.mock.calls[0]![0].resetUrl;
    const token = new URL(resetUrl).searchParams.get("token");
    expect(token).not.toBeNull();

    await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({ token, newPassword: "brand-new-pass1" })
      .expect(201);

    // The old password no longer works, and the new one does.
    await request(app.getHttpServer()).post("/auth/login").send({ email, password: "original-pass1" }).expect(401);
    await request(app.getHttpServer()).post("/auth/login").send({ email, password: "brand-new-pass1" }).expect(201);

    // The token is single-use — the same one can't be replayed.
    await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({ token, newPassword: "another-pass1" })
      .expect(400);
  });

  it("returns the same generic message for forgot-password on an email that isn't registered", async () => {
    emailMock.sendPasswordResetEmail.mockClear();
    const response = await request(app.getHttpServer())
      .post("/auth/forgot-password")
      .send({ email: "nobody-registered@evefestas.com" })
      .expect(201);

    expect(response.body.message).toMatch(/if that email is registered/i);
    expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("rejects reset-password with an unknown token", async () => {
    await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({ token: "not-a-real-token", newPassword: "whatever-pass1" })
      .expect(400);
  });
});
