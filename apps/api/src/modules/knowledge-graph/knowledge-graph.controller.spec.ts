import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { KnowledgeGraphController } from "./knowledge-graph.controller";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { VenueRepository } from "./repositories/venue.repository";

describe("KnowledgeGraphController", () => {
  const organizationId = "org-1";
  let controller: KnowledgeGraphController;
  let eventStyles: jest.Mocked<EventStyleRepository>;
  let venues: jest.Mocked<VenueRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [KnowledgeGraphController],
      providers: [
        { provide: EventStyleRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        { provide: MaterialRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        { provide: VenueRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(KnowledgeGraphController);
    eventStyles = moduleRef.get(EventStyleRepository);
    venues = moduleRef.get(VenueRepository);
  });

  it("lists styles scoped to the given organization", async () => {
    eventStyles.findAll.mockResolvedValue([]);
    await controller.listStyles(organizationId);
    expect(eventStyles.findAll).toHaveBeenCalledWith(organizationId);
  });

  it("throws NotFoundException when a venue does not exist", async () => {
    venues.findById.mockResolvedValue(null);
    await expect(controller.getVenue(organizationId, "missing-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
