import type { AuditedEntity } from "./tenant";

/** Couple/client profile — Database Bible Cap. 2 (8 dimensions). */
export interface Client extends AuditedEntity {
  partnerOneName: string;
  partnerTwoName: string | null;
  partnerOneProfession: string | null;
  partnerTwoProfession: string | null;
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
  additionalDetails: unknown;
}
