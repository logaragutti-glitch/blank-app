import type {
  Client,
  CommercialLineItem,
  CommercialLogisticsItem,
  CommercialLogisticsTreatment,
  CommercialPackage,
  CommercialProposalScope,
  CommercialPaymentTerm,
  CommercialProposalSupplierInput,
  CommercialSupplierCategory,
  CommercialSupplierSelection,
  CommercialVenueSnapshot,
  Event,
  Supplier,
  Venue,
} from "@eve-os/types";
import type { ProjectSupplier } from "../project-suppliers/repositories/project-supplier.repository";
import type { CommercialEventSnapshot, UpsertCommercialProposalRecordInput } from "./repositories/commercial-proposal.repository";
import type { CommercialLineItemDto, UpsertCommercialProposalDto } from "./dto/upsert-commercial-proposal.dto";

export interface ResearchedVenueRecord {
  id: string;
  name: string;
  municipality: string;
  venueType: string;
  evidenceLevel: string;
  status: string;
  capacityMin: number | null;
  capacityMax: number | null;
  lodgingCapacity: number | null;
  priceNote: string | null;
  services: string[];
  sourceUrls: string[];
  contact: string | null;
  notes: string | null;
}

const CATEGORY_LABELS: Record<CommercialSupplierCategory, string> = {
  VENUE: "Espaço de evento",
  CATERING: "Buffet e gastronomia",
  DECOR: "Decoração e ambientação",
  FURNITURE_RENTAL: "Mobiliário e locação",
  PHOTOGRAPHY: "Fotografia e filmagem",
  MUSIC: "Música e DJ",
  LIGHTING: "Som, iluminação e estrutura",
  ASSEMBLY_CREW: "Montagem e desmontagem",
  OTHER: "Serviços complementares",
};

const DEFAULT_SCOPE: Record<CommercialSupplierCategory, string> = {
  VENUE: "Uso do espaço conforme disponibilidade e regras do local.",
  CATERING: "Serviço de buffet e gastronomia conforme cardápio a aprovar.",
  DECOR: "Projeto decorativo, ambientação e montagem conforme briefing.",
  FURNITURE_RENTAL: "Locação, entrega, montagem e retirada dos itens selecionados.",
  PHOTOGRAPHY: "Cobertura de foto e/ou filme conforme pacote a contratar.",
  MUSIC: "DJ, repertório, sonorização e operação musical conforme rider.",
  LIGHTING: "Sonorização, iluminação e estruturas técnicas conforme necessidade do evento.",
  ASSEMBLY_CREW: "Equipe de montagem, desmontagem e apoio operacional.",
  OTHER: "Serviço complementar a detalhar no orçamento e contrato.",
};

function isConfirmedContact(status: string): boolean {
  return status.startsWith("CONFIRMED");
}

const SUPPLIER_CATEGORY_MAP: Record<Supplier["category"], CommercialSupplierCategory> = {
  FLORIST: "DECOR",
  CATERING: "CATERING",
  LIGHTING: "LIGHTING",
  FURNITURE_RENTAL: "FURNITURE_RENTAL",
  PHOTOGRAPHY: "PHOTOGRAPHY",
  MUSIC: "MUSIC",
  ASSEMBLY_CREW: "ASSEMBLY_CREW",
  OTHER: "DECOR",
};

export const DECORATION_ALLOWED_CATEGORIES: ReadonlySet<CommercialSupplierCategory> = new Set([
  "DECOR",
  "FURNITURE_RENTAL",
  "LIGHTING",
  "ASSEMBLY_CREW",
]);

export function commercialSupplierCategoryFor(category: Supplier["category"]): CommercialSupplierCategory {
  return SUPPLIER_CATEGORY_MAP[category];
}

export function isCommercialCategoryAllowed(
  scope: CommercialProposalScope,
  category: CommercialSupplierCategory,
): boolean {
  return scope === "FULL_EVENT" || DECORATION_ALLOWED_CATEGORIES.has(category);
}

const DEFAULT_PAYMENT_TERMS: CommercialPaymentTerm[] = [
  {
    label: "Reserva e início do planejamento",
    description: "30% na aprovação e assinatura do contrato.",
    amount: null,
    due: "Na assinatura",
  },
  {
    label: "Produção e contratações",
    description: "40% até 30 dias antes do evento.",
    amount: null,
    due: "Até 30 dias antes",
  },
  {
    label: "Saldo final",
    description: "30% até 7 dias antes do evento.",
    amount: null,
    due: "Até 7 dias antes",
  },
];

