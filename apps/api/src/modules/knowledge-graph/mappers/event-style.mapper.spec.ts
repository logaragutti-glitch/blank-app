import type { EventStyle as EventStylePrismaModel } from "@prisma/client";
import { toEventStyleDomain } from "./event-style.mapper";

function buildModel(overrides: Partial<EventStylePrismaModel> = {}): EventStylePrismaModel {
  return {
    id: "style-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    name: "Garden Fine Art",
    description: null,
    dimensionScores: { Luxuoso: 8, Natural: 7.8 },
    paletteColors: ["rosé", "verde sálvia", "champagne"],
    furnitureNotes: ["madeira clara"],
    loungeNotes: ["fibra natural"],
    ...overrides,
  };
}

describe("toEventStyleDomain", () => {
  it("maps timestamps to ISO strings", () => {
    const domain = toEventStyleDomain(buildModel());
    expect(domain.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(domain.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("maps a soft-deleted record's deletedAt", () => {
    const domain = toEventStyleDomain(
      buildModel({ deletedAt: new Date("2026-01-03T00:00:00.000Z") }),
    );
    expect(domain.deletedAt).toBe("2026-01-03T00:00:00.000Z");
  });

  it("passes through dimension scores and palette/furniture/lounge notes", () => {
    const domain = toEventStyleDomain(buildModel());
    expect(domain.dimensionScores).toEqual({ Luxuoso: 8, Natural: 7.8 });
    expect(domain.paletteColors).toEqual(["rosé", "verde sálvia", "champagne"]);
  });
});
