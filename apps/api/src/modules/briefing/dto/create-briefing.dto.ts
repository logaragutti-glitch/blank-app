import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export enum BriefingEventType {
  WEDDING = "WEDDING",
  CORPORATE = "CORPORATE",
  KIDS = "KIDS",
  DESTINATION = "DESTINATION",
  VENUE_MANAGED = "VENUE_MANAGED",
  HOTEL = "HOTEL",
  CONVENTION = "CONVENTION",
}

// Mirrors LeadSource/FloralPreference/DesiredDecorArea in @eve-os/types —
// kept as separate DTO enums (same pattern as BriefingEventType above)
// since class-validator needs its own enum object to validate against.
export enum BriefingLeadSource {
  INSTAGRAM = "INSTAGRAM",
  FRIEND_REFERRAL = "FRIEND_REFERRAL",
  SUPPLIER_REFERRAL = "SUPPLIER_REFERRAL",
  OTHER = "OTHER",
}

export enum BriefingFloralPreference {
  MIXED = "MIXED",
  NATURAL_ONLY = "NATURAL_ONLY",
}

export enum BriefingDesiredDecorArea {
  RECEPTION = "RECEPTION",
  CEREMONY = "CEREMONY",
  GUEST_TABLES = "GUEST_TABLES",
  CAKE_TABLE = "CAKE_TABLE",
  COUPLE_TABLE = "COUPLE_TABLE",
  LOUNGE = "LOUNGE",
  OPEN_BAR = "OPEN_BAR",
  BUFFET_STATIONS = "BUFFET_STATIONS",
}

/**
 * Captures the briefing form — Database Bible Cap. 2 (8-dimension client
 * profile) plus the initial event details, in a single submission, matching
 * how the actual form works today (see docs/03-product-spec.md).
 */
export class CreateBriefingDto {
  // 1. Identidade
  @IsString()
  @IsNotEmpty()
  partnerOneName!: string;

  @IsString()
  @IsOptional()
  partnerTwoName?: string;

  @IsString()
  @IsOptional()
  partnerOneProfession?: string;

  @IsString()
  @IsOptional()
  partnerTwoProfession?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  religion?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hobbies?: string[];

  @IsEnum(BriefingLeadSource)
  @IsOptional()
  leadSource?: BriefingLeadSource;

  // 2. História
  @IsString()
  @IsOptional()
  howTheyMet?: string;

  @IsString()
  @IsOptional()
  proposalStory?: string;

  @IsString()
  @IsOptional()
  familyTradition?: string;

  // 3. Estilo de vida
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lifestyleTags?: string[];

  @IsBoolean()
  @IsOptional()
  likesBeach?: boolean;

  @IsBoolean()
  @IsOptional()
  likesCountryside?: boolean;

  // 4. Restrições
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetAmount?: number;

  @IsString()
  @IsOptional()
  budgetCurrency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dietaryRestrictions?: string[];

  @IsString()
  @IsOptional()
  accessibilityNeeds?: string;

  // Evento inicial
  @IsUUID()
  @IsNotEmpty()
  venueId!: string;

  // "Local do evento" quando o espaço real ainda não está cadastrado no
  // Knowledge Graph — venueId continua obrigatório (todo o resto do sistema
  // depende do "DNA" de um Venue já cadastrado), mas isso guarda a resposta
  // literal do casal em vez de perdê-la.
  @IsString()
  @IsOptional()
  venueNoteIfNotListed?: string;

  @IsBoolean()
  @IsOptional()
  ceremonyAndReceptionSameVenue?: boolean;

  @IsEnum(BriefingEventType)
  @IsOptional()
  eventType?: BriefingEventType;

  @IsInt()
  @Min(1)
  @IsOptional()
  guestsExpected?: number;

  @IsDateString()
  @IsOptional()
  ceremonyDateTime?: string;

  // Decoração (perguntas específicas do formulário real da Bia)
  @IsString()
  @IsOptional()
  colorPaletteNotes?: string;

  @IsString()
  @IsOptional()
  inspirationNotes?: string;

  @IsString()
  @IsOptional()
  thingsToAvoid?: string;

  @IsEnum(BriefingFloralPreference)
  @IsOptional()
  floralPreference?: BriefingFloralPreference;

  @IsArray()
  @IsEnum(BriefingDesiredDecorArea, { each: true })
  @IsOptional()
  desiredDecorAreas?: BriefingDesiredDecorArea[];

  // Logística
  @IsBoolean()
  @IsOptional()
  hasWeddingPlanner?: boolean;

  @IsString()
  @IsOptional()
  weddingPlannerName?: string;

  @IsString()
  @IsOptional()
  bookedSuppliersNotes?: string;

  @IsBoolean()
  @IsOptional()
  investmentRangeConfirmed?: boolean;

  @IsString()
  @IsOptional()
  additionalNotes?: string;
}
