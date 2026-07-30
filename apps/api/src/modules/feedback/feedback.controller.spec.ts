import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { FeedbackController } from "./feedback.controller";
import { PostEventFeedbackRepository } from "./repositories/post-event-feedback.repository";

describe("FeedbackController", () => {
  const eventId = "event-1";
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: eventId } as Event;

  let controller: FeedbackController;
  let events: jest.Mocked<EventRepository>;
  let feedback: jest.Mocked<PostEventFeedbackRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        { provide: EventRepository, useValue: { create: jest.fn(), findById: jest.fn() } },
        { provide: PostEventFeedbackRepository, useValue: { upsert: jest.fn(), findByEvent: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(FeedbackController);
    events = moduleRef.get(EventRepository);
    feedback = moduleRef.get(PostEventFeedbackRepository);
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
        supplierPerformance: [{ supplierId: "supplier-1", rating: 5, notes: "Pontual" }],
      };
      feedback.upsert.mockResolvedValue({
        id: "feedback-1",
        eventId,
        createdAt: "2026-01-01T00:00:00.000Z",
        whatDelighted: dto.whatDelighted,
        setupAdjustments: null,
        supplierPerformance: dto.supplierPerformance,
        whatWorkedForSpaceType: null,
      });

      const result = await controller.upsertFeedback(user, eventId, dto);

      expect(events.findById).toHaveBeenCalledWith(user.organizationId, eventId);
      expect(feedback.upsert).toHaveBeenCalledWith(eventId, expect.objectContaining(dto));
      expect(result.whatDelighted).toBe(dto.whatDelighted);
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