const DEFAULT_CONDITIONS = [
  "Valores apresentados são estimativas ou propostas preliminares e dependem de disponibilidade, escopo final e contrato próprio de cada fornecedor.",
  "Itens com contato não confirmado, preço estimado ou cotação pendente devem ser validados antes da aprovação final.",
  "Deslocamentos, hospedagens, taxas do espaço, gerador, licenças, hora extra e alterações de escopo serão confirmados em orçamento específico.",
  "A reserva do espaço e dos fornecedores somente ocorre após aprovação, assinatura e pagamento conforme os contratos aplicáveis.",
];

const DEFAULT_NEXT_STEPS = [
  "Confirmar o espaço e a data desejada.",
  "Validar o escopo de cada fornecedor e solicitar as cotações finais.",
  "Aprovar a composição comercial e ajustar os itens opcionais.",
  "Formalizar contratos, pagamentos e cronograma de produção.",
];

const DECORATION_CONDITIONS = [
  "Este orçamento contempla exclusivamente ambientação decorativa: flores e folhagens, móveis e locações, iluminação decorativa, objetos, tecidos, mesa posta, estruturas decorativas e montagem.",
  "Não estão incluídos buffet, bebidas, fotografia, filmagem, DJ, sonorização técnica ou outros serviços não decorativos, salvo quando descritos expressamente como item de ambientação.",
  ...DEFAULT_CONDITIONS.slice(1),
];

const DECORATION_NEXT_STEPS = [
  "Confirmar o espaço, a data e as áreas que receberão ambientação.",
  "Validar referências, paleta, flores, móveis, iluminação decorativa e itens de mesa.",
  "Solicitar a cotação final de montagem, desmontagem, logística e eventuais substituições.",
  "Aprovar o escopo decorativo e formalizar o contrato específico de decoração.",
];

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function eventSnapshot(client: Client, event: Event): CommercialEventSnapshot {
  return {
    clientNames: [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & "),
    eventType: event.type,
    eventDate: event.ceremonyDateTime,
    guestsExpected: event.guestsExpected,
  };
}

function venueSnapshot(venue: Venue, researchedVenue?: ResearchedVenueRecord | null): CommercialVenueSnapshot {
  if (researchedVenue) {
    return {
      id: researchedVenue.id,
      source: "RESEARCH_CATALOG",
      name: researchedVenue.name,
      municipality: researchedVenue.municipality,
      venueType: researchedVenue.venueType,
      capacityMin: researchedVenue.capacityMin,
      capacityMax: researchedVenue.capacityMax,
      guestCapacity: venue.guestCapacity,
      lodgingCapacity: researchedVenue.lodgingCapacity,
      contact: researchedVenue.contact,
      services: researchedVenue.services,
      recommendationNotes: researchedVenue.notes ? [researchedVenue.notes] : [],
      status: researchedVenue.status,
      evidenceLevel: researchedVenue.evidenceLevel,
      sourceUrls: researchedVenue.sourceUrls,
    };
  }

  return {
    id: venue.id,
    source: "INTERNAL_VENUE",
    name: venue.name,
    municipality: null,
    venueType: null,
    capacityMin: null,
    capacityMax: null,
    guestCapacity: venue.guestCapacity,
    lodgingCapacity: null,
    contact: null,
    services: [],
    recommendationNotes: venue.recommendationNotes,
    status: "INTERNAL_CATALOG",
    evidenceLevel: null,
    sourceUrls: [],
  };
}

function buildSupplierSelection(
  supplier: Supplier,
  assignment: ProjectSupplier | undefined,
  input: CommercialProposalSupplierInput | undefined,
): CommercialSupplierSelection {
  const category = commercialSupplierCategoryFor(supplier.category);
  return {
    supplierId: supplier.id,
    name: supplier.name,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    phone: supplier.phone,
    email: supplier.email,
    website: supplier.website,
    instagramUrl: supplier.instagramUrl,
    serviceArea: supplier.serviceArea,
    validationLevel: supplier.validationLevel,
    contactStatus: supplier.contactStatus,
    estimatedCost: supplier.estimatedCost,
    assignmentStatus: assignment?.status ?? null,
    notes: input?.notes ?? assignment?.notes ?? supplier.performanceNotes,
    scope: input?.scope?.trim() || DEFAULT_SCOPE[category],
    pricingStatus: input?.pricingStatus ?? (supplier.estimatedCost == null ? "QUOTE_PENDING" : "ESTIMATE"),
  };
}

function lineItemsFromSuppliers(
  suppliers: CommercialSupplierSelection[],
  inputs: Map<string, CommercialProposalSupplierInput>,
  guestsExpected: number | null,
): CommercialLineItem[] {
  return suppliers.map((supplier, index) => {
    const input = inputs.get(supplier.supplierId);
    const quantity = input?.quantity ?? 1;
    const unit = input?.unit ?? "serviço";
    const unitPrice = input?.unitPrice ?? supplier.estimatedCost ?? 0;
    return {
      id: `supplier-${supplier.supplierId}-${index}`,
      kind: "SUPPLIER",
      category: supplier.category,
      categoryLabel: supplier.categoryLabel,
      description: supplier.scope,
      supplierId: supplier.supplierId,
      supplierName: supplier.name,
      quantity,
      unit,
      unitPrice: roundMoney(unitPrice),
      total: roundMoney(quantity * unitPrice),
      pricingStatus: input?.pricingStatus ?? supplier.pricingStatus,
      included: true,
      notes: guestsExpected ? `Dimensionado para aproximadamente ${guestsExpected} convidados.` : null,
    };
  });
}

function buildLineItems(
  suppliers: CommercialSupplierSelection[],
  supplierInputs: Map<string, CommercialProposalSupplierInput>,
  customItems: CommercialLineItemDto[] | undefined,
  guestsExpected: number | null,
): CommercialLineItem[] {
  const baseItems = lineItemsFromSuppliers(suppliers, supplierInputs, guestsExpected);
  const additions = (customItems ?? []).map((item, index) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? 0;
    const supplier = suppliers.find((selection) => selection.supplierId === item.supplierId);
    const category = item.category;
    return {
      id: item.id ?? `custom-${index + 1}`,
      kind: item.kind ?? "CUSTOM",
      category,
      categoryLabel: CATEGORY_LABELS[category],
      description: item.description,
      supplierId: item.supplierId ?? null,
      supplierName: supplier?.name ?? null,
      quantity,
      unit: item.unit ?? "serviço",
      unitPrice: roundMoney(unitPrice),
      total: roundMoney(quantity * unitPrice),
      pricingStatus: item.pricingStatus ?? "QUOTE_PENDING",
      included: item.included ?? true,
      notes: item.notes ?? null,
    };
  });
  return [...baseItems, ...additions];
}

