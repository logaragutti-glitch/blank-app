import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Client, ClientInteraction } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientsController } from "./clients.controller";
import { ClientInteractionTypeDto } from "./dto/create-client-interaction.dto";
import { ClientInteractionRepository } from "./repositories/client-interaction.repository";
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
  const fakeInteraction = { id: "interaction-1", clientId: "client-1", type: "CALL" } as ClientInteraction;

  let controller: ClientsController;
  let clients: jest.Mocked<ClientRepository>;
  let interactions: jest.Mocked<ClientInteractionRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientRepository, useValue: { findByOrganization: jest.fn(), findById: jest.fn() } },
        {
          provide: ClientInteractionRepository,
          useValue: { findByClient: jest.fn(), findById: jest.fn(), create: jest.fn(), softDelete: jest.fn() },
        },
      ],
    }).compile();

    controller = moduleRef.get(ClientsController);
    clients = moduleRef.get(ClientRepository);
    interactions = moduleRef.get(ClientInteractionRepository);
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

  describe("listInteractions", () => {
    it("returns the client's timeline", async () => {
      clients.findById.mockResolvedValue(fakeClient);
      interactions.findByClient.mockResolvedValue([fakeInteraction]);

      const result = await controller.listInteractions(user, "client-1");

      expect(interactions.findByClient).toHaveBeenCalledWith("client-1");
      expect(result).toEqual([fakeInteraction]);
    });

    it("throws NotFoundException when the client doesn't exist", async () => {
      clients.findById.mockResolvedValue(null);
      await expect(controller.listInteractions(user, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("logInteraction", () => {
    it("logs an interaction for the client", async () => {
      clients.findById.mockResolvedValue(fakeClient);
      interactions.create.mockResolvedValue(fakeInteraction);

      const result = await controller.logInteraction(user, "client-1", {
        type: ClientInteractionTypeDto.CALL,
        occurredAt: "2026-08-05",
        notes: "Ligou para confirmar o cardápio.",
      });

      expect(interactions.create).toHaveBeenCalledWith("tenant-1", "org-1", "client-1", {
        type: ClientInteractionTypeDto.CALL,
        occurredAt: "2026-08-05",
        notes: "Ligou para confirmar o cardápio.",
        createdBy: "user-1",
      });
      expect(result).toEqual(fakeInteraction);
    });
  });

  describe("deleteInteraction", () => {
    it("soft-deletes an interaction that belongs to the client", async () => {
      clients.findById.mockResolvedValue(fakeClient);
      interactions.findById.mockResolvedValue(fakeInteraction);

      await controller.deleteInteraction(user, "client-1", "interaction-1");

      expect(interactions.softDelete).toHaveBeenCalledWith("interaction-1", "user-1");
    });

    it("throws NotFoundException when the interaction belongs to a different client", async () => {
      clients.findById.mockResolvedValue(fakeClient);
      interactions.findById.mockResolvedValue({ ...fakeInteraction, clientId: "other-client" });

      await expect(controller.deleteInteraction(user, "client-1", "interaction-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
