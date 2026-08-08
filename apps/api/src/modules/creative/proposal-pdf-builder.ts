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

// Neutral tones mirrored from packages/ui/src/tokens.ts (02-brand-bible.md)
// — apps/api has no dependency on @eve-os/ui (a browser-facing package), so
// these are copied here rather than imported. Text/border colors stay fixed
// for legibility; the *accent* color (rules, section labels, headings) is
// no longer one of these — see deriveAccent() below.
const NEUTRAL = {
  border: "#EAE1D6",
  ink: "#2F2B27",
  muted: "#8A8078",
} as const;

// Used only when a proposal has no PALETTE component yet, or none of its
// color names are recognized below — the same champagne gold the rest of
// the product already uses, so an unstyled proposal still looks intentional
// rather than broken.
const DEFAULT_ACCENT: Accent = { main: "#B8935E", dark: "#A17F4E" };

interface Accent {
  main: string;
  dark: string;
}

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
 * Visual language: a thin accent-colored top rule + numbered section label
 * on every page, serif headings, full-bleed hero images (via pdfkit's
 * `cover` fit, so a mostly-square AI render fills the whole banner instead
 * of shrinking to fit inside it), and a page-number footer — an editorial
 * "keepsake booklet" feel instead of the earlier plain black-on-white text
 * dump. The one accent color used throughout is derived once per proposal
 * from its own PALETTE component (see deriveAccent) — a different couple's
 * proposal is styled differently, instead of every document sharing one
 * fixed template regardless of the event's own decor.
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
  const palette = sorted.find((component) => component.type === "PALETTE");
  const accent = deriveAccent(palette?.content.colors as string[] | undefined);

  if (sorted.length === 0) {
    renderTopRule(doc, accent);
    doc
      .font(SERIF_ITALIC)
      .fontSize(13)
      .fillColor(NEUTRAL.muted)
      .text("Esta proposta ainda não tem componentes gerados.", { align: "center" });
    drawFooter(doc, 1, 1);
  } else {
    sorted.forEach((component, index) => {
      if (index > 0) doc.addPage();
      renderTopRule(doc, accent);
      renderComponent(doc, component, accent);
      drawFooter(doc, index + 1, sorted.length);
    });
  }

  doc.end();
  return done;
}

// Turns the couple's own diagnosed palette (e.g. ["Verde-sálvia",
// "Champagne", ...] — free text from the Creative Engine, see
// diagnosticoCriativo/PALETTE component) into ONE accent color for this
// proposal's document chrome. This is a styling choice, not a factual
// claim: it never touches how the PALETTE component itself is rendered
// (still the couple's exact color names, joined as plain text — see the
// PALETTE case below), and it never claims "verde-sálvia IS #8A9A7B". It's
// the same kind of judgment call as picking "champagne gold" as the
// product's own brand accent in the first place — just applied per-
// proposal instead of once, so the keepsake feels inspired by that
// specific event instead of every proposal sharing one fixed template.
// Pale/white-ish tones (branco, creme, marfim...) are skipped as accent
// candidates — real palette entries, just too low-contrast to decorate
// gold rules and headings with — falling through to the next color, or to
// the default brand accent if nothing usable is found.
const ACCENT_SKIP = /\b(branco|off-?white|creme|marfim|ivory|nude)\b/;

const ACCENT_HINTS: [pattern: RegExp, hex: string][] = [
  [/sage|verde.?salvia/, "#8A9A7B"],
  [/champagne/, "#C9A876"],
  [/dourado|gold/, "#B8935E"],
  [/blush|ros[e]/, "#D9A9A0"],
  [/terracot/, "#B5654A"],
  [/lavanda|lilas/, "#9B8AC4"],
  [/vinho|bordo|burgund/, "#6E2C36"],
  [/coral/, "#E0745A"],
  [/pessego|peach/, "#E8B48A"],
  [/menta|mint/, "#8FC1A9"],
  [/oliva|olive/, "#7C7A42"],
  [/prata|silver/, "#ABABA5"],
  [/azul.?marinho|navy/, "#2E3A59"],
  [/azul|blue/, "#6B8CAE"],
  [/amarelo|yellow/, "#D9B84A"],
  [/laranja|orange/, "#D98A3D"],
  [/vermelho|red/, "#B4453C"],
  [/rosa|pink/, "#D69AB0"],
  [/roxo|purple/, "#7A5C99"],
  [/verde|green/, "#7C9070"],
  [/marrom|brown/, "#8A6A50"],
  [/bege|beige/, "#C9B08C"],
  [/cinza|grey|gray/, "#9C9C97"],
  [/preto|black/, "#403C37"],
];

function normalizeColorName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function darken(hex: string, factor: number): string {
  const n = hex.replace("#", "");
  const channel = (offset: number) => Math.max(0, Math.min(255, Math.round(parseInt(n.slice(offset, offset + 2), 16) * factor)));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
}

function deriveAccent(colors: string[] | undefined): Accent {
  for (const raw of colors ?? []) {
    const name = normalizeColorName(raw);
    if (ACCENT_SKIP.test(name)) continue;
    const hit = ACCENT_HINTS.find(([pattern]) => pattern.test(name));
    if (hit) {
      const [, main] = hit;
      return { main, dark: darken(main, 0.78) };
    }
  }
  return DEFAULT_ACCENT;
}

