import type { EventStyle } from "@eve-os/types";

/**
 * Builds the textual description of an EventStyle used to compute its
 * embedding — must stay stable/reproducible so re-running the backfill
 * for the same data yields a comparable vector.
 */
export function buildStyleEmbeddingText(style: Pick<EventStyle, "name" | "description" | "paletteColors" | "furnitureNotes" | "loungeNotes">): string {
  const parts = [
    style.name,
    style.description ?? "",
    style.paletteColors.length ? `Paleta: ${style.paletteColors.join(", ")}.` : "",
    style.furnitureNotes.length ? `Mobiliário: ${style.furnitureNotes.join(", ")}.` : "",
    style.loungeNotes.length ? `Lounge: ${style.loungeNotes.join(", ")}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
