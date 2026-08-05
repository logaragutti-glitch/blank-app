import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, ProjectFile } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { EventRepository } from "../briefing/repositories/event.repository";
import { FilesController } from "./files.controller";
import { ProjectFileRepository } from "./repositories/project-file.repository";

describe("FilesController", () => {
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: "event-1" } as Event;
  const fakeFile = {
    id: "file-1",
    eventId: "event-1",
    storageKey: "project-files/event-1/abc-contrato.pdf",
    originalFilename: "contrato.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1234,
  } as ProjectFile;
  const multerFile = {
    originalname: "contrato.pdf",
    mimetype: "application/pdf",
    size: 1234,
    buffer: Buffer.from("fake"),
  } as Express.Multer.File;

  let controller: FilesController;
  let events: jest.Mocked<EventRepository>;
  let files: jest.Mocked<ProjectFileRepository>;
  let storage: jest.Mocked<StoragePort>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn() } },
        {
          provide: ProjectFileRepository,
          useValue: { findByEvent: jest.fn(), findById: jest.fn(), create: jest.fn(), softDelete: jest.fn() },
        },
        { provide: StoragePort, useValue: { upload: jest.fn(), getSignedDownloadUrl: jest.fn(), download: jest.fn(), ping: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(FilesController);
    events = moduleRef.get(EventRepository);
    files = moduleRef.get(ProjectFileRepository);
    storage = moduleRef.get(StoragePort);
  });

  describe("uploadFile", () => {
    it("uploads the file to storage and persists a record with a signed URL", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      files.create.mockResolvedValue(fakeFile);
      storage.getSignedDownloadUrl.mockResolvedValue("https://signed.example/contrato.pdf");

      const result = await controller.uploadFile(user, "event-1", multerFile);

      expect(storage.upload).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "application/pdf", body: multerFile.buffer }),
      );
      expect(files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-1",
          organizationId: "org-1",
          eventId: "event-1",
          originalFilename: "contrato.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1234,
          createdBy: "user-1",
        }),
      );
      expect(result).toEqual({ ...fakeFile, fileUrl: "https://signed.example/contrato.pdf" });
    });

    it("rejects when no file is provided", async () => {
      await expect(controller.uploadFile(user, "event-1", undefined)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects an unsupported mime type", async () => {
      const badFile = { ...multerFile, mimetype: "application/x-msdownload" } as Express.Multer.File;
      await expect(controller.uploadFile(user, "event-1", badFile)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.uploadFile(user, "missing", multerFile)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("listFiles", () => {
    it("returns the event's files with a signed URL each", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      files.findByEvent.mockResolvedValue([fakeFile]);
      storage.getSignedDownloadUrl.mockResolvedValue("https://signed.example/contrato.pdf");

      const result = await controller.listFiles(user, "event-1");

      expect(result).toEqual([{ ...fakeFile, fileUrl: "https://signed.example/contrato.pdf" }]);
    });
  });

  describe("deleteFile", () => {
    it("soft-deletes a file that belongs to the event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      files.findById.mockResolvedValue(fakeFile);

      await controller.deleteFile(user, "event-1", "file-1");

      expect(files.softDelete).toHaveBeenCalledWith("file-1", "user-1");
    });

    it("throws NotFoundException when the file belongs to a different event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      files.findById.mockResolvedValue({ ...fakeFile, eventId: "other-event" });

      await expect(controller.deleteFile(user, "event-1", "file-1")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
