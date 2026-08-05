import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { CreateClientInteractionDto } from "./dto/create-client-interaction.dto";
import { ClientInteractionRepository } from "./repositories/client-interaction.repository";
import { ClientRepository } from "./repositories/client.repository";

// A CRM-flavored view of the same Client records the briefing wizard
// creates (Sprint work per docs/08-roadmap.md's "Clientes" module). The
// event history for a given client is deliberately NOT duplicated here —
// GET /projects already returns clientId per event (see ProjectsController),
// so the web "Clientes" detail screen filters that list client-side instead
// of this controller re-composing the same join.
@ApiTags("clients")
@ApiBearerAuth()
@Controller("clients")
export class ClientsController {
  constructor(
    private readonly clients: ClientRepository,
    private readonly interactions: ClientInteractionRepository,
  ) {}

  @Get()
  async listClients(@CurrentUser() user: AuthenticatedUser) {
    return this.clients.findByOrganization(user.organizationId);
  }

  @Get(":id")
  async getClient(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const client = await this.clients.findById(user.organizationId, id);
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  private async requireClient(organizationId: string, clientId: string) {
    const client = await this.clients.findById(organizationId, clientId);
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  // Timeline de Interações (Bucket C) — real contact history with the
  // couple, separate from the one-time briefing snapshot.
  @Get(":clientId/interactions")
  async listInteractions(@CurrentUser() user: AuthenticatedUser, @Param("clientId") clientId: string) {
    await this.requireClient(user.organizationId, clientId);
    return this.interactions.findByClient(clientId);
  }

  @Post(":clientId/interactions")
  async logInteraction(
    @CurrentUser() user: AuthenticatedUser,
    @Param("clientId") clientId: string,
    @Body() dto: CreateClientInteractionDto,
  ) {
    await this.requireClient(user.organizationId, clientId);
    return this.interactions.create(user.tenantId, user.organizationId, clientId, {
      type: dto.type,
      occurredAt: dto.occurredAt,
      notes: dto.notes,
      createdBy: user.sub,
    });
  }

  @Delete(":clientId/interactions/:interactionId")
  @HttpCode(204)
  async deleteInteraction(
    @CurrentUser() user: AuthenticatedUser,
    @Param("clientId") clientId: string,
    @Param("interactionId") interactionId: string,
  ) {
    await this.requireClient(user.organizationId, clientId);
    const existing = await this.interactions.findById(interactionId);
    if (!existing || existing.clientId !== clientId) throw new NotFoundException("Interaction not found");

    await this.interactions.softDelete(interactionId, user.sub);
  }
}
