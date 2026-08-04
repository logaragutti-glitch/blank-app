import type { BriefingAdditionalDetails, Client } from "@eve-os/types";

export interface CreateClientInput {
  tenantId: string;
  organizationId: string;
  partnerOneName: string;
  partnerTwoName?: string | null;
  partnerOneProfession?: string | null;
  partnerTwoProfession?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  religion?: string | null;
  hobbies?: string[];
  howTheyMet?: string | null;
  proposalStory?: string | null;
  familyTradition?: string | null;
  lifestyleTags?: string[];
  likesBeach?: boolean | null;
  likesCountryside?: boolean | null;
  budgetAmount?: number | null;
  budgetCurrency?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string | null;
  additionalDetails?: BriefingAdditionalDetails;
}

export abstract class ClientRepository {
  abstract create(input: CreateClientInput): Promise<Client>;
  abstract findById(organizationId: string, id: string): Promise<Client | null>;
}
