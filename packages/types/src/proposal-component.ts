/**
 * The 18 reusable proposal components (Constitution Capitulo 7, see
 * 03-product-spec.md) — independent, reusable building blocks of a proposal,
 * never a monolithic PDF template.
 */
export type ComponentType =
  | "COVER"
  | "BIA_STORY"
  | "COUPLE_STORY"
  | "CONCEPT"
  | "MOODBOARD"
  | "PALETTE"
  | "ENTRANCE"
  | "CEREMONY"
  | "CAKE_TABLE"
  | "LOUNGE"
  | "GUEST_TABLES"
  | "BAR"
  | "BUFFET"
  | "DANCE_FLOOR"
  | "LIGHTING"
  | "FLORALS"
  | "TIMELINE"
  | "INVESTMENT";

/** A single reusable component of a Proposal — `content` shape varies by `type`. */
export interface ProposalComponent {
  id: string;
  proposalId: string;
  type: ComponentType;
  /** Display order within the proposal. */
  order: number;
  content: Record<string, unknown>;
}
