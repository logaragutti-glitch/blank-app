import type { ComponentType } from "@eve-os/types";

// The Capa plus the 10 narrative environments (Constitution Capitulo 7) are
// the only component types with a physical scene worth rendering an image
// of — narrative-only components (Conceito, Historia da Bia...) and
// data-only components (Paleta, Cronograma, Investimento...) are not.
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
] as const;

export type RenderableComponentType = (typeof RENDERABLE_COMPONENT_TYPES)[number];

export function isRenderableComponentType(value: string): value is RenderableComponentType {
  return (RENDERABLE_COMPONENT_TYPES as readonly string[]).includes(value);
}

// Narrows ComponentType down to the renderable subset at the type level too,
// so anywhere a RenderableComponentType is required, a ComponentType alone
// isn't accepted without a runtime check first.
export type _AssertSubsetOfComponentType = RenderableComponentType extends ComponentType ? true : never;
