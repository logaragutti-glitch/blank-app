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

export enum CommercialLogisticsTreatmentDto {
  INCLUDED = "INCLUDED",
  ADDITIONAL = "ADDITIONAL",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum CommercialQuoteStatusDto {
  DRAFT = "DRAFT",
  RECEIVED = "RECEIVED",
  SELECTED = "SELECTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum CommercialPaymentStatusDto {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum CommercialPackageTierDto {
  ESSENTIAL = "ESSENTIAL",
  RECOMMENDED = "RECOMMENDED",
  COMPLETE = "COMPLETE",
}

export class CommercialPackageDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsEnum(CommercialPackageTierDto)
  tier!: CommercialPackageTierDto;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  totalInvestment!: number;

  @IsEnum(CommercialPricingStatusDto)
  @IsOptional()
  pricingStatus?: CommercialPricingStatusDto;

  @IsOptional()
  selected?: boolean;
}

export enum CommercialProposalScopeDto {
  FULL_EVENT = "FULL_EVENT",
  DECORATION_ONLY = "DECORATION_ONLY",
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

  @IsOptional()
  kind?: "SUPPLIER" | "CUSTOM";

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

export class CreateCommercialPaymentDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsISO8601()
  dueDate!: string;

  @IsEnum(CommercialPaymentStatusDto)
  @IsOptional()
  status?: CommercialPaymentStatusDto;

  @IsString()
  @IsOptional()
  method?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class UpdateCommercialPaymentDto {
  @IsEnum(CommercialPaymentStatusDto)
  status!: CommercialPaymentStatusDto;

  @IsISO8601()
  @IsOptional()
  paidAt?: string | null;

  @IsString()
  @IsOptional()
  method?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class CreateCommercialQuoteDto {
  @IsUUID()
  @IsOptional()
  supplierId?: string | null;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  source?: string | null;

  @IsISO8601()
  @IsOptional()
  validUntil?: string | null;

  @IsEnum(CommercialQuoteStatusDto)
  @IsOptional()
  status?: CommercialQuoteStatusDto;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class UpdateCommercialQuoteStatusDto {
  @IsEnum(CommercialQuoteStatusDto)
  status!: CommercialQuoteStatusDto;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class CommercialLogisticsItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string | null;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsEnum(CommercialLogisticsTreatmentDto)
  @IsOptional()
  treatment?: "INCLUDED" | "ADDITIONAL" | "NOT_APPLICABLE";

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
  @IsEnum(CommercialProposalScopeDto)
  @IsOptional()
  scope?: "FULL_EVENT" | "DECORATION_ONLY";

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialLogisticsItemDto)
  @IsOptional()
  logisticsItems?: CommercialLogisticsItemDto[];

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  internalCost?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialPackageDto)
  @IsOptional()
  packages?: CommercialPackageDto[];

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
