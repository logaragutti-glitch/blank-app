import type { AuditedEntity } from "./tenant";

export type SupplierCategory =
  | "FLORIST"
  | "CATERING"
  | "LIGHTING"
  | "FURNITURE_RENTAL"
  | "PHOTOGRAPHY"
  | "MUSIC"
  // Equipe de montagem/desmontagem do dia do evento — ver comentário no
  // schema.prisma. Alimenta o custo de mão de obra do Agente 4 pelo mesmo
  // mecanismo de "fornecedor mais barato por categoria" já usado para as
  // demais categorias, sem lógica nova.
  | "ASSEMBLY_CREW"
  | "OTHER";

export interface SupplierPerformanceReview {
  id: string;
  eventId: string;
  supplierId: string;
  overallRating: number | null;
  qualityRating: number | null;
  punctualityRating: number | null;
  communicationRating: number | null;
  scopeFulfillment: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier extends AuditedEntity {
  name: string;
  category: SupplierCategory;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagramUrl: string | null;
  serviceArea: string[];
  sourceUrl: string | null;
  validationLevel: string | null;
  contactStatus: string;
  /** Free-text notes on past performance (Database Bible Cap. 9 — feeds the incremental learning loop). */
  performanceNotes: string | null;
  /** Venues this supplier is a preferred choice for. */
  preferredVenueIds: string[];
  /** Estimated cost (BRL) to engage this supplier for a typical event — null until filled in. */
  estimatedCost: number | null;
  /** S3 storage keys of real photos of this supplier's work (pieces, setups, buffet...). */
  photoKeys: string[];
  /** Signed GET URLs for `photoKeys` — see Venue.photoUrls for the pattern. */
  photoUrls?: string[];
}
