import { IsDateString, IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum ClientInteractionTypeDto {
  CALL = "CALL",
  MEETING = "MEETING",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  MILESTONE = "MILESTONE",
  NOTE = "NOTE",
  OTHER = "OTHER",
}

export class CreateClientInteractionDto {
  @IsEnum(ClientInteractionTypeDto)
  type!: ClientInteractionTypeDto;

  @IsDateString()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  notes!: string;
}
