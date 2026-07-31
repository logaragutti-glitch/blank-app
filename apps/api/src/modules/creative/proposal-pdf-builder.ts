import PDFDocument from "pdfkit";
import type { ComponentType } from "@eve-os/types";

// Portuguese labels matching Capitulo 7's own naming (03-product-spec.md) —
// same data as apps/web/src/components/proposal-component-labels.ts, kept
// as its own copy here since it's this app's own presentation concern
// (rendering a PDF), not a shared domain type.
const COMPONENT_LABELS: Record<ComponentType, string> = {
  COVER: "Capa",
  BIA_STORY: "História da Bia",
  COUPLE_STORY: "História do casal",
  CONCEPT: "Conceito criativo",
  MOODBOARD: "Moodboard",
  PALETTE: "Paleta",
  ENTRANCE: "Entrada",
  CEREMONY: "Cerimônia",
  CAKE_TABLE: "Mesa do bolo",
  LOUNGE: "Lounge",
  GUEST_TABLES: "Mesas dos convidados",
  BAR: "Bar",
  BUFFET: "Buffet",
  DANCE_FLOOR: "Pista",
  LIGHTING: "Iluminação",
  FLORALS: "Florais",
  TIMELINE: "Cronograma",
  INVESTMENT: "Investimento",
};

const MOODBOARD_SECTIONS: [label: string, key: string][] = [
  ["Tecidos", "fabrics"],
  ["Flores", "flowers"],
  ["Mobiliário", "furniture"],
  ["Iluminação", "lighting"],
  ["Arquitetura", "architecture"],
];

export interface ProposalPdfComponent {
  type: ComponentType;
  order: number;
  content: Record<string, unknown>;
  /**
   * The component's conceptual render bytes, already fetched from storage —
   * this builder never fetches anything itself, so it stays a pure,
   * synchronously-testable function of its input.
   */
  imageBuffer?: Buffer;
}

/**
 * Real PDF artifact for a Proposal (Sprint 5+ item 7), replacing the
 * previously JSON-only `GET .../document`. Deliberately does not receive
 * the Proposal itself, only its (already client-safe) components — the
 * WOW Score and other internal fields must never reach a client-facing
 * document (04-ai-bible.md: "Nunca exposto ao cliente"). Renders
 * components in their existing `order` (already encodes the Brand
 * Bible's golden rules — never open with price, concept named before
 * anything else, moodboard included, investment last, see
 * 02-brand-bible.md), one per page, mirroring the same content-shape
 * switch used by ProposalComponentCard in apps/web.
 */
export async function buildProposalPdf(components: ProposalPdfComponent[]): Promise<Buffer> {
  // Uncompressed content streams: a proposal PDF is mostly text with a
  // handful of images, so the size cost is negligible, and it keeps the
  // file's raw bytes inspectable (see proposal-pdf-builder.spec.ts).
  const doc = new PDFDocument({ margin: 50, compress: false });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const sorted = [...components].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) {
    doc.fontSize(12).text("Esta proposta ainda não tem componentes gerados.");
  } else {
    sorted.forEach((component, index) => {
      if (index > 0) doc.addPage();
      renderComponent(doc, component);
    });
  }

  doc.end();
  return done;
}

function renderComponent(doc: PDFKit.PDFDocument, component: ProposalPdfComponent): void {
  doc
    .fontSize(10)
    .fillColor("#8A8078")
    .text(`${component.order}. ${COMPONENT_LABELS[component.type]}`.toUpperCase());
  doc.moveDown(0.5);
  doc.fillColor("#2F2B27");

  switch (component.type) {
    case "COVER":
      renderImage(doc, component.imageBuffer);
      doc.fontSize(22).font("Helvetica-Bold").text(String(component.content.conceptName ?? ""));
      doc.font("Helvetica").fontSize(12).text(String(component.content.coupleNames ?? ""));
      doc.text(String(component.content.venueName ?? ""));
      break;
    case "PALETTE": {
      const colors = (component.content.colors as string[] | undefined) ?? [];
      doc.fontSize(12).text(colors.length > 0 ? colors.join(", ") : "—");
      break;
    }
    case "MOODBOARD":
      for (const [label, key] of MOODBOARD_SECTIONS) {
        const items = (component.content[key] as string[] | undefined) ?? [];
        doc.fontSize(12).font("Helvetica-Bold").text(label);
        doc.font("Helvetica").text(items.length > 0 ? items.join(", ") : "—");
        doc.moveDown(0.5);
      }
      break;
    case "TIMELINE": {
      const steps = (component.content.steps as { label: string; description: string }[] | undefined) ?? [];
      steps.forEach((step, index) => {
        doc.fontSize(12).font("Helvetica-Bold").text(`${index + 1}. ${step.label}`);
        doc.font("Helvetica").text(step.description);
        doc.moveDown(0.5);
      });
      break;
    }
    case "INVESTMENT": {
      const includes = (component.content.includes as string[] | undefined) ?? [];
      const amount = component.content.amount as number | null;
      const currency = component.content.currency as string | undefined;
      for (const item of includes) {
        doc.fontSize(12).text(`• ${item}`);
      }
      if (amount != null) {
        doc.moveDown();
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(`${currency ?? ""} ${amount.toLocaleString("pt-BR")}`.trim());
        doc.font("Helvetica");
      }
      break;
    }
    default: {
      renderImage(doc, component.imageBuffer);
      const title = String(component.content.title ?? component.content.name ?? "");
      const description = String(component.content.description ?? component.content.text ?? "");
      doc.fontSize(16).font("Helvetica-Bold").text(title);
      doc.font("Helvetica").fontSize(12).text(description);
    }
  }
}

// An undecodable/corrupt/expired image must never fail the whole PDF — the
// text content around it is still real and worth delivering on its own.
function renderImage(doc: PDFKit.PDFDocument, imageBuffer: Buffer | undefined): void {
  if (!imageBuffer) return;
  try {
    doc.image(imageBuffer, { fit: [500, 300] });
    doc.moveDown();
  } catch {
    // Intentionally swallowed — see comment above.
  }
}
