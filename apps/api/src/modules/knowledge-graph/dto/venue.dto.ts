import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateVenueDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  structuralConstraints?: string | null;

  @IsNumber()
  @IsOptional()
  ceilingHeightMeters?: number | null;

  @IsNumber()
  @IsOptional()
  powerOutlets?: number | null;

  @IsNumber()
  @IsOptional()
  guestCapacity?: number | null;

  @IsOptional()
  existingFurniture?: unknown;

  @IsString()
  @IsOptional()
  typicalClimate?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendationNotes?: string[];
}

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
