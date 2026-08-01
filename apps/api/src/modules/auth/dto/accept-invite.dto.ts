import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
