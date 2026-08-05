import { Injectable } from "@nestjs/common";
import type { ProjectTask } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProjectTaskDomain } from "../mappers/project-task.mapper";
import {
  ProjectTaskRepository,
  type CreateProjectTaskInput,
  type UpdateProjectTaskInput,
} from "./project-task.repository";

@Injectable()
export class PrismaProjectTaskRepository implements ProjectTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string): Promise<ProjectTask[]> {
    const tasks = await this.prisma.projectTask.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return tasks.map(toProjectTaskDomain);
  }

  async findById(id: string): Promise<ProjectTask | null> {
    const task = await this.prisma.projectTask.findFirst({ where: { id, deletedAt: null } });
    return task ? toProjectTaskDomain(task) : null;
  }

  async create(
    tenantId: string,
    organizationId: string,
    eventId: string,
    input: CreateProjectTaskInput,
  ): Promise<ProjectTask> {
    const task = await this.prisma.projectTask.create({
      data: {
        tenantId,
        organizationId,
        eventId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        assigneeUserId: input.assigneeUserId,
        createdBy: input.createdBy,
      },
    });
    return toProjectTaskDomain(task);
  }

  async update(id: string, input: UpdateProjectTaskInput): Promise<ProjectTask> {
    const task = await this.prisma.projectTask.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
        assigneeUserId: input.assigneeUserId,
        updatedBy: input.updatedBy,
        version: { increment: 1 },
      },
    });
    return toProjectTaskDomain(task);
  }

  async softDelete(id: string, updatedBy: string | null): Promise<void> {
    await this.prisma.projectTask.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  }
}
