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

// Mirrored from packages/ui/src/tokens.ts ("branco quente / grafite /
// champagne gold", per 02-brand-bible.md) — apps/api has no dependency on
// @eve-os/ui (a browser-facing package), so these are copied here rather
// than imported, but they're the same real, already-designed brand colors
// used everywhere else in the product. Deliberately NOT used to invent a
// swatch for the couple's own PALETTE component (see the PALETTE case
// below) — this is chrome/decoration for the document itself, not a stand-
// in for real event data.
const BRAND = {
  border: "#EAE1D6",
  gold: "#B8935E",
  goldDark: "#A17F4E",
  ink: "#2F2B27",
  muted: "#8A8078",
} as const;

// pdfkit's 14 standard fonts need no embedded font file, so Times gives a
// real serif for headings (closer to the product's Georgia/serif brand
// typeface than the previous all-Helvetica look) without adding an asset
// dependency to the API.
const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";
const SERIF_ITALIC = "Times-Italic";
const SANS = "Helvetica";

const BODY_WIDTH = 460;

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
 *
 * Visual language: a thin gold top rule + numbered gold section label on
 * every page, serif headings, full-bleed hero images (via pdfkit's `cover`
 * fit, so a mostly-square AI render fills the whole banner instead of
 * shrinking to fit inside it), and a page-number footer — an editorial
 * "keepsake booklet" feel instead of the earlier plain black-on-white text
 * dump, using only the product's own already-established brand colors.
 */
export async function buildProposalPdf(components: ProposalPdfComponent[]): Promise<Buffer> {
  // Uncompressed content streams: a proposal PDF is mostly text with a
  // handful of images, so the size cost is negligible, and it keeps the
  // file's raw bytes inspectable (see proposal-pdf-builder.spec.ts).
  const doc = new PDFDocument({ margin: 54, compress: false });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const sorted = [...components].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) {
    renderTopRule(doc);
    doc
      .font(SERIF_ITALIC)
      .fontSize(13)
      .fillColor(BRAND.muted)
      .text("Esta proposta ainda não tem componentes gerados.", { align: "center" });
    drawFooter(doc, 1, 1);
  } else {
    sorted.forEach((component, index) => {
      if (index > 0) doc.addPage();
      renderTopRule(doc);
      renderComponent(doc, component);
      drawFooter(doc, index + 1, sorted.length);
    });
  }

  doc.end();
  return done;
}

// A slim gold band at the very top edge of every page — the one constant
// brand touch that ties all pages together regardless of content type.
function renderTopRule(doc: PDFKit.PDFDocument): void {
  doc.rect(0, 0, doc.page.width, 6).fillColor(BRAND.gold).fill();
  doc.fillColor(BRAND.ink);
}

// Absolute-positioned so it never fights with wherever the page's content
// happens to end — every page in this document is far shorter than a full
// page (see the sample renders), so this is always safely below the text.
// Must stay strictly above page.height - margins.bottom: pdfkit treats that
// line as the printable area's bottom edge and silently inserts a blank
// extra page for any flowing/positioned text placed past it.
function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, pageCount: number): void {
  const y = doc.page.height - doc.page.margins.bottom - 22;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(BRAND.border).stroke();
  doc
    .font(SANS)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("EVE OS · PROPOSTA DE EVENTO", left, y + 10, { characterSpacing: 0.5, width: 260 });
  doc
    .font(SANS)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(`${pageNumber} / ${pageCount}`, right - 260, y + 10, { width: 260, align: "right" });
}

// A short gold rule under a heading/label — the one recurring decorative
// motif standing in for the "delicate, boutique" feel from the Brand Bible
// without needing an embedded illustration asset.
function goldRule(doc: PDFKit.PDFDocument, width: number): void {
  const y = doc.y;
  const left = doc.page.margins.left;
  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(1.4).strokeColor(BRAND.gold).stroke();
  doc.moveDown(0.5);
}

function renderSectionLabel(doc: PDFKit.PDFDocument, order: number, componentType: ComponentType): void {
  const label = `${String(order).padStart(2, "0")}  —  ${COMPONENT_LABELS[componentType]}`.toUpperCase();
  doc.font(SANS).fontSize(9).fillColor(BRAND.gold).text(label, { characterSpacing: 1.2 });
  goldRule(doc, 40);
  doc.fillColor(BRAND.ink);
}

// Fills the whole hero banner edge to edge (pdfkit's `cover`, like CSS
// background-size:cover) instead of the previous `fit`, which shrank a
// mostly-square AI render to whichever dimension was smaller and left the
// rest of the box blank — the flat, "sem vida" look this replaces.
function renderHeroImage(doc: PDFKit.PDFDocument, imageBuffer: Buffer | undefined, height: number): void {
  if (!imageBuffer) return;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  try {
    doc.image(imageBuffer, { cover: [width, height], align: "center", valign: "center" });
    doc.moveDown(0.8);
  } catch {
    // Intentionally swallowed — an undecodable/corrupt/expired image must
    // never fail the whole PDF: the text content around it is still real
    // and worth delivering on its own.
  }
}