function buildPackages(input: UpsertCommercialProposalDto["packages"]): CommercialPackage[] {
  return (input ?? []).map((item, index) => ({
    id: item.id ?? `package-${item.tier.toLowerCase()}-${index + 1}`,
    tier: item.tier,
    name: item.name.trim(),
    description: item.description.trim(),
    totalInvestment: roundMoney(item.totalInvestment),
    pricingStatus: item.pricingStatus ?? "ESTIMATE",
    selected: item.selected ?? item.tier === "RECOMMENDED",
  }));
}

function buildLogisticsItems(
  inputs: UpsertCommercialProposalDto["logisticsItems"],
  suppliers: CommercialSupplierSelection[],
): CommercialLogisticsItem[] {
  return (inputs ?? []).map((item, index) => {
    const treatment: CommercialLogisticsTreatment = item.treatment ?? "ADDITIONAL";
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? 0;
    const supplier = item.supplierId ? suppliers.find((selection) => selection.supplierId === item.supplierId) : undefined;
    const isBillable = treatment === "ADDITIONAL";
    return {
      id: item.id ?? `logistics-${index + 1}`,
      supplierId: item.supplierId ?? null,
      supplierName: supplier?.name ?? null,
      label: item.label,
      treatment,
      quantity,
      unit: item.unit ?? "serviço",
      unitPrice: roundMoney(isBillable ? unitPrice : 0),
      total: roundMoney(isBillable ? quantity * unitPrice : 0),
      pricingStatus: isBillable ? item.pricingStatus ?? "QUOTE_PENDING" : "CONFIRMED",
      notes: item.notes ?? null,
    };
  });
}

function defaultPaymentTerms(totalInvestment: number): CommercialPaymentTerm[] {
  const percentages = [0.3, 0.4, 0.3] as const;
  return DEFAULT_PAYMENT_TERMS.map((term, index) => ({
    ...term,
    amount: roundMoney(totalInvestment * (percentages[index] ?? 0)),
  }));
}

