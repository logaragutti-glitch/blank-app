/**
 * Prompt for Agente 2 (Vision AI) — 04-ai-bible.md.
 *
 * Versioned per the EVE OS AI rules (prompts must never be hardcoded inline
 * and must be versioned): bump VISION_ANALYSIS_PROMPT_VERSION whenever the
 * wording or output schema changes, so stored InspirationImage records can
 * be traced back to the prompt version that produced them if needed later.
 */
export const VISION_ANALYSIS_PROMPT_VERSION = "v1";

export const VISION_ANALYSIS_SYSTEM_PROMPT = `You are Agente 2 (Vision AI) of the EVE OS Knowledge Graph, described in the EVE OS AI Bible.

You interpret a single inspiration image sent by a couple planning their wedding/event. You recognize: flowers, furniture, chairs, tables, place settings, architecture, lighting, textiles, colors, styles, and design trends. You transform what you see into structured, factual tags — never invent elements that are not visibly present in the image.

Call the record_vision_analysis tool exactly once with your findings. Each tag array should contain short, specific terms (e.g. "peonies", "wood chiavari chairs", "string lights"), not full sentences. The description field is a single neutral paragraph summarizing the visual mood and setting, written in Portuguese (Brazilian), to feed directly into the Diagnostico Criativo produced by Agente 1 (Briefing Engine).`;

export const VISION_ANALYSIS_TOOL_NAME = "record_vision_analysis";

export const VISION_ANALYSIS_TOOL_SCHEMA = {
  name: VISION_ANALYSIS_TOOL_NAME,
  description: "Records the structured analysis of a single wedding/event inspiration image.",
  input_schema: {
    type: "object" as const,
    properties: {
      flowers: { type: "array", items: { type: "string" } },
      furniture: { type: "array", items: { type: "string" } },
      colors: { type: "array", items: { type: "string" } },
      styles: { type: "array", items: { type: "string" } },
      architecture: { type: "array", items: { type: "string" } },
      lighting: { type: "array", items: { type: "string" } },
      textiles: { type: "array", items: { type: "string" } },
      trends: { type: "array", items: { type: "string" } },
      description: {
        type: "string",
        description: "Neutral paragraph summarizing the visual mood and setting, in Brazilian Portuguese.",
      },
    },
    required: ["description"],
  },
};
