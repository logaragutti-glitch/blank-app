import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Client } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientsController } from "./clients.controller";
import { ClientRepository } from "./repositories/client.repository";

describe("ClientsController", () => {
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeClient = { id: "client-1", partnerOneName: "Karen" } as Client;

  let controller: ClientsController;
  let clients: jest.Mocked<ClientRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientRepository, useValue: { findByOrganization: jest.fn(), findById: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(ClientsController);
    clients = moduleRef.get(ClientRepository);
  });

  describe("listClients", () => {
    it("returns every client in the org", async () => {
      clients.findByOrganization.mockResolvedValue([fakeClient]);
      const result = await controller.listClients(user);
      expect(clients.findByOrganization).toHaveBeenCalledWith("org-1");
      expect(result).toEqual([fakeClient]);
    });
  });

  describe("getClient", () => {
    it("returns the client when found", async () => {
      clients.findById.mockResolvedValue(fakeClient);
      const result = await controller.getClient(user, "client-1");
      expect(result).toEqual(fakeClient);
    });

    it("throws NotFoundException when the client doesn't exist", async () => {
      clients.findById.mockResolvedValue(null);
      await expect(controller.getClient(user, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
