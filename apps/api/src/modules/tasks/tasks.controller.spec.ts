import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, ProjectTask } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProjectTaskRepository } from "./repositories/project-task.repository";
import { TasksController } from "./tasks.controller";

describe("TasksController", () => {
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: "event-1" } as Event;
  const fakeTask = { id: "task-1", eventId: "event-1", title: "Confirmar buffet" } as ProjectTask;

  let controller: TasksController;
  let events: jest.Mocked<EventRepository>;
  let tasks: jest.Mocked<ProjectTaskRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn() } },
        {
          provide: ProjectTaskRepository,
          useValue: {
            findByEvent: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(TasksController);
    events = moduleRef.get(EventRepository);
    tasks = moduleRef.get(ProjectTaskRepository);
  });

  describe("listTasks", () => {
    it("returns the event's tasks", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.findByEvent.mockResolvedValue([fakeTask]);

      const result = await controller.listTasks(user, "event-1");

      expect(events.findById).toHaveBeenCalledWith("org-1", "event-1");
      expect(tasks.findByEvent).toHaveBeenCalledWith("event-1");
      expect(result).toEqual([fakeTask]);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.listTasks(user, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("createTask", () => {
    it("creates a task under the event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.create.mockResolvedValue(fakeTask);

      const result = await controller.createTask(user, "event-1", { title: "Confirmar buffet" });

      expect(tasks.create).toHaveBeenCalledWith("tenant-1", "org-1", "event-1", {
        title: "Confirmar buffet",
        description: undefined,
        dueDate: undefined,
        assigneeUserId: undefined,
        createdBy: "user-1",
      });
      expect(result).toEqual(fakeTask);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.createTask(user, "missing", { title: "x" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("updateTask", () => {
    it("updates a task that belongs to the event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.findById.mockResolvedValue(fakeTask);
      tasks.update.mockResolvedValue({ ...fakeTask, status: "DONE" });

      const result = await controller.updateTask(user, "event-1", "task-1", { status: "DONE" as never });

      expect(tasks.update).toHaveBeenCalledWith("task-1", {
        title: undefined,
        description: undefined,
        status: "DONE",
        dueDate: undefined,
        assigneeUserId: undefined,
        updatedBy: "user-1",
      });
      expect(result.status).toBe("DONE");
    });

    it("throws NotFoundException when the task belongs to a different event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.findById.mockResolvedValue({ ...fakeTask, eventId: "other-event" });

      await expect(controller.updateTask(user, "event-1", "task-1", {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("deleteTask", () => {
    it("soft-deletes a task that belongs to the event", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.findById.mockResolvedValue(fakeTask);

      await controller.deleteTask(user, "event-1", "task-1");

      expect(tasks.softDelete).toHaveBeenCalledWith("task-1", "user-1");
    });

    it("throws NotFoundException when the task doesn't exist", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      tasks.findById.mockResolvedValue(null);

      await expect(controller.deleteTask(user, "event-1", "missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
