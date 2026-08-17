import path from "node:path";
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
// these are copied here rather than imported. Body text stays this fixed,
// legible ink; the *accent* color (script kicker, headings, rules, bands)
// is not one of these — see deriveAccent() below.
const NEUTRAL = {
  border: "#EAE1D6",
  ink: "#332E2A",
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

// Embedded so the document can have a script kicker word and a warm,
// rounded body font — the "boutique wedding deck" look of Bia's own
// hand-made proposals (script + tracked serif heading + soft sans body)
// isn't achievable with pdfkit's 14 built-in fonts alone. See fonts/README.md
// for source/license (Google Fonts, SIL OFL — free to embed).
const FONT_DIR = path.join(__dirname, "fonts");
const FONT_SCRIPT = "Script";
const FONT_HEADING = "Heading";
const FONT_HEADING_SEMIBOLD = "HeadingSemiBold";
const FONT_BODY = "Body";
const FONT_BODY_MEDIUM = "BodyMedium";

function registerFonts(doc: PDFKit.PDFDocument): void {
  doc.registerFont(FONT_SCRIPT, path.join(FONT_DIR, "GreatVibes-Regular.ttf"));
  doc.registerFont(FONT_HEADING, path.join(FONT_DIR, "CormorantGaramond-Regular.ttf"));
  doc.registerFont(FONT_HEADING_SEMIBOLD, path.join(FONT_DIR, "CormorantGaramond-SemiBold.ttf"));
  doc.registerFont(FONT_BODY, path.join(FONT_DIR, "Poppins-Regular.ttf"));
  doc.registerFont(FONT_BODY_MEDIUM, path.join(FONT_DIR, "Poppins-Medium.ttf"));
}

const BODY_WIDTH = 460;

// Minimum vertical room a stacked (non-image) component needs before its
// kicker + heading is worth starting on the current page rather than a
// fresh one — enough for the category label, the script numeral and its
// swoosh, the heading and its rule, and roughly one line of body text.
const MIN_STACKED_COMPONENT_SPACE = 150;

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
 * 02-brand-bible.md).
 *
 * Visual language modeled on Bia's own hand-made Canva decks (a real
 * example: "Casamento Karen e Daniel"): a full-bleed cover photo behind a
 * soft white veil, a script-numeral kicker + tracked serif heading above
 * each section, a warm rounded body font, a light accent-tinted band under
 * photo pages, and a small corner flourish — instead of the flat black-on-
 * white text dump this replaced. The one accent color used throughout is
 * derived once per proposal from its own PALETTE component (see
 * deriveAccent) — a different couple's proposal is styled differently,
 * instead of every document sharing one fixed template. One honest gap:
 * this is a simplified geometric approximation of a botanical corner
 * illustration, not a copy of any specific artwork — pdfkit draws vector
 * shapes, not hand-drawn line art.
 *
 * Pagination: a component with a conceptual render gets its own full page
 * (the hero-image treatment earns that much room); components without one
 * — the narrative-only ones (História da Bia, Conceito...) and the data
 * ones (Moodboard, Paleta, Cronograma...) — stack onto a shared page
 * instead of each claiming a mostly-empty one. pdfkit's own bottom-margin
 * overflow check (still in effect, see drawFooter's comment) is the safety
 * net if a particularly long story doesn't fit the page it's sharing.
 */
export async function buildProposalPdf(components: ProposalPdfComponent[]): Promise<Buffer> {
  // Uncompressed content streams: a proposal PDF is mostly text with a
  // handful of images, so the size cost is negligible, and it keeps the
  // file's raw bytes inspectable (see proposal-pdf-builder.spec.ts).
  // bufferPages: page numbering below only knows the final page count
  // after everything is laid out (pagination is content-driven, not
  // 1-page-per-component), so footers are added in a second pass over the
  // already-drawn pages rather than while each one is first rendered.
  const doc = new PDFDocument({ margin: 54, compress: false, bufferPages: true });
  registerFonts(doc);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const sorted = [...components].sort((a, b) => a.order - b.order);
  const palette = sorted.find((component) => component.type === "PALETTE");
  const accent = deriveAccent(palette?.content.colors as string[] | undefined);

  renderTopRule(doc, accent); // the implicit first page — 'pageAdded' below only fires for later ones
  doc.on("pageAdded", () => renderTopRule(doc, accent));

  if (sorted.length === 0) {
    doc
      .font(FONT_BODY)
      .fontSize(13)
      .fillColor(NEUTRAL.muted)
      .text("Esta proposta ainda não tem componentes gerados.", { align: "center" });
  } else {
    renderExecutiveSummary(doc, sorted, accent);
    doc.addPage();

    let previousHadImage = false;
    sorted.forEach((component, index) => {
      const hasImage = Boolean(component.imageBuffer);
      // A hero-image page always starts fresh, and so does the first
      // text-only page right after one (no text crammed under a photo
      // spread) — but two components without images in a row share a page,
      // unless there's no longer enough room for a whole kicker+heading
      // block: those are drawn with raw vector shapes (the script numeral's
      // swoosh, the heading's rule), which — unlike flowing text — pdfkit
      // never auto-breaks a page for, so without this check a heading
      // could end up drawn on top of the footer instead of on a new page.
      const remainingSpace = doc.page.height - doc.page.margins.bottom - doc.y;
      const wouldCrowdFooter = remainingSpace < MIN_STACKED_COMPONENT_SPACE;
      if (index > 0 && (hasImage || previousHadImage || wouldCrowdFooter)) doc.addPage();
      else if (index > 0) doc.moveDown(1.4);
      renderComponent(doc, component, accent);
      previousHadImage = hasImage;
    });

    doc.addPage();
    renderClosingPage(doc, sorted, accent);
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i - range.start + 1, range.count);
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
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function darken(hex: string, factor: number): string {
  const n = hex.replace("#", "");
  const channel = (offset: number) =>
    Math.max(0, Math.min(255, Math.round(parseInt(n.slice(offset, offset + 2), 16) * factor)));
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
// constant brand touch tying together every page of a given proposal,
// including the cover (whose photo already carries most of the identity).
function renderTopRule(doc: PDFKit.PDFDocument, accent: Accent): void {
  doc.rect(0, 0, doc.page.width, 5).fillColor(accent.main).fill();
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
    .font(FONT_BODY)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text("EVE OS · PROPOSTA DE EVENTO", left, y + 10, { characterSpacing: 0.5, width: 260 });
  doc
    .font(FONT_BODY)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text(`${pageNumber} / ${pageCount}`, right - 260, y + 10, { width: 260, align: "right" });
}

// A short accent-colored rule under a heading — the other recurring
// decorative motif, alongside the script kicker (see renderKicker below).
function accentRule(doc: PDFKit.PDFDocument, width: number, accent: Accent): void {
  const y = doc.y;
  const left = doc.page.margins.left;
  doc
    .moveTo(left, y)
    .lineTo(left + width, y)
    .lineWidth(1.2)
    .strokeColor(accent.main)
    .stroke();
  doc.moveDown(0.5);
}

// A simplified, geometric stand-in for a botanical corner illustration —
// three curved accent-colored strokes fanning from one point, faint enough
// not to compete with a page's own photo or text. Not a copy of any
// specific artwork, just an abstraction of the same "delicate branch in
// the corner" motif Bia's own decks use throughout.
function renderCornerFlourish(doc: PDFKit.PDFDocument, accent: Accent): void {
  const cx = doc.page.width - doc.page.margins.right - 6;
  const cy = doc.page.margins.top + 4;
  doc.opacity(0.4);
  for (const [dx, dy, bend] of [
    [-46, 30, -14],
    [-30, 40, 6],
    [-14, 34, 18],
  ] as const) {
    doc
      .moveTo(cx, cy)
      .quadraticCurveTo(cx + dx * 0.6 + bend, cy + dy * 0.3, cx + dx, cy + dy)
      .lineWidth(1.1)
      .strokeColor(accent.main)
      .stroke();
  }
  doc.opacity(1);
}

// The small script numeral above a heading (e.g. a cursive "02") plus its
// underline swoosh — the two-tier "kicker word / big heading" rhythm from
// the reference deck, built from the component's own real order number
// instead of an invented connector word.
function renderKicker(doc: PDFKit.PDFDocument, order: number, accent: Accent): void {
  const left = doc.page.margins.left;
  doc.font(FONT_SCRIPT).fontSize(30).fillColor(accent.main).text(String(order).padStart(2, "0"));
  const y = doc.y - 6;
  doc
    .moveTo(left, y)
    .bezierCurveTo(left + 28, y + 9, left + 66, y - 7, left + 104, y + 1)
    .lineWidth(1)
    .strokeColor(accent.main)
    .stroke();
  doc.moveDown(0.4);
}

function renderHeading(
  doc: PDFKit.PDFDocument,
  text: string,
  accent: Accent,
  ruleWidth = 46,
): void {
  if (!text) return;
  doc
    .font(FONT_HEADING_SEMIBOLD)
    .fontSize(25)
    .fillColor(accent.dark)
    .text(text, { characterSpacing: 1.1 });
  accentRule(doc, ruleWidth, accent);
}

function renderCategoryLabel(doc: PDFKit.PDFDocument, componentType: ComponentType): void {
  const label = COMPONENT_LABELS[componentType].toUpperCase();
  doc
    .font(FONT_BODY_MEDIUM)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text(label, { characterSpacing: 1.8 });
  doc.moveDown(0.6);
}

// A light accent-tinted strip at the very bottom of a photo page, echoing
// the solid color blocks under some pages of the reference deck. Sits
// below the footer's own position (see drawFooter) so the two never
// overlap — the footer draws after, on top of the tint, still legible.
function renderBottomBand(doc: PDFKit.PDFDocument, accent: Accent): void {
  const height = 42;
  doc.opacity(0.16);
  doc
    .rect(0, doc.page.height - height, doc.page.width, height)
    .fillColor(accent.main)
    .fill();
  doc.opacity(1);
}

// Fills the whole page edge to edge behind a soft white veil (so title
// text stays legible over any photo) — the cover treatment from the
// reference deck. Returns whether an image was actually drawn, so the
// caller knows whether to place the title over the photo or, lacking one
// yet, fall back to a plain page.
function renderFullBleedCover(doc: PDFKit.PDFDocument, imageBuffer: Buffer | undefined): boolean {
  if (!imageBuffer) return false;
  try {
    doc.image(imageBuffer, 0, 0, {
      cover: [doc.page.width, doc.page.height],
      align: "center",
      valign: "center",
    });
  } catch {
    // Intentionally swallowed — an undecodable/corrupt/expired image must
    // never fail the whole PDF: the title text is still real and worth
    // delivering on its own, just on a plain page instead of a photo one.
    return false;
  }
  doc.rect(0, 0, doc.page.width, doc.page.height).fillColor("#FFFFFF").fillOpacity(0.45).fill();
  doc.fillOpacity(1);
  return true;
}

// Fills the hero banner edge to edge (pdfkit's `cover`, like CSS
// background-size:cover) instead of `fit`, which shrinks a mostly-square
// AI render to whichever dimension is smaller and leaves the rest blank.
function renderHeroImage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | undefined,
  height: number,
): boolean {
  if (!imageBuffer) return false;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x = doc.page.margins.left;
  const y = doc.y;
  // pdfkit's `cover` only computes the scale needed to fill the box, then
  // draws the image at that (often larger) size — it does not clip to the
  // box itself (unlike CSS background-size:cover). For a square AI render
  // inside this ~504pt-wide, 260pt-tall banner, that means an undraw
  // ~504x504 image bleeding ~244pt past the banner's bottom edge, over
  // whatever heading/description gets drawn right after — an explicit clip
  // region is required to actually confine it to the banner.
  doc.save();
  doc.rect(x, y, width, height).clip();
  try {
    doc.image(imageBuffer, x, y, { cover: [width, height], align: "center", valign: "center" });
  } catch {
    // Intentionally swallowed — see renderFullBleedCover's comment.
    doc.restore();
    return false;
  }
  doc.restore();
  // Explicit x/y so this sets the cursor exactly to `height` below where it
  // started — without explicit coordinates, pdfkit's cursor auto-advances
  // by the image's own oversized cover dimensions (~504pt here) instead of
  // the requested banner height, silently eating the room the heading and
  // description needed and spilling the description's last line or two
  // onto an otherwise near-empty next page.
  doc.y = y + height + 10;
  return true;
}

function textValue(
  content: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = content?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function listValue(content: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = content?.[key];
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
  return items.length > 0 ? items.join(", ") : undefined;
}

function renderSummaryRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | undefined,
  accent: Accent,
): void {
  doc
    .font(FONT_BODY_MEDIUM)
    .fontSize(9)
    .fillColor(accent.dark)
    .text(label.toUpperCase(), { characterSpacing: 1 });
  doc
    .font(FONT_BODY)
    .fontSize(11)
    .fillColor(value ? NEUTRAL.ink : NEUTRAL.muted)
    .text(value ?? "A definir na próxima validação", { width: BODY_WIDTH });
  doc.moveDown(0.55);
}

function renderExecutiveSummary(
  doc: PDFKit.PDFDocument,
  components: ProposalPdfComponent[],
  accent: Accent,
): void {
  const cover = components.find((component) => component.type === "COVER");
  const concept = components.find((component) => component.type === "CONCEPT");
  const palette = components.find((component) => component.type === "PALETTE");
  const moodboard = components.find((component) => component.type === "MOODBOARD");

  renderCornerFlourish(doc, accent);
  doc
    .font(FONT_BODY_MEDIUM)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text("VISÃO GERAL", { characterSpacing: 1.8 });
  doc.moveDown(0.8);
  renderHeading(doc, "Resumo executivo", accent, 72);
  doc
    .font(FONT_BODY)
    .fontSize(12)
    .fillColor(NEUTRAL.ink)
    .text("Uma leitura rápida das decisões criativas que orientam esta proposta.", {
      width: BODY_WIDTH,
      lineGap: 3,
    });
  doc.moveDown(1.1);

  renderSummaryRow(doc, "Casal", textValue(cover?.content, ["coupleNames"]), accent);
  renderSummaryRow(doc, "Espaço", textValue(cover?.content, ["venueName"]), accent);
  renderSummaryRow(doc, "Conceito", textValue(concept?.content, ["name", "title"]), accent);
  renderSummaryRow(doc, "Paleta", listValue(palette?.content, "colors"), accent);
  renderSummaryRow(
    doc,
    "Direção de ambiente",
    [
      listValue(moodboard?.content, "fabrics"),
      listValue(moodboard?.content, "flowers"),
      listValue(moodboard?.content, "furniture"),
    ]
      .filter(Boolean)
      .join(" · ") || undefined,
    accent,
  );

  doc.moveDown(0.8);
  renderHeading(doc, "Como a experiência se sustenta", accent, 96);
  const conceptDescription = textValue(concept?.content, ["description", "text"]);
  doc
    .font(FONT_BODY)
    .fontSize(12)
    .fillColor(NEUTRAL.ink)
    .text(
      conceptDescription ??
        "Cada ambiente foi pensado para transformar a história do casal em uma experiência acolhedora, coerente e executável.",
      { width: BODY_WIDTH, lineGap: 3 },
    );
}

function renderClosingPage(
  doc: PDFKit.PDFDocument,
  components: ProposalPdfComponent[],
  accent: Accent,
): void {
  const timeline = components.find((component) => component.type === "TIMELINE");
  const investment = components.find((component) => component.type === "INVESTMENT");

  renderCornerFlourish(doc, accent);
  doc
    .font(FONT_BODY_MEDIUM)
    .fontSize(8)
    .fillColor(NEUTRAL.muted)
    .text("PRÓXIMOS PASSOS", { characterSpacing: 1.8 });
  doc.moveDown(0.8);
  renderHeading(doc, "Da inspiração à realização", accent, 86);
  doc
    .font(FONT_BODY)
    .fontSize(12)
    .fillColor(NEUTRAL.ink)
    .text(
      "A proposta está pronta para ser revisada, ajustada e transformada em um plano de execução.",
      {
        width: BODY_WIDTH,
        lineGap: 3,
      },
    );
  doc.moveDown(1);

  renderHeading(doc, "Caminho de aprovação", accent, 92);
  const steps =
    (timeline?.content.steps as { label: string; description: string }[] | undefined) ?? [];
  for (const [index, step] of steps.entries()) {
    doc
      .font(FONT_BODY_MEDIUM)
      .fontSize(11)
      .fillColor(accent.dark)
      .text(`${index + 1}. ${step.label}`);
    doc
      .font(FONT_BODY)
      .fontSize(10.5)
      .fillColor(NEUTRAL.ink)
      .text(step.description, { width: BODY_WIDTH });
    doc.moveDown(0.45);
  }

  const includes = (investment?.content.includes as string[] | undefined) ?? [];
  if (includes.length > 0) {
    doc.moveDown(0.45);
    renderHeading(doc, "O que está contemplado", accent, 92);
    doc.font(FONT_BODY).fontSize(10.5).fillColor(NEUTRAL.ink);
    for (const item of includes) {
      doc.text(`• ${item}`, { width: BODY_WIDTH });
      doc.moveDown(0.12);
    }
  }

  doc.moveDown(0.85);
  doc
    .font(FONT_HEADING_SEMIBOLD)
    .fontSize(18)
    .fillColor(accent.dark)
    .text("Vamos criar este momento juntos.", { width: BODY_WIDTH });
}

function renderComponent(
  doc: PDFKit.PDFDocument,
  component: ProposalPdfComponent,
  accent: Accent,
): void {
  if (component.type !== "COVER") {
    renderCornerFlourish(doc, accent);
    renderCategoryLabel(doc, component.type);
  }

  switch (component.type) {
    case "COVER": {
      const hasPhoto = renderFullBleedCover(doc, component.imageBuffer);
      if (hasPhoto) doc.y = doc.page.height * 0.6;
      const titleColor = hasPhoto ? accent.dark : NEUTRAL.ink;
      const align = hasPhoto ? "center" : "left";
      doc
        .font(FONT_HEADING_SEMIBOLD)
        .fontSize(29)
        .fillColor(titleColor)
        .text(String(component.content.conceptName ?? ""), { align, characterSpacing: 0.6 });
      doc.moveDown(0.3);
      doc
        .font(FONT_BODY_MEDIUM)
        .fontSize(12)
        .fillColor(titleColor)
        .text(String(component.content.coupleNames ?? ""), { align, characterSpacing: 0.5 });
      doc
        .font(FONT_BODY)
        .fontSize(11)
        .fillColor(hasPhoto ? titleColor : NEUTRAL.muted)
        .text(String(component.content.venueName ?? ""), { align });
      break;
    }
    case "PALETTE": {
      renderKicker(doc, component.order, accent);
      renderHeading(doc, COMPONENT_LABELS.PALETTE, accent);
      // Free-text tones from the diagnosis (e.g. "verde-sálvia"), shown
      // exactly as named — never a guessed hex swatch. No real color value
      // backs these names, and fabricating one here (as opposed to the
      // *decorative* accent derived above) would violate the same "never
      // invent data" rule applied everywhere else in the product.
      const colors = (component.content.colors as string[] | undefined) ?? [];
      doc
        .font(FONT_BODY)
        .fontSize(13)
        .fillColor(NEUTRAL.ink)
        .text(colors.length > 0 ? colors.join(", ") : "—", {
          characterSpacing: 0.2,
          width: BODY_WIDTH,
        });
      break;
    }
    case "MOODBOARD":
      renderKicker(doc, component.order, accent);
      renderHeading(doc, COMPONENT_LABELS.MOODBOARD, accent);
      for (const [label, key] of MOODBOARD_SECTIONS) {
        const items = (component.content[key] as string[] | undefined) ?? [];
        doc.font(FONT_BODY_MEDIUM).fontSize(12).fillColor(accent.dark).text(label);
        doc
          .font(FONT_BODY)
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
      renderKicker(doc, component.order, accent);
      renderHeading(doc, COMPONENT_LABELS.TIMELINE, accent);
      const steps =
        (component.content.steps as { label: string; description: string }[] | undefined) ?? [];
      steps.forEach((step, index) => {
        doc
          .font(FONT_BODY_MEDIUM)
          .fontSize(12)
          .fillColor(accent.dark)
          .text(`${index + 1}. ${step.label}`);
        doc
          .font(FONT_BODY)
          .fontSize(11)
          .fillColor(NEUTRAL.ink)
          .text(step.description, { width: BODY_WIDTH });
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
      renderKicker(doc, component.order, accent);
      renderHeading(doc, COMPONENT_LABELS.INVESTMENT, accent);
      const includes = (component.content.includes as string[] | undefined) ?? [];
      const amount = component.content.amount as number | null;
      const currency = component.content.currency as string | undefined;
      doc.font(FONT_BODY).fontSize(12).fillColor(NEUTRAL.ink);
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
          .font(FONT_BODY_MEDIUM)
          .fontSize(8)
          .fillColor(NEUTRAL.muted)
          .text("INVESTIMENTO TOTAL", left + 18, boxY + 12, { characterSpacing: 1 });
        doc
          .font(FONT_HEADING_SEMIBOLD)
          .fontSize(21)
          .fillColor(NEUTRAL.ink)
          .text(`${currency ?? ""} ${amount.toLocaleString("pt-BR")}`.trim(), left + 18, boxY + 25);
        doc.y = boxY + 70;
      }
      break;
    }
    default: {
      const hasPhoto = renderHeroImage(doc, component.imageBuffer, 260);
      renderKicker(doc, component.order, accent);
      const title = String(component.content.title ?? component.content.name ?? "");
      const description = String(component.content.description ?? component.content.text ?? "");
      renderHeading(doc, title, accent, 40);
      if (description) {
        doc
          .font(FONT_BODY)
          .fontSize(12)
          .fillColor(NEUTRAL.ink)
          .text(description, { width: BODY_WIDTH, lineGap: 3 });
      }
      if (hasPhoto) renderBottomBand(doc, accent);
    }
  }
}
