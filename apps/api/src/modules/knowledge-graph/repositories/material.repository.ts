import type { Material, MaterialCategory } from "@eve-os/types";

export interface CreateMaterialInput {
  name: string;
  category: MaterialCategory;
  emotions: string[];
  seasons: string[];
  neverRecommend: boolean;
  compatibleStyleIds: string[];
  incompatibleStyleIds: string[];
  estimatedUnitCost: number | null | undefined;
  createdBy: string | null;
}

export interface UpdateMaterialInput {
  name?: string;
  category?: MaterialCategory;
  emotions?: string[];
  seasons?: string[];
  neverRecommend?: boolean;
  compatibleStyleIds?: string[];
  incompatibleStyleIds?: string[];
  estimatedUnitCost?: number | null;
  updatedBy: string | null;
}

export abstract class MaterialRepository {
  abstract findAll(organizationId: string): Promise<Material[]>;
  abstract findById(organizationId: string, id: string): Promise<Material | null>;
  abstract create(tenantId: string, organizationId: string, input: CreateMaterialInput): Promise<Material>;
  abstract update(id: string, input: UpdateMaterialInput): Promise<Material>;

  // See VenueRepository.addPhotoKey/removePhotoKey for why this is a
  // separate pair of methods rather than folded into update().
  abstract addPhotoKey(id: string, key: string): Promise<Material>;
  abstract removePhotoKey(id: string, key: string): Promise<Material>;
}
