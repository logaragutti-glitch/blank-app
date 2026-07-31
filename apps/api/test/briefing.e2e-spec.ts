import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { StoragePort } from "../src/infrastructure/storage/storage.port";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { EmbeddingPort } from "../src/infrastructure/ai/embedding.port";
import { VisionAnalysisPort } from "../src/modules/briefing/ai/vision-analysis.port";
import { authHeader, registerTestUser } from "./auth-test-helper";

// Uses the Knowledge Graph seed data for a real venue (prisma/seed.ts).
const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

const FAKE_EMBEDDING = new Array(1536).fill(0).map((_, i) => (i % 7) / 7);

// Storage/Vision/Embedding are external paid services this test environment
// has no live credentials/infra for (see conversation) — mocked here so the
// suite still exercises the real HTTP layer, validation, Postgres writes,
// and the pgvector column end to end.
const storageMock: jest.Mocked<StoragePort> = {
  upload: jest.fn().mockResolvedValue(undefined),
  getSignedDownloadUrl: jest.fn().mockResolvedValue("https://example.com/signed-url"),
  download: jest.fn().mockResolvedValue(Buffer.from("fake-bytes")),
};
const visionMock: jest.Mocked<VisionAnalysisPort> = {
  analyze: jest.fn().mockResolvedValue({
    tags: { flowers: ["peônias"], colors: ["rosé"] },
    description: "Um jardim romântico com tons suaves.",
    promptVersion: "v1",
  }),
};
const embeddingMock: jest.Mocked<EmbeddingPort> = {
  embed: jest.fn().mockResolvedValue(FAKE_EMBEDDING),
};

describe("Briefing (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let venueId: string;
  let auth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StoragePort)
      .useValue(storageMock)
      .overrideProvider(VisionAnalysisPort)
      .useValue(visionMock)
      .overrideProvider(EmbeddingPort)
      .useValue(embeddingMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
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

  it("POST /briefing creates the client and event from the form", async () => {
    const response = await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({
        partnerOneName: "Ana",
        partnerTwoName: "Bruno",
        lifestyleTags: ["Romântico", "Natural"],
        venueId,
        guestsExpected: 120,
      })
      .expect(201);

    expect(response.body.client.partnerOneName).toBe("Ana");
    expect(response.body.event.venueId).toBe(venueId);
    expect(response.body.event.status).toBe("DRAFT");
  });

  it("rejects a briefing missing required fields", async () => {
    await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({ venueId: "not-a-uuid" })
      .expect(400);
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer())
      .post("/briefing")
      .send({ partnerOneName: "Ana", venueId })
      .expect(401);
  });

  describe("inspiration image pipeline (Storage/Vision/Embedding mocked)", () => {
    let eventId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post("/briefing")
        .set(...auth)
        .send({ partnerOneName: "Carla", partnerTwoName: "Diego", venueId })
        .expect(201);
      eventId = response.body.event.id;
    });

    it("uploads an image, analyzes it, and persists the embedding", async () => {
      const response = await request(app.getHttpServer())
        .post(`/briefing/${eventId}/inspiration-images`)
        .set(...auth)
        .attach("file", Buffer.from("fake-png-bytes"), {
          filename: "inspiration.png",
          contentType: "image/png",
        })
        .expect(201);

      expect(response.body.status).toBe("ANALYZED");
      expect(response.body.visionDescription).toBe("Um jardim romântico com tons suaves.");
      expect(response.body.visionTags.flowers).toEqual(["peônias"]);
      expect(storageMock.upload).toHaveBeenCalled();
      expect(embeddingMock.embed).toHaveBeenCalledWith("Um jardim romântico com tons suaves.");

      // The embedding column is Unsupported("vector(1536)") in schema.prisma
      // and thus invisible to the normal Prisma Client API — verify the raw
      // write actually landed via $queryRaw.
      const [row] = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
        SELECT embedding IS NOT NULL AS has_embedding
        FROM inspiration_images
        WHERE id = ${response.body.id}::uuid
      `;
      expect(row?.has_embedding).toBe(true);
    });

    it("GET lists the uploaded image for the event", async () => {
      const response = await request(app.getHttpServer())
        .get(`/briefing/${eventId}/inspiration-images`)
        .set(...auth)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("ANALYZED");
    });

    it("returns 404 for an unknown event", async () => {
      await request(app.getHttpServer())
        .post("/briefing/00000000-0000-0000-0000-000000009999/inspiration-images")
        .set(...auth)
        .attach("file", Buffer.from("fake-png-bytes"), {
          filename: "inspiration.png",
          contentType: "image/png",
        })
        .expect(404);
    });

    it("records a FAILED status when the storage upload fails", async () => {
      storageMock.upload.mockRejectedValueOnce(new Error("simulated storage outage"));

      const response = await request(app.getHttpServer())
        .post(`/briefing/${eventId}/inspiration-images`)
        .set(...auth)
        .attach("file", Buffer.from("fake-png-bytes"), {
          filename: "inspiration.png",
          contentType: "image/png",
        })
        .expect(201);

      expect(response.body.status).toBe("FAILED");
      expect(response.body.processingError).toBe("simulated storage outage");
    });
  });
});
