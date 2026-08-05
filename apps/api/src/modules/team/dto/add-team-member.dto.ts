import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AddTeamMemberDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;
}
