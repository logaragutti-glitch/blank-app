import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import type { StyleDimensionScores } from "@eve-os/types";

export class CreateEventStyleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  /** Intensity scores per dimension (0-10), e.g. { Luxuoso: 8, Natural: 7.8 } — never binary categories. */
  @IsObject()
  dimensionScores!: StyleDimensionScores;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paletteColors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  furnitureNotes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  loungeNotes?: string[];
}

export class UpdateEventStyleDto extends PartialType(CreateEventStyleDto) {}
