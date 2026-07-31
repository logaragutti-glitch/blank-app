import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, Supplier } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { FeedbackController } from "./feedback.controller";
import { PostEventFeedbackRepository } from "./repositories/post-event-feedback.repository";

describe("FeedbackController", () => {
  const eventId = "event-1";
  const venueId = "venue-1";
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const supplierId = "00000000-0000-0000-0000-000000000001";
  const fakeEvent = { id: eventId, venueId } as Event;
  const fakeSupplier = { id: supplierId, name: "Flores da Serra" } as Supplier;

  let controller: FeedbackController;
  let events: jest.Mocked<EventRepository>;
  let feedback: jest.Mocked<PostEventFeedbackRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        { provide: EventRepository, useValue: { create: jest.fn(), findById: jest.fn() } },
        { provide: PostEventFeedbackRepository, useValue: { upsert: jest.fn(), findByEvent: jest.fn() } },
        {
          provide: SupplierRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            setVenuePreference: jest.fn(),
            appendPerformanceNote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(FeedbackController);
    events = moduleRef.get(EventRepository);
    feedback = moduleRef.get(PostEventFeedbackRepository);
    suppliers = moduleRef.get(SupplierRepository);
  });

  describe("upsertFeedback", () => {
    it("throws NotFoundException when the event does not exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(
        controller.upsertFeedback(user, eventId, { whatDelighted: "Tudo" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(feedback.upsert).not.toHaveBeenCalled();
    });

    it("upserts the feedback scoped to the caller's organization", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      const dto = {
        whatDelighted: "A entrada surpreendeu os convidados",
      };
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: dto.whatDelighted,
        setupAdjustments: null,
        supplierPerformance: null,
        whatWorkedForSpaceType: null,
      });

      const result = await controller.upsertFeedback(user, eventId, dto);

      expect(events.findById).toHaveBeenCalledWith(user.organizationId, eventId);
      expect(feedback.upsert).toHaveBeenCalledWith(eventId, expect.objectContaining(dto));
      expect(result.whatDelighted).toBe(dto.whatDelighted);
    });

    it("does not touch the Knowledge Graph when no supplierPerformance is sent", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: "Tudo",
        setupAdjustments: null,
        supplierPerformance: null,
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, { whatDelighted: "Tudo" });

      expect(suppliers.findById).not.toHaveBeenCalled();
      expect(suppliers.setVenuePreference).not.toHaveBeenCalled();
      expect(suppliers.appendPerformanceNote).not.toHaveBeenCalled();
    });

    it("promotes a supplier at this event's venue when rated 4 or 5", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(fakeSupplier);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: null,
        setupAdjustments: null,
        supplierPerformance: [{ supplierId, rating: 5, notes: "Pontual" }],
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, {
        supplierPerformance: [{ supplierId, rating: 5, notes: "Pontual" }],
      });

      expect(suppliers.findById).toHaveBeenCalledWith(user.organizationId, supplierId);
      expect(suppliers.setVenuePreference).toHaveBeenCalledWith(venueId, supplierId, true);
      expect(suppliers.appendPerformanceNote).toHaveBeenCalledWith(
        supplierId,
        expect.stringContaining("nota 5/5"),
      );
    });

    it("demotes a supplier at this event's venue when rated 1 or 2", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(fakeSupplier);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: null,
        setupAdjustments: null,
        supplierPerformance: [{ supplierId, rating: 1 }],
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, {
        supplierPerformance: [{ supplierId, rating: 1 }],
      });

      expect(suppliers.setVenuePreference).toHaveBeenCalledWith(venueId, supplierId, false);
    });

    it("leaves the preference untouched for a neutral rating of 3", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(fakeSupplier);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: null,
        setupAdjustments: null,
        supplierPerformance: [{ supplierId, rating: 3 }],
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, {
        supplierPerformance: [{ supplierId, rating: 3 }],
      });

      expect(suppliers.setVenuePreference).not.toHaveBeenCalled();
      // A neutral rating still records history, just doesn't move the preference.
      expect(suppliers.appendPerformanceNote).toHaveBeenCalled();
    });

    it("skips reconciliation for a non-UUID supplier id without querying the Knowledge Graph", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: null,
        setupAdjustments: null,
        supplierPerformance: [{ supplierId: "supplier-1", rating: 5, notes: "Pontual" }],
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, {
        supplierPerformance: [{ supplierId: "supplier-1", rating: 5, notes: "Pontual" }],
      });

      // supplierId isn't @IsUUID()-validated at capture time (see the DTO),
      // so a non-UUID string must never reach a @db.Uuid Prisma query —
      // that throws at the database level instead of just finding nothing.
      expect(suppliers.findById).not.toHaveBeenCalled();
      expect(suppliers.setVenuePreference).not.toHaveBeenCalled();
      expect(suppliers.appendPerformanceNote).not.toHaveBeenCalled();
    });

    it("skips reconciliation for a well-formed but unknown supplier id", async () => {
      const unknownSupplierId = "00000000-0000-0000-0000-000000009999";
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(null);
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: null,
        setupAdjustments: null,
        supplierPerformance: [{ supplierId: unknownSupplierId, rating: 5 }],
        whatWorkedForSpaceType: null,
      });

      await controller.upsertFeedback(user, eventId, {
        supplierPerformance: [{ supplierId: unknownSupplierId, rating: 5 }],
      });

      expect(suppliers.findById).toHaveBeenCalledWith(user.organizationId, unknownSupplierId);
      expect(suppliers.setVenuePreference).not.toHaveBeenCalled();
      expect(suppliers.appendPerformanceNote).not.toHaveBeenCalled();
    });
  });

  describe("getFeedback", () => {
    it("throws NotFoundException when the event does not exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.getFeedback(user, eventId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws NotFoundException when no feedback has been recorded yet", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      feedback.findByEvent.mockResolvedValue(null);
      await expect(controller.getFeedback(user, eventId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns the recorded feedback", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      const record = {
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: "Tudo",
        setupAdjustments: null,
        supplierPerformance: null,
        whatWorkedForSpaceType: null,
      };
      feedback.findByEvent.mockResolvedValue(record);

      const result = await controller.getFeedback(user, eventId);
      expect(result).toEqual(record);
    });
  });
});
