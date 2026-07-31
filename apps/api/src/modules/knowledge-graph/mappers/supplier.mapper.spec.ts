import { toSupplierDomain } from "./supplier.mapper";

type SupplierModelInput = Parameters<typeof toSupplierDomain>[0];

function buildModel(overrides: Partial<SupplierModelInput> = {}): SupplierModelInput {
  return {
    id: "supplier-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    name: "Flores da Serra",
    category: "FLORIST",
    performanceNotes: "Entrega sempre pontual, boa relação de custo-benefício.",
    venues: [{ venueId: "venue-villa-massari" }],
    ...overrides,
  };
}

describe("toSupplierDomain", () => {
  it("flattens the preferred-venue relation to an id array", () => {
    const domain = toSupplierDomain(buildModel());
    expect(domain.preferredVenueIds).toEqual(["venue-villa-massari"]);
  });

  it("handles a supplier with no preferred venues yet", () => {
    const domain = toSupplierDomain(buildModel({ venues: [] }));
    expect(domain.preferredVenueIds).toEqual([]);
  });
});
