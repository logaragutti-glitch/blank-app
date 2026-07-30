import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { KnowledgeGraphController } from "./knowledge-graph.controller";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { VenueRepository } from "./repositories/venue.repository";

describe("KnowledgeGraphController", () => {
  const organizationId = "org-1";
  let controller: KnowledgeGraphController;
  let eventStyles: jest.Mocked<EventStyleRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let embeddings: jest.Mocked<EmbeddingPort>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [KnowledgeGraphController],
      providers: [
        {
          provide: EventStyleRepository,
          useValue: { findAll: jest.fn(), findById: jest.fn(), setEmbedding: jest.fn(), findSimilarByEmbedding: jest.fn() },
        },
        { provide: MaterialRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        { provide: VenueRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        { provide: EmbeddingPort, useValue: { embed: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(KnowledgeGraphController);
    eventStyles = moduleRef.get(EventStyleRepository);
    venues = moduleRef.get(VenueRepository);
    embeddings = moduleRef.get(EmbeddingPort);
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

  it("throws NotFoundException when backfilling the embedding of a style that does not exist", async () => {
    eventStyles.findById.mockResolvedValue(null);
    await expect(
      controller.backfillStyleEmbedding(organizationId, "missing-id"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(embeddings.embed).not.toHaveBeenCalled();
  });

  it("computes and stores the embedding of an existing style", async () => {
    const style = {
      id: "style-1",
      name: "Boho Chic",
      description: "Estilo boho",
      paletteColors: ["terracota", "areia"],
      furnitureNotes: ["mesas de madeira"],
      loungeNotes: ["poufs"],
    } as never;
    eventStyles.findById.mockResolvedValue(style);
    embeddings.embed.mockResolvedValue([0.1, 0.2, 0.3]);

    const result = await controller.backfillStyleEmbedding(organizationId, "style-1");

    expect(embeddings.embed).toHaveBeenCalledWith(expect.any(String));
    expect(eventStyles.setEmbedding).toHaveBeenCalledWith("style-1", [0.1, 0.2, 0.3]);
    expect(result).toEqual({ id: "style-1", embeddingDimensions: 3 });
  });
});
