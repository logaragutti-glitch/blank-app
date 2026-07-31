import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { DiagnosticoCriativoPort } from "../src/modules/creative/ai/diagnostico-criativo.port";
import { authHeader, registerTestUser } from "./auth-test-helper";

const ORGANIZATION_ID = "00000000-0000-0000-0000-000000000002";

// Agente 1 has no live Anthropic credentials in this environment — mocked
// here so the Canvas tests can exercise a real, diagnosed Proposal.
const diagnosticoCriativoMock: jest.Mocked<DiagnosticoCriativoPort> = {
  generate: jest.fn(),
};

describe("Projects (e2e)", () => {
  let app: INestApplication;
  let venueId: string;
  let gardenFineArtStyleId: string;
  let auth: [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DiagnosticoCriativoPort)
      .useValue(diagnosticoCriativoMock)
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
    gardenFineArtStyleId = gardenFineArtStyle.id;

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

  it("returns 404 for the Canvas endpoint when the event does not exist", async () => {
    await request(app.getHttpServer())
      .get("/projects/00000000-0000-0000-0000-000000009999/canvas")
      .set(...auth)
      .expect(404);
  });

  it("assembles the Canvas from real data, flagging diagnosis-derived nodes as empty before one exists", async () => {
    const briefingResponse = await request(app.getHttpServer())
      .post("/briefing")
      .set(...auth)
      .send({ partnerOneName: "Tais", partnerTwoName: "Igor", venueId, lifestyleTags: ["Romântico"] })
      .expect(201);
    const eventId = briefingResponse.body.event.id;

    const beforeDiagnostico = await request(app.getHttpServer())
      .get(`/projects/${eventId}/canvas`)
      .set(...auth)
      .expect(200);

    expect(beforeDiagnostico.body.hasDiagnostico).toBe(false);
    const clientBefore = beforeDiagnostico.body.nodes.find((n: { category: string }) => n.category === "CLIENT");
    expect(clientBefore.summary).toBe("Tais & Igor");
    expect(clientBefore.hasData).toBe(true);
    const venueBefore = beforeDiagnostico.body.nodes.find((n: { category: string }) => n.category === "VENUE");
    expect(venueBefore.summary).toBe("Villa Massari");
    const experienceBefore = beforeDiagnostico.body.nodes.find((n: { category: string }) => n.category === "EXPERIENCE");
    expect(experienceBefore.hasData).toBe(false);
    // No diagnosis yet to narrow by, so the Flowers node shows the full
    // usable catalog rather than nothing.
    const flowersBefore = beforeDiagnostico.body.nodes.find((n: { category: string }) => n.category === "FLOWERS");
    expect(flowersBefore.items).toEqual(expect.arrayContaining(["Peônia"]));

    diagnosticoCriativoMock.generate.mockResolvedValueOnce({
      diagnosis: {
        perfilCasal: "Romântico contemporâneo",
        atmosferaDesejada: "Elegância leve e acolhedora",
        estiloPredominante: "Garden Fine Art",
        paletaSugerida: ["rosé", "verde sálvia"],
        mobiliarioSugerido: ["Madeira Clara"],
        iluminacaoSugerida: "Luz quente e velas",
        materiaisRecomendados: ["Peônia"],
        compatibilidadeComEspaco: "A Villa Massari favorece cerimônia externa.",
        justificativa: "O casal indicou preferência natural e romântica.",
        promptVersion: "v1",
      },
      matchedEventStyleId: gardenFineArtStyleId,
    });
    await request(app.getHttpServer())
      .post(`/creative/${eventId}/diagnostico-criativo`)
      .set(...auth)
      .expect(201);

    const afterDiagnostico = await request(app.getHttpServer())
      .get(`/projects/${eventId}/canvas`)
      .set(...auth)
      .expect(200);

    expect(afterDiagnostico.body.hasDiagnostico).toBe(true);
    const flowersAfter = afterDiagnostico.body.nodes.find((n: { category: string }) => n.category === "FLOWERS");
    // Narrowed to exactly what the diagnosis recommended.
    expect(flowersAfter.items).toEqual(["Peônia"]);
    const lightingAfter = afterDiagnostico.body.nodes.find((n: { category: string }) => n.category === "LIGHTING");
    expect(lightingAfter.summary).toBe("Luz quente e velas");
    expect(lightingAfter.hasData).toBe(true);
    const experienceAfter = afterDiagnostico.body.nodes.find((n: { category: string }) => n.category === "EXPERIENCE");
    expect(experienceAfter.summary).toBe("Elegância leve e acolhedora");
    expect(experienceAfter.hasData).toBe(true);
    // No supplier of these categories is seeded in this organization.
    const musicAfter = afterDiagnostico.body.nodes.find((n: { category: string }) => n.category === "MUSIC");
    expect(musicAfter.hasData).toBe(false);
  });
});
