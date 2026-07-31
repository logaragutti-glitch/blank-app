import type { ComponentType } from "@eve-os/types";

// Mirrors apps/api/src/modules/creative/renderable-component-types.ts — the
// Capa plus the 10 narrative environments are the only component types with
// a physical scene worth generating a conceptual render for.
export const RENDERABLE_COMPONENT_TYPES = [
  "COVER",
  "ENTRANCE",
  "CEREMONY",
  "CAKE_TABLE",
  "LOUNGE",
  "GUEST_TABLES",
  "BAR",
  "BUFFET",
  "DANCE_FLOOR",
  "LIGHTING",
  "FLORALS",
] as const satisfies readonly ComponentType[];

export type RenderableComponentType = (typeof RENDERABLE_COMPONENT_TYPES)[number];

export function isRenderableComponentType(type: ComponentType): type is RenderableComponentType {
  return (RENDERABLE_COMPONENT_TYPES as readonly ComponentType[]).includes(type);
}
