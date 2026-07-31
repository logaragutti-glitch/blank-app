import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export enum SupplierCategoryDto {
  FLORIST = "FLORIST",
  CATERING = "CATERING",
  LIGHTING = "LIGHTING",
  FURNITURE_RENTAL = "FURNITURE_RENTAL",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  MUSIC = "MUSIC",
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
  performanceNotes?: string | null;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number | null;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
