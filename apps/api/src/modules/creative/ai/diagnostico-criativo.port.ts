import type { DiagnosticoCriativo, VisionTags } from "@eve-os/types";

export interface DiagnosticoCriativoClientContext {
  partnerOneName: string;
  partnerTwoName: string | null;
  lifestyleTags: string[];
  hobbies: string[];
  howTheyMet: string | null;
  likesBeach: boolean | null;
  likesCountryside: boolean | null;
  budgetAmount: number | null;
  budgetCurrency: string;
  dietaryRestrictions: string[];
}

export interface DiagnosticoCriativoEventContext {
  type: string;
  guestsExpected: number | null;
  ceremonyDateTime: string | null;
  budgetAmount: number | null;
}

export interface DiagnosticoCriativoVenueContext {
  name: string;
  recommendationNotes: string[];
  typicalClimate: string | null;
  structuralConstraints: string | null;
}

export interface DiagnosticoCriativoInspirationImage {
  visionTags: VisionTags | null;
  visionDescription: string | null;
}

export interface DiagnosticoCriativoCandidateStyle {
  id: string;
  name: string;
  dimensionScores: Record<string, number>;
  paletteColors: string[];
  furnitureNotes: string[];
  loungeNotes: string[];
}

export interface DiagnosticoCriativoCatalogMaterial {
  name: string;
  category: string;
  emotions: string[];
  neverRecommend: boolean;
  compatibleStyleNames: string[];
}

export interface DiagnosticoCriativoInput {
  client: DiagnosticoCriativoClientContext;
  event: DiagnosticoCriativoEventContext;
  venue: DiagnosticoCriativoVenueContext;
  inspirationImages: DiagnosticoCriativoInspirationImage[];
  candidateStyles: DiagnosticoCriativoCandidateStyle[];
  catalogMaterials: DiagnosticoCriativoCatalogMaterial[];
}

export interface DiagnosticoCriativoResult {
  diagnosis: DiagnosticoCriativo;
  /** The candidateStyles.id Claude matched as estilo predominante, if any. */
  matchedEventStyleId: string | null;
}

/** Port for Agente 1 / Motor de Interpretacao (04-ai-bible.md). */
export abstract class DiagnosticoCriativoPort {
  abstract generate(input: DiagnosticoCriativoInput): Promise<DiagnosticoCriativoResult>;
}
