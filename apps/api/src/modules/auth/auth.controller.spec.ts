import { Test } from "@nestjs/testing";
import type { User } from "@eve-os/types";
import type { AuthenticatedUser } from "./jwt-payload";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserRepository } from "./repositories/user.repository";

describe("AuthController", () => {
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeMember = { id: "user-2", name: "Karen", email: "karen@evefestas.com" } as User;

  let controller: AuthController;
  let users: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: UserRepository, useValue: { findByOrganization: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
    users = moduleRef.get(UserRepository);
  });

  describe("listMembers", () => {
    it("returns every member of the caller's organization", async () => {
      users.findByOrganization.mockResolvedValue([fakeMember]);
      const result = await controller.listMembers(user);
      expect(users.findByOrganization).toHaveBeenCalledWith("org-1");
      expect(result).toEqual([fakeMember]);
    });
  });
});
