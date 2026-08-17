import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export enum SupplierCategoryDto {
  FLORIST = "FLORIST",
  CATERING = "CATERING",
  LIGHTING = "LIGHTING",
  FURNITURE_RENTAL = "FURNITURE_RENTAL",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  MUSIC = "MUSIC",
  ASSEMBLY_CREW = "ASSEMBLY_CREW",
  OTHER = "OTHER",
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(SupplierCategoryDto)
  category!: SupplierCategoryDto;

  @IsString()
  @IsOptional()
  phone?: string | null;

  @IsString()
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  website?: string | null;

  @IsString()
  @IsOptional()
  instagramUrl?: string | null;

  @IsString({ each: true })
  @IsOptional()
  serviceArea?: string[];

  @IsString()
  @IsOptional()
  sourceUrl?: string | null;

  @IsString()
  @IsOptional()
  validationLevel?: string | null;

  @IsString()
  @IsOptional()
  contactStatus?: string;

  @IsString()
  @IsOptional()
  performanceNotes?: string | null;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number | null;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
