import type { Client as ClientPrismaModel } from "@prisma/client";
import type { BriefingAdditionalDetails, Client } from "@eve-os/types";

export function toClientDomain(model: ClientPrismaModel): Client {
  return {
    id: model.id,
    tenantId: model.tenantId,
    organizationId: model.organizationId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
    createdBy: model.createdBy,
    updatedBy: model.updatedBy,
    version: model.version,
    partnerOneName: model.partnerOneName,
    partnerTwoName: model.partnerTwoName,
    partnerOneProfession: model.partnerOneProfession,
    partnerTwoProfession: model.partnerTwoProfession,
    email: model.email,
    phone: model.phone,
    city: model.city,
    religion: model.religion,
    hobbies: model.hobbies,
    howTheyMet: model.howTheyMet,
    proposalStory: model.proposalStory,
    familyTradition: model.familyTradition,
    lifestyleTags: model.lifestyleTags,
    likesBeach: model.likesBeach,
    likesCountryside: model.likesCountryside,
    budgetAmount: model.budgetAmount ? model.budgetAmount.toNumber() : null,
    budgetCurrency: model.budgetCurrency,
    dietaryRestrictions: model.dietaryRestrictions,
    accessibilityNeeds: model.accessibilityNeeds,
    additionalDetails: model.additionalDetails as BriefingAdditionalDetails | null,
  };
}
