// Not part of @eve-os/types: a lightweight membership record (event + user
// + role), not a shared domain entity with its own audit trail — same
// reasoning as VenuePreferredSupplier, which also has no shared type.
export interface ProjectTeamMember {
  eventId: string;
  userId: string;
  role: string;
  addedAt: string;
}

export interface AddTeamMemberInput {
  userId: string;
  role: string;
}

export abstract class ProjectTeamMemberRepository {
  abstract findByEvent(eventId: string): Promise<ProjectTeamMember[]>;
  abstract findOne(eventId: string, userId: string): Promise<ProjectTeamMember | null>;
  // Upsert semantics: adding someone already on the team just updates
  // their role instead of rejecting — reassigning a role shouldn't require
  // removing and re-adding the person.
  abstract addOrUpdate(eventId: string, input: AddTeamMemberInput): Promise<ProjectTeamMember>;
  abstract remove(eventId: string, userId: string): Promise<void>;
}
