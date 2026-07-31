import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health -> 200, checking memory, database, and storage connectivity", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      info: {
        memory_heap: { status: "up" },
        database: { status: "up" },
        storage: { status: "up" },
      },
    });
  });

  it("GET /metrics -> 200, Prometheus exposition format including the earlier /health request", async () => {
    const response = await request(app.getHttpServer()).get("/metrics").expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("http_requests_total");
    expect(response.text).toMatch(/http_requests_total\{method="GET",route="\/health",status_code="200"\}/);
  });
});
