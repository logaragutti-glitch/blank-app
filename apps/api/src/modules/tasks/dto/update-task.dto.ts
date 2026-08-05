import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsOptional } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";

export enum ProjectTaskStatusDto {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(ProjectTaskStatusDto)
  @IsOptional()
  status?: ProjectTaskStatusDto;
}
