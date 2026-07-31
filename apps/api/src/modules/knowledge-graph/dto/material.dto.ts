import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export enum MaterialCategoryDto {
  FLOWER = "FLOWER",
  FABRIC = "FABRIC",
  FURNITURE = "FURNITURE",
  LIGHTING = "LIGHTING",
  OTHER = "OTHER",
}

/**
 * Manual Knowledge Graph management (Sprint 5+ item 9, apps/admin) — until
 * now Material only had a read API, with no way to register or edit a
 * material without touching the database directly.
 */
export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MaterialCategoryDto)
  category!: MaterialCategoryDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emotions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seasons?: string[];

  @IsBoolean()
  @IsOptional()
  neverRecommend?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  compatibleStyleIds?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  incompatibleStyleIds?: string[];

  @IsNumber()
  @IsOptional()
  estimatedUnitCost?: number | null;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
