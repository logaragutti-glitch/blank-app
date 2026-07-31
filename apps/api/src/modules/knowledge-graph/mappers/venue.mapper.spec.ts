import type { Venue as VenuePrismaModel } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { toVenueDomain } from "./venue.mapper";

function buildModel(overrides: Partial<VenuePrismaModel> = {}): VenuePrismaModel {
  return {
    id: "venue-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    name: "Villa Massari",
    structuralConstraints: null,
    ceilingHeightMeters: null,
    powerOutlets: null,
    guestCapacity: null,
    existingFurniture: null,
    typicalClimate: null,
    recommendationNotes: ["cerimônia externa", "iluminação quente"],
    ...overrides,
  };
}

describe("toVenueDomain", () => {
  it("converts a Prisma Decimal ceiling height to a plain number", () => {
    const domain = toVenueDomain(
      buildModel({ ceilingHeightMeters: new Prisma.Decimal("4.50") }),
    );
    expect(domain.ceilingHeightMeters).toBe(4.5);
  });

  it("keeps ceiling height null when not set", () => {
    const domain = toVenueDomain(buildModel());
    expect(domain.ceilingHeightMeters).toBeNull();
  });

  it("passes through recommendation notes", () => {
    const domain = toVenueDomain(buildModel());
    expect(domain.recommendationNotes).toEqual(["cerimônia externa", "iluminação quente"]);
  });
});