export function buildCommercialProposalRecord(input: {
  tenantId: string;
  organizationId: string;
  proposalId: string;
  createdBy: string | null;
  event: Event;
  client: Client;
  venue: Venue;
  researchedVenue?: ResearchedVenueRecord | null;
  suppliers: Supplier[];
  assignments: ProjectSupplier[];
  dto: UpsertCommercialProposalDto;
}): UpsertCommercialProposalRecordInput {
  const assignmentBySupplierId = new Map(input.assignments.map((assignment) => [assignment.supplierId, assignment]));
  const selectionInputBySupplierId = new Map(
    input.dto.supplierSelections.map((selection) => [selection.supplierId, selection]),
  );
  const scope = input.dto.scope ?? "FULL_EVENT";
  const selectedSuppliers = input.suppliers.filter((supplier) => selectionInputBySupplierId.has(supplier.id));
  const selections = selectedSuppliers.map((supplier) =>
    buildSupplierSelection(supplier, assignmentBySupplierId.get(supplier.id), selectionInputBySupplierId.get(supplier.id)),
  );
  const lineItems = buildLineItems(
    selections,
    selectionInputBySupplierId,
    input.dto.lineItems,
    input.event.guestsExpected,
  );
    const logisticsItems = buildLogisticsItems(input.dto.logisticsItems, selections);
  const packages = buildPackages(input.dto.packages);
  const subtotal = roundMoney(

    lineItems.filter((item) => item.included).reduce((sum, item) => sum + item.total, 0) +
      logisticsItems.reduce((sum, item) => sum + item.total, 0),
  );
  const contingencyAmount = roundMoney(subtotal * ((input.dto.contingencyPercent ?? 0) / 100));
  const managementFee = roundMoney(input.dto.managementFee ?? 0);
  const discount = roundMoney(input.dto.discount ?? 0);
  const totalInvestment = roundMoney(Math.max(0, subtotal + contingencyAmount + managementFee - discount));
  const internalCost = input.dto.internalCost == null ? null : roundMoney(input.dto.internalCost);
  const marginAmount = internalCost == null ? null : roundMoney(totalInvestment - internalCost);
  const marginPercent = internalCost == null || marginAmount == null || totalInvestment === 0 ? null : roundMoney((marginAmount / totalInvestment) * 100);
  const validityDays = input.dto.validityDays ?? 10;
  const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  const paymentTerms = input.dto.paymentTerms?.map((term) => ({
    label: term.label,
    description: term.description,
    amount: term.amount ?? null,
    due: term.due ?? null,
  })) ?? defaultPaymentTerms(totalInvestment);
  const hasUnconfirmedData =
    Boolean(input.researchedVenue && input.researchedVenue.status !== "VALIDATED") ||
    selections.some(
      (supplier) => !isConfirmedContact(supplier.contactStatus) || supplier.pricingStatus !== "CONFIRMED",
    ) ||
    lineItems.some((item) => item.pricingStatus !== "CONFIRMED") ||
    logisticsItems.some((item) => item.treatment === "ADDITIONAL" && item.pricingStatus !== "CONFIRMED");

  return {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    eventId: input.event.id,
    createdBy: input.createdBy,
    eventSnapshot: eventSnapshot(input.client, input.event),
    venueSnapshot: venueSnapshot(input.venue, input.researchedVenue),
    supplierSelections: selections,
    lineItems,
    logisticsItems,
    packages,
    subtotal,
    contingencyAmount,
    managementFee,
    discount,
    internalCost,
    marginAmount,
    marginPercent,
    totalInvestment,
    validityDays,
    validUntil,
    approvalDeadline: input.dto.approvalDeadline ? new Date(input.dto.approvalDeadline) : null,
    paymentTerms,
    scope,
    conditions: input.dto.conditions?.length
      ? input.dto.conditions
      : scope === "DECORATION_ONLY"
        ? DECORATION_CONDITIONS
        : DEFAULT_CONDITIONS,
    nextSteps: input.dto.nextSteps?.length
      ? input.dto.nextSteps
      : scope === "DECORATION_ONLY"
        ? DECORATION_NEXT_STEPS
        : DEFAULT_NEXT_STEPS,
    commercialNotes: input.dto.commercialNotes ?? null,
    hasUnconfirmedData,
  };
}

export { CATEGORY_LABELS };
