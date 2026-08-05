import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, User } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { UserRepository } from "../auth/repositories/user.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProjectTeamMemberRepository, type ProjectTeamMember } from "./repositories/project-team-member.repository";
import { TeamController } from "./team.controller";

describe("TeamController", () => {
  const authUser: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = { id: "event-1" } as Event;
  const orgUser = { id: "user-2", name: "Karen", email: "karen@evefestas.com" } as User;
  const assignment: ProjectTeamMember = {
    eventId: "event-1",
    userId: "user-2",
    role: "Decoradora",
    addedAt: "2026-08-05T00:00:00.000Z",
  };

  let controller: TeamController;
  let events: jest.Mocked<EventRepository>;
  let members: jest.Mocked<ProjectTeamMemberRepository>;
  let users: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn() } },
        {
          provide: ProjectTeamMemberRepository,
          useValue: { findByEvent: jest.fn(), findOne: jest.fn(), addOrUpdate: jest.fn(), remove: jest.fn() },
        },
        { provide: UserRepository, useValue: { findByOrganization: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(TeamController);
    events = moduleRef.get(EventRepository);
    members = moduleRef.get(ProjectTeamMemberRepository);
    users = moduleRef.get(UserRepository);
  });

  describe("listTeam", () => {
    it("composes each assignment with the user's name and e-mail", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      members.findByEvent.mockResolvedValue([assignment]);
      users.findByOrganization.mockResolvedValue([orgUser]);

      const result = await controller.listTeam(authUser, "event-1");

      expect(result).toEqual([{ ...assignment, name: "Karen", email: "karen@evefestas.com" }]);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.listTeam(authUser, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("addMember", () => {
    it("adds a member who belongs to the organization", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      users.findByOrganization.mockResolvedValue([orgUser]);
      members.addOrUpdate.mockResolvedValue(assignment);

      const result = await controller.addMember(authUser, "event-1", { userId: "user-2", role: "Decoradora" });

      expect(members.addOrUpdate).toHaveBeenCalledWith("event-1", { userId: "user-2", role: "Decoradora" });
      expect(result).toEqual({ ...assignment, name: "Karen", email: "karen@evefestas.com" });
    });

    it("throws BadRequestException when the user doesn't belong to the organization", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      users.findByOrganization.mockResolvedValue([]);

      await expect(
        controller.addMember(authUser, "event-1", { userId: "outsider", role: "Decoradora" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("removeMember", () => {
    it("removes an existing assignment", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      members.findOne.mockResolvedValue(assignment);

      await controller.removeMember(authUser, "event-1", "user-2");

      expect(members.remove).toHaveBeenCalledWith("event-1", "user-2");
    });

    it("throws NotFoundException when the assignment doesn't exist", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      members.findOne.mockResolvedValue(null);

      await expect(controller.removeMember(authUser, "event-1", "user-2")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
