import type { Client, Event, Supplier, Venue } from "@eve-os/types";
import { buildCommercialProposalRecord } from "./commercial-proposal-builder";

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

  it("keeps a catalog estimate marked as an estimate until a quote is confirmed", () => {
    const result = buildCommercialProposalRecord({
      tenantId: "tenant-1",
      organizationId: "org-1",
      proposalId: "proposal-1",
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
