import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export enum ProjectSupplierStatusDto {
  CONTACTED = "CONTACTED",
  NEGOTIATING = "NEGOTIATING",
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
}

export class AddProjectSupplierDto {
  @IsUUID()
  supplierId!: string;

  @IsEnum(ProjectSupplierStatusDto)
  @IsOptional()
  status?: ProjectSupplierStatusDto;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
