import type { AuditedEntity } from "./tenant";

/** How the couple heard about Bia's work — first question of the real intake form. */
export type LeadSource = "INSTAGRAM" | "FRIEND_REFERRAL" | "SUPPLIER_REFERRAL" | "OTHER";

/** "A parte floral pode ser mista (permanentes com naturais) ou apenas naturais?" */
export type FloralPreference = "MIXED" | "NATURAL_ONLY";

/**
 * "Em quais espaços quer decoração?" — mirrors the areas the 18
 * ProposalComponents already cover (proposal-component-builder.ts), so this
 * doubles as an early signal of what the couple actually cares about before
 * Agente 3 writes the full proposal.
 */
export type DesiredDecorArea =
  | "RECEPTION"
  | "CEREMONY"
  | "GUEST_TABLES"
  | "CAKE_TABLE"
  | "COUPLE_TABLE"
  | "LOUNGE"
  | "OPEN_BAR"
  | "BUFFET_STATIONS";

/**
 * The extra questions from the real Bia intake form ("Decoração de
 * Casamento") that don't have their own column on Client yet — stored as
 * free-form JSON (Client.additionalDetails) rather than a migration per
 * field, since this form evolves independently of the core domain model.
 * Every field is optional: older briefings (or ones filled out before a
 * given question existed) simply won't have it.
 */
export interface BriefingAdditionalDetails {
  leadSource?: LeadSource;
  /** "Cerimônia e festa: no mesmo local ou em locais diferentes?" */
  ceremonyAndReceptionSameVenue?: boolean;
  /** Free text — "Local do evento" when it isn't one of the catalogued Venues yet. */
  venueNoteIfNotListed?: string;
  colorPaletteNotes?: string;
  /** "Existe alguma decoração que vocês viram e amaram? Link, foto ou descrição" — the actual photos go to InspirationImage; this is the accompanying text/link. */
  inspirationNotes?: string;
  /** "Há algo que vocês definitivamente NÃO querem na decoração?" */
  thingsToAvoid?: string;
  floralPreference?: FloralPreference;
  desiredDecorAreas?: DesiredDecorArea[];
  hasWeddingPlanner?: boolean;
  weddingPlannerName?: string;
  bookedSuppliersNotes?: string;
  /** "O projeto é a partir de R$ 20 mil — essa faixa está alinhada ao planejamento de vocês?" */
  investmentRangeConfirmed?: boolean;
  additionalNotes?: string;
}

/** Couple/client profile — Database Bible Cap. 2 (8 dimensions). */
export interface Client extends AuditedEntity {
  partnerOneName: string;
  partnerTwoName: string | null;
  partnerOneProfession: string | null;
  partnerTwoProfession: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  religion: string | null;
  hobbies: string[];
  howTheyMet: string | null;
  proposalStory: string | null;
  familyTradition: string | null;
  lifestyleTags: string[];
  likesBeach: boolean | null;
  likesCountryside: boolean | null;
  budgetAmount: number | null;
  budgetCurrency: string;
  dietaryRestrictions: string[];
  accessibilityNeeds: string | null;
  additionalDetails: BriefingAdditionalDetails | null;
}
