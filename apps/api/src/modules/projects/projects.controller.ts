import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";

// A read model assembled specifically for the Home screen and project
// navigation ("Novo Projeto" onwards) — no single existing repository
// exposes "all events for an organization, with the context a list/summary
// screen needs" (03-product-spec.md), so this composes across the
// Briefing/Knowledge Graph/Creative repositories instead of adding
// list-everything methods to each of them.
@ApiTags("projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly events: EventRepository,
    private readonly clients: ClientRepository,
    private readonly venues: VenueRepository,
    private readonly proposals: ProposalRepository,
  ) {}

  @Get()
  async listProjects(@CurrentUser() user: AuthenticatedUser) {
    const { organizationId } = user;
    const events = await this.events.findAll(organizationId);

    return Promise.all(
      events.map(async (event) => {
        const [client, venue, eventProposals] = await Promise.all([
          this.clients.findById(organizationId, event.clientId),
          this.venues.findById(organizationId, event.venueId),
          this.proposals.findByEvent(organizationId, event.id),
        ]);
        const latestProposal = eventProposals[0] ?? null;

        return {
          eventId: event.id,
          clientNames: client
            ? [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ")
            : "Cliente não encontrado",
          venueName: venue?.name ?? null,
          type: event.type,
          status: event.status,
          guestsExpected: event.guestsExpected,
          ceremonyDateTime: event.ceremonyDateTime,
          createdAt: event.createdAt,
          latestProposal: latestProposal
            ? {
                id: latestProposal.id,
                status: latestProposal.status,
                conceptName: latestProposal.conceptName,
                wowScore: latestProposal.wowScore,
              }
            : null,
        };
      }),
    );
  }
}
