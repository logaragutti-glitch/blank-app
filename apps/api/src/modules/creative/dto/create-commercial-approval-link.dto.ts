import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateCommercialApprovalLinkDto {
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiresInDays?: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  recipientName?: string;

  @IsEmail()
  @IsOptional()
  recipientEmail?: string;
}