function renderComponent(doc: PDFKit.PDFDocument, component: ProposalPdfComponent): void {
  renderSectionLabel(doc, component.order, component.type);

  switch (component.type) {
    case "COVER":
      renderHeroImage(doc, component.imageBuffer, 320);
      goldRule(doc, 60);
      doc.font(SERIF_BOLD).fontSize(30).fillColor(BRAND.ink).text(String(component.content.conceptName ?? ""));
      doc.moveDown(0.2);
      doc
        .font(SANS)
        .fontSize(11)
        .fillColor(BRAND.goldDark)
        .text(String(component.content.coupleNames ?? ""), { characterSpacing: 0.8 });
      doc.font(SERIF_ITALIC).fontSize(12).fillColor(BRAND.muted).text(String(component.content.venueName ?? ""));
      break;
    case "PALETTE": {
      // Free-text tones from the diagnosis (e.g. "verde-sálvia"), never a
      // guessed hex swatch — no real color value backs these names, and
      // fabricating one would violate the same "never invent data" rule
      // applied everywhere else in the product.
      const colors = (component.content.colors as string[] | undefined) ?? [];
      doc
        .font(SERIF)
        .fontSize(16)
        .fillColor(BRAND.ink)
        .text(colors.length > 0 ? colors.join(", ") : "—", { characterSpacing: 0.3, width: BODY_WIDTH });
      break;
    }
    case "MOODBOARD":
      for (const [label, key] of MOODBOARD_SECTIONS) {
        const items = (component.content[key] as string[] | undefined) ?? [];
        doc.font(SERIF_BOLD).fontSize(13).fillColor(BRAND.goldDark).text(label);
        doc
          .font(items.length > 0 ? SERIF : SERIF_ITALIC)
          .fontSize(11)
          .fillColor(items.length > 0 ? BRAND.ink : BRAND.muted)
          .text(items.length > 0 ? items.join(", ") : "—", { width: BODY_WIDTH });
        doc.moveDown(0.5);
        const y = doc.y;
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(BRAND.border).stroke();
        doc.moveDown(0.6);
      }
      break;
    case "TIMELINE": {
      const steps = (component.content.steps as { label: string; description: string }[] | undefined) ?? [];
      steps.forEach((step, index) => {
        doc.font(SERIF_BOLD).fontSize(13).fillColor(BRAND.goldDark).text(`${index + 1}. ${step.label}`);
        doc.font(SERIF).fontSize(11).fillColor(BRAND.ink).text(step.description, { width: BODY_WIDTH });
        doc.moveDown(0.4);
        const y = doc.y;
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(BRAND.border).stroke();
        doc.moveDown(0.5);
      });
      break;
    }
    case "INVESTMENT": {
      const includes = (component.content.includes as string[] | undefined) ?? [];
      const amount = component.content.amount as number | null;
      const currency = component.content.currency as string | undefined;
      doc.font(SERIF).fontSize(12).fillColor(BRAND.ink);
      for (const item of includes) {
        doc.text(`• ${item}`, { width: BODY_WIDTH });
        doc.moveDown(0.15);
      }
      if (amount != null) {
        doc.moveDown(0.8);
        const boxY = doc.y;
        const boxWidth = 260;
        const left = doc.page.margins.left;
        doc.roundedRect(left, boxY, boxWidth, 60, 6).lineWidth(1).strokeColor(BRAND.gold).stroke();
        doc
          .font(SANS)
          .fontSize(8)
          .fillColor(BRAND.muted)
          .text("INVESTIMENTO TOTAL", left + 18, boxY + 12, { characterSpacing: 1 });
        doc
          .font(SERIF_BOLD)
          .fontSize(20)
          .fillColor(BRAND.ink)
          .text(`${currency ?? ""} ${amount.toLocaleString("pt-BR")}`.trim(), left + 18, boxY + 26);
        doc.y = boxY + 70;
      }
      break;
    }
    default: {
      renderHeroImage(doc, component.imageBuffer, 260);
      const title = String(component.content.title ?? component.content.name ?? "");
      const description = String(component.content.description ?? component.content.text ?? "");
      if (title) {
        doc.font(SERIF_BOLD).fontSize(18).fillColor(BRAND.ink).text(title);
        goldRule(doc, 36);
      }
      if (description) {
        doc.font(SERIF).fontSize(12).fillColor(BRAND.ink).text(description, { width: BODY_WIDTH, lineGap: 3 });
      }
    }
  }
}
