import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import type { CommercialProposalSupplierInput, CommercialPricingStatus, CommercialSupplierCategory } from "@eve-os/types";

export enum CommercialSupplierCategoryDto {
  VENUE = "VENUE",
  CATERING = "CATERING",
  DECOR = "DECOR",
  FURNITURE_RENTAL = "FURNITURE_RENTAL",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  MUSIC = "MUSIC",
  LIGHTING = "LIGHTING",
  ASSEMBLY_CREW = "ASSEMBLY_CREW",
  OTHER = "OTHER",
}

export enum CommercialPricingStatusDto {
  ESTIMATE = "ESTIMATE",
  QUOTE_PENDING = "QUOTE_PENDING",
  CONFIRMED = "CONFIRMED",
}

export class CommercialSupplierSelectionDto implements CommercialProposalSupplierInput {
  @IsUUID()
  supplierId!: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsEnum(CommercialPricingStatusDto)
  @IsOptional()
  pricingStatus?: CommercialPricingStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class CommercialLineItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsEnum(CommercialSupplierCategoryDto)
  category!: CommercialSupplierCategory;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsEnum(CommercialPricingStatusDto)
  @IsOptional()
  pricingStatus?: CommercialPricingStatus;

  @IsOptional()
  included?: boolean;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class CommercialPaymentTermDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number | null;

  @IsString()
  @IsOptional()
  due?: string | null;
}

export class UpsertCommercialProposalDto {
  @IsUUID()
  @IsOptional()
  venueResearchId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialSupplierSelectionDto)
  supplierSelections!: CommercialSupplierSelectionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialLineItemDto)
  @IsOptional()
  lineItems?: CommercialLineItemDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  contingencyPercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  managementFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  validityDays?: number;

  @IsISO8601()
  @IsOptional()
  approvalDeadline?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialPaymentTermDto)
  @IsOptional()
  paymentTerms?: CommercialPaymentTermDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conditions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nextSteps?: string[];

  @IsString()
  @IsOptional()
  commercialNotes?: string | null;
}
