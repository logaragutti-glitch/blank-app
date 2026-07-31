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

export interface Supplier extends AuditedEntity {
  name: string;
  category: SupplierCategory;
  /** Free-text notes on past performance (Database Bible Cap. 9 — feeds the incremental learning loop). */
  performanceNotes: string | null;
  /** Venues this supplier is a preferred choice for. */
  preferredVenueIds: string[];
  /** Estimated cost (BRL) to engage this supplier for a typical event — null until filled in. */
  estimatedCost: number | null;
}
