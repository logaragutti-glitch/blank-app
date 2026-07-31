import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { KnowledgeGraphController } from "./knowledge-graph.controller";
import { MaterialCategoryDto } from "./dto/material.dto";
import { SupplierCategoryDto } from "./dto/supplier.dto";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { VenueRepository } from "./repositories/venue.repository";

describe("KnowledgeGraphController", () => {
  const organizationId = "org-1";
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId,
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  let controller: KnowledgeGraphController;
  let eventStyles: jest.Mocked<EventStyleRepository>;
  let materials: jest.Mocked<MaterialRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;
  let embeddings: jest.Mocked<EmbeddingPort>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [KnowledgeGraphController],
      providers: [
        {
          provide: EventStyleRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            setEmbedding: jest.fn(),
            findSimilarByEmbedding: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: MaterialRepository,
          useValue: { findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn() },
        },
        {
          provide: VenueRepository,
          useValue: { findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn() },
        },
        {
          provide: SupplierRepository,
          useValue: { findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn() },
        },
        { provide: EmbeddingPort, useValue: { embed: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(KnowledgeGraphController);
    eventStyles = moduleRef.get(EventStyleRepository);
    materials = moduleRef.get(MaterialRepository);
    venues = moduleRef.get(VenueRepository);
    suppliers = moduleRef.get(SupplierRepository);
    embeddings = moduleRef.get(EmbeddingPort);
  });

  it("lists styles scoped to the given organization", async () => {
    eventStyles.findAll.mockResolvedValue([]);
    await controller.listStyles(user);
    expect(eventStyles.findAll).toHaveBeenCalledWith(organizationId);
  });

  it("throws NotFoundException when a venue does not exist", async () => {
    venues.findById.mockResolvedValue(null);
    await expect(controller.getVenue(user, "missing-id")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists suppliers scoped to the given organization", async () => {
    suppliers.findAll.mockResolvedValue([]);
    await controller.listSuppliers(user);
    expect(suppliers.findAll).toHaveBeenCalledWith(organizationId);
  });

  it("throws NotFoundException when a supplier does not exist", async () => {
    suppliers.findById.mockResolvedValue(null);
    await expect(controller.getSupplier(user, "missing-id")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns an existing supplier", async () => {
    const supplier = {
      id: "supplier-1",
      name: "Flores da Serra",
      category: "FLORIST",
      performanceNotes: null,
      preferredVenueIds: ["venue-1"],
    } as never;
    suppliers.findById.mockResolvedValue(supplier);
    const result = await controller.getSupplier(user, "supplier-1");
    expect(result).toBe(supplier);
  });

  it("throws NotFoundException when backfilling the embedding of a style that does not exist", async () => {
    eventStyles.findById.mockResolvedValue(null);
    await expect(controller.backfillStyleEmbedding(user, "missing-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );
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

    const result = await controller.backfillStyleEmbedding(user, "style-1");

    expect(embeddings.embed).toHaveBeenCalledWith(expect.any(String));
    expect(eventStyles.setEmbedding).toHaveBeenCalledWith("style-1", [0.1, 0.2, 0.3]);
    expect(result).toEqual({ id: "style-1", embeddingDimensions: 3 });
  });

  describe("createStyle", () => {
    const createdStyle = {
      id: "style-1",
      name: "Boho Chic",
      description: null,
      paletteColors: [],
      furnitureNotes: [],
      loungeNotes: [],
    } as never;

    it("creates the style, defaulting array fields, and stamps createdBy", async () => {
      eventStyles.create.mockResolvedValue(createdStyle);
      embeddings.embed.mockResolvedValue([0.1]);

      await controller.createStyle(user, { name: "Boho Chic", dimensionScores: { Natural: 7 } });

      expect(eventStyles.create).toHaveBeenCalledWith("tenant-1", organizationId, {
        name: "Boho Chic",
        description: undefined,
        dimensionScores: { Natural: 7 },
        paletteColors: [],
        furnitureNotes: [],
        loungeNotes: [],
        createdBy: "user-1",
      });
    });

    it("backfills the embedding after creating, without failing the request if that fails", async () => {
      eventStyles.create.mockResolvedValue(createdStyle);
      embeddings.embed.mockRejectedValue(new Error("no OPENAI_API_KEY configured"));

      const result = await controller.createStyle(user, { name: "Boho Chic", dimensionScores: { Natural: 7 } });

      expect(result).toBe(createdStyle);
      expect(eventStyles.setEmbedding).not.toHaveBeenCalled();
    });
  });

  describe("updateStyle", () => {
    it("throws NotFoundException when the style does not exist", async () => {
      eventStyles.findById.mockResolvedValue(null);
      await expect(
        controller.updateStyle(user, "missing-id", { name: "New name" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(eventStyles.update).not.toHaveBeenCalled();
    });

    it("updates the style and stamps updatedBy", async () => {
      eventStyles.findById.mockResolvedValue({ id: "style-1" } as never);
      eventStyles.update.mockResolvedValue({ id: "style-1", name: "New name" } as never);
      embeddings.embed.mockResolvedValue([0.1]);

      await controller.updateStyle(user, "style-1", { name: "New name" });

      expect(eventStyles.update).toHaveBeenCalledWith("style-1", { name: "New name", updatedBy: "user-1" });
    });
  });

  describe("createMaterial", () => {
    it("defaults array/boolean fields and stamps createdBy", async () => {
      materials.create.mockResolvedValue({ id: "material-1" } as never);

      await controller.createMaterial(user, { name: "Peônia", category: MaterialCategoryDto.FLOWER });

      expect(materials.create).toHaveBeenCalledWith("tenant-1", organizationId, {
        name: "Peônia",
        category: MaterialCategoryDto.FLOWER,
        emotions: [],
        seasons: [],
        neverRecommend: false,
        compatibleStyleIds: [],
        incompatibleStyleIds: [],
        estimatedUnitCost: undefined,
        createdBy: "user-1",
      });
    });
  });

  describe("updateMaterial", () => {
    it("throws NotFoundException when the material does not exist", async () => {
      materials.findById.mockResolvedValue(null);
      await expect(controller.updateMaterial(user, "missing-id", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(materials.update).not.toHaveBeenCalled();
    });

    it("updates the material and stamps updatedBy", async () => {
      materials.findById.mockResolvedValue({ id: "material-1" } as never);
      materials.update.mockResolvedValue({ id: "material-1" } as never);

      await controller.updateMaterial(user, "material-1", { estimatedUnitCost: 45 });

      expect(materials.update).toHaveBeenCalledWith("material-1", { estimatedUnitCost: 45, updatedBy: "user-1" });
    });
  });

  describe("createVenue", () => {
    it("defaults recommendationNotes and stamps createdBy", async () => {
      venues.create.mockResolvedValue({ id: "venue-1" } as never);

      await controller.createVenue(user, { name: "Villa Massari" });

      expect(venues.create).toHaveBeenCalledWith("tenant-1", organizationId, {
        name: "Villa Massari",
        structuralConstraints: undefined,
        ceilingHeightMeters: undefined,
        powerOutlets: undefined,
        guestCapacity: undefined,
        existingFurniture: undefined,
        typicalClimate: undefined,
        recommendationNotes: [],
        createdBy: "user-1",
      });
    });
  });

  describe("updateVenue", () => {
    it("throws NotFoundException when the venue does not exist", async () => {
      venues.findById.mockResolvedValue(null);
      await expect(controller.updateVenue(user, "missing-id", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(venues.update).not.toHaveBeenCalled();
    });

    it("updates the venue and stamps updatedBy", async () => {
      venues.findById.mockResolvedValue({ id: "venue-1" } as never);
      venues.update.mockResolvedValue({ id: "venue-1" } as never);

      await controller.updateVenue(user, "venue-1", { guestCapacity: 150 });

      expect(venues.update).toHaveBeenCalledWith("venue-1", { guestCapacity: 150, updatedBy: "user-1" });
    });
  });

  describe("createSupplier", () => {
    it("stamps createdBy", async () => {
      suppliers.create.mockResolvedValue({ id: "supplier-1" } as never);

      await controller.createSupplier(user, { name: "Flores da Serra", category: SupplierCategoryDto.FLORIST });

      expect(suppliers.create).toHaveBeenCalledWith("tenant-1", organizationId, {
        name: "Flores da Serra",
        category: SupplierCategoryDto.FLORIST,
        performanceNotes: undefined,
        estimatedCost: undefined,
        createdBy: "user-1",
      });
    });
  });

  describe("updateSupplier", () => {
    it("throws NotFoundException when the supplier does not exist", async () => {
      suppliers.findById.mockResolvedValue(null);
      await expect(controller.updateSupplier(user, "missing-id", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(suppliers.update).not.toHaveBeenCalled();
    });

    it("updates the supplier and stamps updatedBy", async () => {
      suppliers.findById.mockResolvedValue({ id: "supplier-1" } as never);
      suppliers.update.mockResolvedValue({ id: "supplier-1" } as never);

      await controller.updateSupplier(user, "supplier-1", { estimatedCost: 3800 });

      expect(suppliers.update).toHaveBeenCalledWith("supplier-1", { estimatedCost: 3800, updatedBy: "user-1" });
    });
  });
});
