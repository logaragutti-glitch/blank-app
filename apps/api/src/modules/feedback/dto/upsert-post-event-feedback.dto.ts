import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

// supplierId is a plain string, not @IsUUID() — there is no Supplier
// endpoint/repository yet to validate against, and (see RegisterDto) the
// Knowledge Graph's own seed data uses fixed placeholder ids that aren't
// valid RFC4122 UUIDs anyway.
export class SupplierPerformanceEntryDto {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Structured post-event feedback (Database Bible Cap. 9). All fields are
 * optional since feedback can be captured incrementally (e.g. supplier
 * performance noted right after teardown, the couple's reaction added a
 * few days later).
 */
export class UpsertPostEventFeedbackDto {
  @IsString()
  @IsOptional()
  whatDelighted?: string;

  @IsString()
  @IsOptional()
  setupAdjustments?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SupplierPerformanceEntryDto)
  supplierPerformance?: SupplierPerformanceEntryDto[];

  @IsString()
  @IsOptional()
  whatWorkedForSpaceType?: string;
}
