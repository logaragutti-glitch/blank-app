import type { Material } from "@eve-os/types";

export abstract class MaterialRepository {
  abstract findAll(organizationId: string): Promise<Material[]>;
  abstract findById(organizationId: string, id: string): Promise<Material | null>;
}
