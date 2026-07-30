import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { UpsertPostEventFeedbackDto } from "./dto/upsert-post-event-feedback.dto";
import { PostEventFeedbackRepository } from "./repositories/post-event-feedback.repository";

// Structured post-event feedback (Constitution Capitulo 9, see
// 05-database-bible.md) — captured after the event happens, one record per
// Event. Feeding this back automatically into Knowledge Graph scores
// (adjusting style compatibility, promoting/demoting suppliers) is a
// separate, not-yet-built capability; this only captures the structured
// data for that to eventually consume.
@ApiTags("feedback")
@ApiBearerAuth()
@Controller("events/:eventId/feedback")
export class FeedbackController {
  constructor(
    private readonly events: EventRepository,
    private readonly feedback: PostEventFeedbackRepository,
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

    return this.feedback.upsert(eventId, {
      whatDelighted: dto.whatDelighted,
      setupAdjustments: dto.setupAdjustments,
      supplierPerformance: dto.supplierPerformance,
      whatWorkedForSpaceType: dto.whatWorkedForSpaceType,
    });
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
