import type { AiUsage } from "@/modules/ai/provider";
import type { GeneratableDocumentType } from "./schemas";

export interface GenerationResult {
  type: GeneratableDocumentType;
  status: "READY" | "FAILED";
  content?: unknown;
  error?: string;
  usage?: AiUsage;
}
