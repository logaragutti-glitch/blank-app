import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export enum CommercialStatusActionDto {
  READY = "READY",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class UpdateCommercialStatusDto {
  @IsEnum(CommercialStatusActionDto)
  status!: CommercialStatusActionDto;

  @IsBoolean()
  @IsOptional()
  acknowledgeUnconfirmedData?: boolean;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