// A slim accent-colored band at the very top edge of every page — the one
// constant visual touch that ties all pages of a given proposal together.
function renderTopRule(doc: PDFKit.PDFDocument, accent: Accent): void {
  doc.rect(0, 0, doc.page.width, 6).fillColor(accent.main).fill();
  doc.fillColor(NEUTRAL.ink);
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
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(NEUTRAL.border).stroke();
  doc
    .font(SANS)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text("EVE OS · PROPOSTA DE EVENTO", left, y + 10, { characterSpacing: 0.5, width: 260 });
  doc
    .font(SANS)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text(`${pageNumber} / ${pageCount}`, right - 260, y + 10, { width: 260, align: "right" });
}

// A short accent-colored rule under a heading/label — the one recurring
// decorative motif standing in for the "delicate, boutique" feel from the
// Brand Bible without needing an embedded illustration asset.
function accentRule(doc: PDFKit.PDFDocument, width: number, accent: Accent): void {
  const y = doc.y;
  const left = doc.page.margins.left;
  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(1.4).strokeColor(accent.main).stroke();
  doc.moveDown(0.5);
}

function renderSectionLabel(doc: PDFKit.PDFDocument, order: number, componentType: ComponentType, accent: Accent): void {
  const label = `${String(order).padStart(2, "0")}  —  ${COMPONENT_LABELS[componentType]}`.toUpperCase();
  doc.font(SANS).fontSize(9).fillColor(accent.main).text(label, { characterSpacing: 1.2 });
  accentRule(doc, 40, accent);
  doc.fillColor(NEUTRAL.ink);
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

function renderComponent(doc: PDFKit.PDFDocument, component: ProposalPdfComponent, accent: Accent): void {
  renderSectionLabel(doc, component.order, component.type, accent);

  switch (component.type) {
    case "COVER":
      renderHeroImage(doc, component.imageBuffer, 320);
      accentRule(doc, 60, accent);
      doc.font(SERIF_BOLD).fontSize(30).fillColor(NEUTRAL.ink).text(String(component.content.conceptName ?? ""));
      doc.moveDown(0.2);
      doc
        .font(SANS)
        .fontSize(11)
        .fillColor(accent.dark)
        .text(String(component.content.coupleNames ?? ""), { characterSpacing: 0.8 });
      doc.font(SERIF_ITALIC).fontSize(12).fillColor(NEUTRAL.muted).text(String(component.content.venueName ?? ""));
      break;
    case "PALETTE": {
      // Free-text tones from the diagnosis (e.g. "verde-sálvia"), shown
      // exactly as named — never a guessed hex swatch. No real color value
      // backs these names, and fabricating one here (as opposed to the
      // *decorative* accent derived above) would violate the same "never
      // invent data" rule applied everywhere else in the product.
      const colors = (component.content.colors as string[] | undefined) ?? [];
      doc
        .font(SERIF)
        .fontSize(16)
        .fillColor(NEUTRAL.ink)
        .text(colors.length > 0 ? colors.join(", ") : "—", { characterSpacing: 0.3, width: BODY_WIDTH });
      break;
    }
    case "MOODBOARD":
      for (const [label, key] of MOODBOARD_SECTIONS) {
        const items = (component.content[key] as string[] | undefined) ?? [];
        doc.font(SERIF_BOLD).fontSize(13).fillColor(accent.dark).text(label);
        doc
          .font(items.length > 0 ? SERIF : SERIF_ITALIC)
          .fontSize(11)
          .fillColor(items.length > 0 ? NEUTRAL.ink : NEUTRAL.muted)
          .text(items.length > 0 ? items.join(", ") : "—", { width: BODY_WIDTH });
        doc.moveDown(0.5);
        const y = doc.y;
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(NEUTRAL.border).stroke();
        doc.moveDown(0.6);
      }
      break;
    case "TIMELINE": {
      const steps = (component.content.steps as { label: string; description: string }[] | undefined) ?? [];
      steps.forEach((step, index) => {
        doc.font(SERIF_BOLD).fontSize(13).fillColor(accent.dark).text(`${index + 1}. ${step.label}`);
        doc.font(SERIF).fontSize(11).fillColor(NEUTRAL.ink).text(step.description, { width: BODY_WIDTH });
        doc.moveDown(0.4);
        const y = doc.y;
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(NEUTRAL.border).stroke();
        doc.moveDown(0.5);
      });
      break;
    }
    case "INVESTMENT": {
      const includes = (component.content.includes as string[] | undefined) ?? [];
      const amount = component.content.amount as number | null;
      const currency = component.content.currency as string | undefined;
      doc.font(SERIF).fontSize(12).fillColor(NEUTRAL.ink);
      for (const item of includes) {
        doc.text(`• ${item}`, { width: BODY_WIDTH });
        doc.moveDown(0.15);
      }
      if (amount != null) {
        doc.moveDown(0.8);
        const boxY = doc.y;
        const boxWidth = 260;
        const left = doc.page.margins.left;
        doc.roundedRect(left, boxY, boxWidth, 60, 6).lineWidth(1).strokeColor(accent.main).stroke();
        doc
          .font(SANS)
          .fontSize(8)
          .fillColor(NEUTRAL.muted)
          .text("INVESTIMENTO TOTAL", left + 18, boxY + 12, { characterSpacing: 1 });
        doc
          .font(SERIF_BOLD)
          .fontSize(20)
          .fillColor(NEUTRAL.ink)
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
        doc.font(SERIF_BOLD).fontSize(18).fillColor(NEUTRAL.ink).text(title);
        accentRule(doc, 36, accent);
      }
      if (description) {
        doc.font(SERIF).fontSize(12).fillColor(NEUTRAL.ink).text(description, { width: BODY_WIDTH, lineGap: 3 });
      }
    }
  }
}
