import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectTaskRepository } from "./repositories/project-task.repository";

// Tarefas do Projeto (Bucket C) — a plain checklist per Event, independent
// from the AI-generated ProductionPlan.checklist. Route mirrors the
// events/:eventId/feedback convention (see FeedbackModule) rather than
// living under /projects, since this is a real CRUD resource, not a
// composed read model like ProjectsController.
@ApiTags("tasks")
@ApiBearerAuth()
@Controller("events/:eventId/tasks")
export class TasksController {
  constructor(
    private readonly events: EventRepository,
    private readonly tasks: ProjectTaskRepository,
  ) {}

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  @Get()
  async listTasks(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    await this.requireEvent(user.organizationId, eventId);
    return this.tasks.findByEvent(eventId);
  }

  @Post()
  async createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: CreateTaskDto,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    return this.tasks.create(user.tenantId, user.organizationId, eventId, {
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      assigneeUserId: dto.assigneeUserId,
      createdBy: user.sub,
    });
  }

  @Patch(":taskId")
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const existing = await this.tasks.findById(taskId);
    if (!existing || existing.eventId !== eventId) throw new NotFoundException("Task not found");

    return this.tasks.update(taskId, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      dueDate: dto.dueDate,
      assigneeUserId: dto.assigneeUserId,
      updatedBy: user.sub,
    });
  }

  @Delete(":taskId")
  @HttpCode(204)
  async deleteTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Param("taskId") taskId: string,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const existing = await this.tasks.findById(taskId);
    if (!existing || existing.eventId !== eventId) throw new NotFoundException("Task not found");

    await this.tasks.softDelete(taskId, user.sub);
  }
}
