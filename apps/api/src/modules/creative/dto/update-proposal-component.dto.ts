import { IsObject, IsNotEmptyObject } from "class-validator";

/**
 * Manual field-by-field editing (Sprint 5+ item 6): a human refinement of a
 * single already-generated component, without discarding the rest or
 * waiting for a full AI regeneration. `content` shape varies by
 * ComponentType (see ProposalComponent), so this deliberately accepts any
 * object and shallow-merges it into the component's existing content in
 * the controller — the same trust boundary as the rest of this
 * organization-scoped, authenticated API.
 */
export class UpdateProposalComponentDto {
  @IsObject()
  @IsNotEmptyObject()
  content!: Record<string, unknown>;
}
