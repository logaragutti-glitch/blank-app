import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, Supplier } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { ProjectSuppliersController } from "./project-suppliers.controller";
import {
  ProjectSupplierRepository,
  type ProjectSupplier,
} from "./repositories/project-supplier.repository";

describe("ProjectSuppliersController", () => {
  const authUser: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: "event-1" } as Event;
  const fakeSupplier = { id: "supplier-1", name: "Flores da Serra", category: "FLORIST" } as Supplier;
  const assignment: ProjectSupplier = {
    eventId: "event-1",
    supplierId: "supplier-1",
    status: "CONTACTED",
    notes: null,
    addedAt: "2026-08-05T00:00:00.000Z",
  };

  let controller: ProjectSuppliersController;
  let events: jest.Mocked<EventRepository>;
  let assignments: jest.Mocked<ProjectSupplierRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectSuppliersController],
      providers: [
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn() } },
        {
          provide: ProjectSupplierRepository,
          useValue: { findByEvent: jest.fn(), findOne: jest.fn(), addOrUpdate: jest.fn(), remove: jest.fn() },
        },
        {
          provide: SupplierRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            setVenuePreference: jest.fn(),
            appendPerformanceNote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(ProjectSuppliersController);
    events = moduleRef.get(EventRepository);
    assignments = moduleRef.get(ProjectSupplierRepository);
    suppliers = moduleRef.get(SupplierRepository);
  });

  describe("listSuppliers", () => {
    it("composes each assignment with the supplier's name and category", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      assignments.findByEvent.mockResolvedValue([assignment]);
      suppliers.findById.mockResolvedValue(fakeSupplier);

      const result = await controller.listSuppliers(authUser, "event-1");

      expect(result).toEqual([{ ...assignment, name: "Flores da Serra", category: "FLORIST" }]);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.listSuppliers(authUser, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("addSupplier", () => {
    it("adds a supplier that belongs to the organization's Knowledge Graph", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(fakeSupplier);
      assignments.addOrUpdate.mockResolvedValue(assignment);

      const result = await controller.addSupplier(authUser, "event-1", { supplierId: "supplier-1" });

      expect(assignments.addOrUpdate).toHaveBeenCalledWith("event-1", {
        supplierId: "supplier-1",
        status: "CONTACTED",
        notes: undefined,
      });
      expect(result).toEqual({ ...assignment, name: "Flores da Serra", category: "FLORIST" });
    });

    it("throws BadRequestException when the supplier isn't in the org's Knowledge Graph", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      suppliers.findById.mockResolvedValue(null);

      await expect(
        controller.addSupplier(authUser, "event-1", { supplierId: "outsider" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("removeSupplier", () => {
    it("removes an existing assignment", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      assignments.findOne.mockResolvedValue(assignment);

      await controller.removeSupplier(authUser, "event-1", "supplier-1");

      expect(assignments.remove).toHaveBeenCalledWith("event-1", "supplier-1");
    });

    it("throws NotFoundException when the assignment doesn't exist", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      assignments.findOne.mockResolvedValue(null);

      await expect(controller.removeSupplier(authUser, "event-1", "supplier-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
