import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum PublicCommercialDecisionDto {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class PublicCommercialDecisionInputDto {
  @IsEnum(PublicCommercialDecisionDto)
  decision!: PublicCommercialDecisionDto;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;
}
