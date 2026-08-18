import type { Client, Event, Supplier, Venue } from "@eve-os/types";
import {
  buildCommercialProposalRecord,
  isCommercialCategoryAllowed,
} from "./commercial-proposal-builder";

const client = {
  partnerOneName: "Ana",
  partnerTwoName: "Bruno",
} as Client;

const event = {
  id: "event-1",
  type: "WEDDING",
  guestsExpected: 120,
  ceremonyDateTime: "2026-11-21T18:00:00.000Z",
} as Event;

const venue = {
  id: "venue-1",
  name: "Casarão da Casa da Árvore",
  guestCapacity: 400,
  recommendationNotes: ["Aproveitar o jardim"],
} as Venue;

const suppliers = [
  {
    id: "supplier-catering",
    name: "Passalini Buffet",
    category: "CATERING",
    phone: "(22) 99874-1384",
    email: null,
    website: null,
    instagramUrl: null,
    serviceArea: ["Cabo Frio", "Região dos Lagos"],
    sourceUrl: null,
    validationLevel: "A",
    contactStatus: "CONFIRMED_OFFICIAL",
    performanceNotes: null,
    preferredVenueIds: [],
    estimatedCost: 10000,
    photoKeys: [],
  },
  {
    id: "supplier-lighting",
    name: "Ricos Eventos",
    category: "LIGHTING",
    phone: null,
    email: null,
    website: null,
    instagramUrl: null,
    serviceArea: ["Cabo Frio"],
    sourceUrl: null,
    validationLevel: "A",
    contactStatus: "CONFIRMED_PUBLIC",
    performanceNotes: null,
    preferredVenueIds: [],
    estimatedCost: 5000,
    photoKeys: [],
  },
] as unknown as Supplier[];

describe("buildCommercialProposalRecord", () => {
  it("composes suppliers, custom items and commercial totals", () => {
    const result = buildCommercialProposalRecord({
      tenantId: "tenant-1",
      organizationId: "org-1",
      proposalId: "proposal-1",
      createdBy: null,
      event,
      client,
      venue,
      suppliers,
      assignments: [],
      dto: {
        supplierSelections: [
          { supplierId: "supplier-catering", pricingStatus: "CONFIRMED" },
          { supplierId: "supplier-lighting", pricingStatus: "CONFIRMED" },
        ],
        lineItems: [
          {
            category: "DECOR",
            description: "Projeto floral complementar",
            unitPrice: 1000,
            pricingStatus: "QUOTE_PENDING",
          },
        ],
        contingencyPercent: 10,
        managementFee: 500,
        discount: 100,
        validityDays: 15,
      },
    });

    expect(result.supplierSelections).toHaveLength(2);
    expect(result.lineItems).toHaveLength(3);
    expect(result.subtotal).toBe(16000);
    expect(result.contingencyAmount).toBe(1600);
    expect(result.totalInvestment).toBe(18000);
    expect(result.validityDays).toBe(15);
    expect(result.hasUnconfirmedData).toBe(true);
    expect(result.paymentTerms[0]?.amount).toBe(5400);
  });

  it("supports a decoration-only budget with decoration-specific conditions", () => {
    const result = buildCommercialProposalRecord({
      tenantId: "tenant-1",
      organizationId: "org-1",
      proposalId: "proposal-decoration-1",
      createdBy: null,
      event,
      client,
      venue,
      suppliers: [suppliers[1]!],
      assignments: [],
      dto: {
        scope: "DECORATION_ONLY",
        supplierSelections: [{ supplierId: "supplier-lighting", pricingStatus: "QUOTE_PENDING" }],
        lineItems: [
          {
            category: "DECOR",
            description: "Flores e ambientação das mesas",
            unitPrice: 2500,
            pricingStatus: "QUOTE_PENDING",
          },
        ],
      },
    });

    expect(result.scope).toBe("DECORATION_ONLY");
    expect(result.subtotal).toBe(7500);
    expect(result.conditions[0]).toContain("ambientação decorativa");
    expect(result.conditions[1]).toContain("Não estão incluídos buffet");
    expect(result.nextSteps[3]).toContain("decoração");
  });

  it("allows decoration categories only in decoration scope", () => {
    expect(isCommercialCategoryAllowed("DECORATION_ONLY", "LIGHTING")).toBe(true);
    expect(isCommercialCategoryAllowed("DECORATION_ONLY", "FURNITURE_RENTAL")).toBe(true);
    expect(isCommercialCategoryAllowed("DECORATION_ONLY", "CATERING")).toBe(false);
    expect(isCommercialCategoryAllowed("FULL_EVENT", "CATERING")).toBe(true);
  });

  it("adds additional logistics and does not double-charge included transport", () => {
    const result = buildCommercialProposalRecord({
      tenantId: "tenant-1",
      organizationId: "org-1",
      proposalId: "proposal-logistics-1",
      createdBy: null,
      event,
      client,
      venue,
      suppliers: [suppliers[1]!],
      assignments: [],
      dto: {
        supplierSelections: [{ supplierId: "supplier-lighting", pricingStatus: "CONFIRMED" }],
        logisticsItems: [
          {
            supplierId: "supplier-lighting",
            label: "Transporte de equipamentos",
            treatment: "ADDITIONAL",
            quantity: 2,
            unit: "viagem",
            unitPrice: 500,
            pricingStatus: "QUOTE_PENDING",
          },
          {
            supplierId: "supplier-lighting",
            label: "Montagem já incluída na cotação",
            treatment: "INCLUDED",
            quantity: 1,
            unit: "serviço",
            unitPrice: 2000,
            pricingStatus: "CONFIRMED",
          },
        ],
      },
    });

    expect(result.logisticsItems).toHaveLength(2);
    expect(result.logisticsItems[0]?.total).toBe(1000);
    expect(result.logisticsItems[1]?.total).toBe(0);
    expect(result.subtotal).toBe(6000);
    expect(result.hasUnconfirmedData).toBe(true);
  });

  it("keeps a catalog estimate marked as an estimate until a quote is confirmed", () => {
    const result = buildCommercialProposalRecord({
      tenantId: "tenant-1",
      organizationId: "org-1",
      proposalId: "proposal-1",
      createdBy: null,
      event,
      client,
      venue,
      suppliers: [suppliers[0]!],
      assignments: [],
      dto: { supplierSelections: [{ supplierId: suppliers[0]!.id }] },
    });

    expect(result.lineItems[0]?.unitPrice).toBe(10000);
    expect(result.lineItems[0]?.pricingStatus).toBe("ESTIMATE");
    expect(result.hasUnconfirmedData).toBe(true);
  });
});
