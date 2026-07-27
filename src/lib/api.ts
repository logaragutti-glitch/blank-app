import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { UnauthorizedError } from "@/lib/session";
import { RateLimitError } from "@/lib/rate-limit";
import { InvalidAnswerError } from "@/modules/interview/schema";

/** Ver docs/API_SPEC.md "convenção de resposta de erro". */
export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return apiError("UNAUTHORIZED", error.message, 401);
  }
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", error.issues.map((i) => i.message).join("; "), 400);
  }
  if (error instanceof NotFoundError) {
    return apiError("NOT_FOUND", error.message, 404);
  }
  if (error instanceof ConflictError) {
    return apiError("CONFLICT", error.message, 409);
  }
  if (error instanceof ForbiddenError) {
    return apiError("FORBIDDEN", error.message, 403);
  }
  if (error instanceof InvalidAnswerError) {
    return apiError("VALIDATION_ERROR", error.message, 400);
  }
  if (error instanceof UnsupportedDocumentTypeError) {
    return apiError("VALIDATION_ERROR", error.message, 400);
  }
  if (error instanceof RateLimitError) {
    return apiError("RATE_LIMITED", error.message, 429);
  }
  console.error(error);
  return apiError("INTERNAL_ERROR", "Erro interno", 500);
}

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ForbiddenError extends Error {}
export class UnsupportedDocumentTypeError extends Error {}
