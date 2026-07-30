import type { AuditedEntity } from "./tenant";

export type MaterialCategory = "FLOWER" | "FABRIC" | "FURNITURE" | "LIGHTING" | "OTHER";

export interface Material extends AuditedEntity {
  name: string;
  category: MaterialCategory;
  emotions: string[];
  seasons: string[];
  /** Items on the "never recommend" list (e.g. Neon, LED RGB) — see Brand Bible golden rules. */
  neverRecommend: boolean;
  compatibleStyleIds: string[];
  incompatibleStyleIds: string[];
}
