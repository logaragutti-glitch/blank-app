import { toMaterialDomain } from "./material.mapper";

type MaterialModelInput = Parameters<typeof toMaterialDomain>[0];

function buildModel(overrides: Partial<MaterialModelInput> = {}): MaterialModelInput {
  return {
    id: "material-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    name: "Peônia",
    category: "FLOWER",
    emotions: ["Romance", "Abundância", "Delicadeza"],
    seasons: ["Primavera"],
    neverRecommend: false,
    compatibleStyles: [{ id: "style-garden" }],
    incompatibleStyles: [{ id: "style-futurista" }, { id: "style-industrial" }],
    ...overrides,
  };
}

describe("toMaterialDomain", () => {
  it("flattens compatible/incompatible style relations to id arrays", () => {
    const domain = toMaterialDomain(buildModel());
    expect(domain.compatibleStyleIds).toEqual(["style-garden"]);
    expect(domain.incompatibleStyleIds).toEqual(["style-futurista", "style-industrial"]);
  });

  it("preserves the never-recommend flag for banned materials", () => {
    const domain = toMaterialDomain(
      buildModel({ name: "Neon", category: "LIGHTING", neverRecommend: true, compatibleStyles: [], incompatibleStyles: [] }),
    );
    expect(domain.neverRecommend).toBe(true);
    expect(domain.compatibleStyleIds).toEqual([]);
  });
});
