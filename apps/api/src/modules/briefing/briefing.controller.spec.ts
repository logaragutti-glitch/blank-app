import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Client, Event, InspirationImage } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { VisionAnalysisPort } from "./ai/vision-analysis.port";
import { BriefingController } from "./briefing.controller";
import { BriefingFloralPreference, BriefingLeadSource } from "./dto/create-briefing.dto";
import { ClientRepository } from "./repositories/client.repository";
import { EventRepository } from "./repositories/event.repository";
import { InspirationImageRepository } from "./repositories/inspiration-image.repository";

describe("BriefingController", () => {
  const eventId = "event-1";
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: eventId } as Event;
  const fakeImage = {
    id: "image-1",
    eventId,
    storageKey: "inspiration/event-1/photo.jpg",
    originalFilename: "photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    status: "PENDING",
    visionTags: null,
    visionDescription: null,
    processingError: null,
  } as InspirationImage;

  let controller: BriefingController;
  let clients: jest.Mocked<ClientRepository>;
  let events: jest.Mocked<EventRepository>;
  let images: jest.Mocked<InspirationImageRepository>;
  let storage: jest.Mocked<StoragePort>;
  let visionAnalysis: jest.Mocked<VisionAnalysisPort>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BriefingController],
      providers: [
        { provide: ClientRepository, useValue: { create: jest.fn() } },
        { provide: EventRepository, useValue: { create: jest.fn(), findById: jest.fn() } },
        {
          provide: InspirationImageRepository,
          useValue: { create: jest.fn(), findByEvent: jest.fn(), updateAnalysis: jest.fn(), setEmbedding: jest.fn() },
        },
        { provide: StoragePort, useValue: { upload: jest.fn(), getSignedDownloadUrl: jest.fn() } },
        { provide: VisionAnalysisPort, useValue: { analyze: jest.fn() } },
        { provide: EmbeddingPort, useValue: { embed: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(BriefingController);
    clients = moduleRef.get(ClientRepository);
    events = moduleRef.get(EventRepository);
    images = moduleRef.get(InspirationImageRepository);
    storage = moduleRef.get(StoragePort);
    visionAnalysis = moduleRef.get(VisionAnalysisPort);
  });

  describe("createBriefing", () => {
    const fakeClient = { id: "client-1" } as Client;

    beforeEach(() => {
      clients.create.mockResolvedValue(fakeClient);
      events.create.mockResolvedValue(fakeEvent);
    });

    it("passes email/phone straight through as first-class fields", async () => {
      await controller.createBriefing(user, {
        partnerOneName: "Karen",
        venueId: "venue-1",
        email: "karen@example.com",
        phone: "+55 11 90000-0000",
      });

      expect(clients.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "karen@example.com", phone: "+55 11 90000-0000" }),
      );
    });

    it("collects the extra Bia-form questions into additionalDetails", async () => {
      await controller.createBriefing(user, {
        partnerOneName: "Karen",
        venueId: "venue-1",
        leadSource: BriefingLeadSource.INSTAGRAM,
        ceremonyAndReceptionSameVenue: true,
        thingsToAvoid: "Flores artificiais",
        floralPreference: BriefingFloralPreference.NATURAL_ONLY,
        investmentRangeConfirmed: false,
      });

      expect(clients.create).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalDetails: {
            leadSource: "INSTAGRAM",
            ceremonyAndReceptionSameVenue: true,
            thingsToAvoid: "Flores artificiais",
            floralPreference: "NATURAL_ONLY",
            investmentRangeConfirmed: false,
          },
        }),
      );
    });

    it("omits additionalDetails entirely when none of those questions were answered", async () => {
      await controller.createBriefing(user, { partnerOneName: "Karen", venueId: "venue-1" });

      expect(clients.create.mock.calls[0]?.[0]).not.toHaveProperty("additionalDetails");
    });
  });

  describe("uploadInspirationImage", () => {
    const file = {
      buffer: Buffer.from("fake-bytes"),
      mimetype: "image/jpeg",
      originalname: "photo.jpg",
      size: 1024,
    } as Express.Multer.File;

    it("throws BadRequestException when no file is uploaded", async () => {
      await expect(controller.uploadInspirationImage(user, eventId, undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws BadRequestException for an unsupported mime type", async () => {
      await expect(
        controller.uploadInspirationImage(user, eventId, { ...file, mimetype: "application/pdf" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws NotFoundException when the event does not exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.uploadInspirationImage(user, eventId, file)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("uploads, analyzes and returns the image with a signed URL attached", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      images.create.mockResolvedValue(fakeImage);
      images.updateAnalysis.mockResolvedValue({
        ...fakeImage,
        status: "ANALYZED",
        visionTags: { flowers: ["Peônia"] },
        visionDescription: "Mesa florida em tons pastel",
      });
      visionAnalysis.analyze.mockResolvedValue({
        tags: { flowers: ["Peônia"] },
        description: "Mesa florida em tons pastel",
        promptVersion: "v1",
      });
      storage.getSignedDownloadUrl.mockResolvedValue("https://minio.local/signed-url");

      const result = await controller.uploadInspirationImage(user, eventId, file);

      expect(storage.upload).toHaveBeenCalled();
      expect(result.status).toBe("ANALYZED");
      expect(result.imageUrl).toBe("https://minio.local/signed-url");
    });

    it("records a FAILED image (still with a signed URL) instead of throwing when analysis fails", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      images.create.mockResolvedValue(fakeImage);
      images.updateAnalysis.mockResolvedValue({
        ...fakeImage,
        status: "FAILED",
        processingError: "Vision API unavailable",
      });
      visionAnalysis.analyze.mockRejectedValue(new Error("Vision API unavailable"));
      storage.getSignedDownloadUrl.mockResolvedValue("https://minio.local/signed-url");

      const result = await controller.uploadInspirationImage(user, eventId, file);

      expect(result.status).toBe("FAILED");
      expect(result.imageUrl).toBe("https://minio.local/signed-url");
    });
  });

  describe("listInspirationImages", () => {
    it("attaches a signed URL to every image", async () => {
      images.findByEvent.mockResolvedValue([fakeImage, { ...fakeImage, id: "image-2" }]);
      storage.getSignedDownloadUrl.mockResolvedValue("https://minio.local/signed-url");

      const result = await controller.listInspirationImages(user, eventId);

      expect(result).toHaveLength(2);
      expect(result.every((image) => image.imageUrl === "https://minio.local/signed-url")).toBe(true);
    });
  });
});
