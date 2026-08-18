import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpsertSupplierPerformanceReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  scopeFulfillment?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
