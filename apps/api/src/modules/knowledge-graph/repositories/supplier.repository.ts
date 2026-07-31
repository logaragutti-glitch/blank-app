import type { Supplier } from "@eve-os/types";

export abstract class SupplierRepository {
  abstract findAll(organizationId: string): Promise<Supplier[]>;
  abstract findById(organizationId: string, id: string): Promise<Supplier | null>;
}
