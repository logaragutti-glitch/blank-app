import type { VisionTags } from "@eve-os/types";

export interface AnalyzeImageInput {
  base64: string;
  mimeType: string;
}

export interface VisionAnalysisResult {
  tags: VisionTags;
  description: string;
  /** Prompt version that produced this result, for traceability. */
  promptVersion: string;
}

/** Port for Agente 2 / Vision AI (04-ai-bible.md). */
export abstract class VisionAnalysisPort {
  abstract analyze(input: AnalyzeImageInput): Promise<VisionAnalysisResult>;
}
