import {
  IsArray,
  IsBoolean,
  IsDateString,
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
}
