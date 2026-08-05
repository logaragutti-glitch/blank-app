import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
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
  constructor(private readonly clients: ClientRepository) {}

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
}
