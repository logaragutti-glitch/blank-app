import { z } from "zod";

/**
 * Contrato compartilhado entre a API (src/app/api/events) e os formulários do
 * frontend (Sprint 2). Mantém a validação de entrada em um único lugar — ver
 * docs/API_SPEC.md "Convenções transversais".
 */
export const createEventSchema = z.object({
  name: z.string().min(2).max(120),
  clientId: z.string().cuid().optional().or(z.literal("")),
  type: z.string().max(60).optional().or(z.literal("")),
  eventDate: z.coerce.date().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["DRAFT", "INTERVIEW", "GENERATING", "REVIEW", "READY", "ARCHIVED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
