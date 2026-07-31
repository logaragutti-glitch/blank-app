import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { SupplierPerformanceEntryDto, UpsertPostEventFeedbackDto } from "./dto/upsert-post-event-feedback.dto";
import { PostEventFeedbackRepository } from "./repositories/post-event-feedback.repository";
import { buildPerformanceNote, decideSupplierPreference } from "./supplier-reconciliation";

// Structured post-event feedback (Constitution Capitulo 9, see
// 05-database-bible.md) — captured after the event happens, one record per
// Event. The supplierPerformance entries feed back into the Knowledge
// Graph automatically (promoting/demoting the supplier at this event's
// venue, appending a note to its performance history) — see
// supplier-reconciliation.ts. The other feedback fields are free text and
// aren't fed back automatically, since doing so would require an AI to
// interpret them, risking a fabricated signal.
@ApiTags("feedback")
@ApiBearerAuth()
@Controller("events/:eventId/feedback")
export class FeedbackController {
  constructor(
    private readonly events: EventRepository,
    private readonly feedback: PostEventFeedbackRepository,
    private readonly suppliers: SupplierRepository,
  ) {}

  // Upsert semantics: feedback is often captured incrementally (supplier
  // notes right after teardown, the couple's reaction a few days later),
  // so calling this again updates the same record instead of rejecting.
  @Post()
  async upsertFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: UpsertPostEventFeedbackDto,
  ) {
    const event = await this.events.findById(user.organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const feedback = await this.feedback.upsert(eventId, {
      whatDelighted: dto.whatDelighted,
      setupAdjustments: dto.setupAdjustments,
      supplierPerformance: dto.supplierPerformance,
      whatWorkedForSpaceType: dto.whatWorkedForSpaceType,
    });

    if (dto.supplierPerformance) {
      await this.reconcileSupplierPerformance(
        user.organizationId,
        event.venueId,
        eventId,
        dto.supplierPerformance,
      );
    }

    return feedback;
  }

  // Deterministic, not AI-driven: a rating of 4-5 promotes the supplier to
  // preferred at this venue, 1-2 demotes it, 3 leaves the preference as-is.
  // Unknown supplier ids (not in this organization's Knowledge Graph) are
  // skipped — there's nothing real to reconcile against.
  private async reconcileSupplierPerformance(
    organizationId: string,
    venueId: string,
    eventId: string,
    entries: SupplierPerformanceEntryDto[],
  ) {
    const recordedAt = new Date();
    for (const entry of entries) {
      const supplier = await this.suppliers.findById(organizationId, entry.supplierId);
      if (!supplier) continue;

      const decision = decideSupplierPreference(entry.rating);
      if (decision !== "no-change") {
        await this.suppliers.setVenuePreference(venueId, entry.supplierId, decision === "promote");
      }
      await this.suppliers.appendPerformanceNote(
        entry.supplierId,
        buildPerformanceNote(eventId, entry.rating, entry.notes, recordedAt),
      );
    }
  }

  @Get()
  async getFeedback(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    const event = await this.events.findById(user.organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const feedback = await this.feedback.findByEvent(eventId);
    if (!feedback) throw new NotFoundException("No feedback recorded for this event yet");
    return feedback;
  }
}
