import { buildProposalPdf, type ProposalPdfComponent } from "./proposal-pdf-builder";

// A minimal valid 1x1 transparent PNG, so the "with image" case exercises
// pdfkit's real image-decoding path instead of a fake byte string.
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

// The builder writes uncompressed content streams (see PDFDocument's
// `compress: false`), so a real, non-fabricated way to check that specific
// text actually ended up in the document is to decode it straight out of
// the raw PDF bytes — no dependency on a PDF-text-extraction library
// needed. Two different encodings show up, depending on the font:
//
// - pdfkit's 14 standard fonts (not used by this builder anymore, kept
//   here for completeness): hex tokens are WinAnsi, one byte per char.
// - Embedded fonts (Script/Heading/Body — see registerFonts): each glyph
//   is shown as a 2-byte CID from that font's own private numbering, with
//   no relation to the character itself. The only way back to real text is
//   the font's own embedded /ToUnicode CMap (a `beginbfrange ... [<u0>
//   <u1>...] endbfrange` block pdfkit writes per embedded font), and which
//   CMap applies to a given Tj/TJ depends on which font was last selected
//   via a `/Fn size Tf` operator in that same content stream. Decoding it
//   properly (rather than assuming one universal byte-per-char scheme)
//   is what the helpers below do.
function parsePdfObjects(raw: string): Map<number, string> {
  const objects = new Map<number, string>();
  for (const m of raw.matchAll(/(\d+)\s+0\s+obj([\s\S]*?)endobj/g)) {
    objects.set(Number(m[1]), m[2] ?? "");
  }
  return objects;
}

function extractStreamBody(objectBody: string): string | null {
  const m = objectBody.match(/stream\r?\n([\s\S]*?)endstream/);
  return m?.[1] ?? null;
}

// pdfkit only ever emits the array form of bfrange for its embedded font
// subsets: `<startCID> <endCID> [<dst0> <dst1> ...]`, one destination per
// CID in the range (see a real generated CMap if this ever needs
// re-verifying — that's how this was written).
function parseBfRangeCMap(cmapStream: string): Map<number, string> {
  const table = new Map<number, string>();
  for (const range of cmapStream.matchAll(/<([0-9a-fA-F]+)>\s*<[0-9a-fA-F]+>\s*\[([^\]]+)\]/g)) {
    const start = parseInt(range[1] ?? "0", 16);
    const destinations = [...(range[2] ?? "").matchAll(/<([0-9a-fA-F]+)>/g)];
    destinations.forEach((dst, i) =>
      table.set(start + i, String.fromCharCode(parseInt(dst[1] ?? "0", 16))),
    );
  }
  return table;
}

// Maps each Page object's `/Contents N 0 R` stream to its own `/Fn -> font
// object number` resource table — content streams from different pages
// can reuse the same `/F1` name for entirely different fonts. pdfkit
// writes `/Resources` as its own indirect object (`/Resources 6 0 R`), not
// inline in the Page dict, so that reference has to be followed first.
function parseFontResourcesByContentStream(
  objects: Map<number, string>,
): Map<number, Map<string, number>> {
  const byContentStream = new Map<number, Map<string, number>>();
  for (const body of objects.values()) {
    if (!/\/Type\s*\/Page\b/.test(body)) continue;
    const contents = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
    if (!contents) continue;

    const resourcesRef = body.match(/\/Resources\s+(\d+)\s+0\s+R/);
    const resourcesBody = resourcesRef ? (objects.get(Number(resourcesRef[1])) ?? body) : body;

    const fonts = new Map<string, number>();
    const fontDict = resourcesBody.match(/\/Font\s*<<([\s\S]*?)>>/);
    if (fontDict?.[1]) {
      for (const f of fontDict[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g))
        fonts.set(`/${f[1]}`, Number(f[2]));
    }
    byContentStream.set(Number(contents[1]), fonts);
  }
  return byContentStream;
}

function decodeHexShow(
  hex: string,
  fontObjNum: number | null,
  objects: Map<number, string>,
  cmapsByFontObj: Map<number, Map<number, string>>,
): string {
  const fontBody = fontObjNum != null ? objects.get(fontObjNum) : undefined;
  if (fontBody && /\/Subtype\s*\/Type0/.test(fontBody)) {
    const table = cmapsByFontObj.get(fontObjNum!);
    let out = "";
    for (let i = 0; i + 4 <= hex.length; i += 4)
      out += table?.get(parseInt(hex.slice(i, i + 4), 16)) ?? "";
    return out;
  }
  // A pdfkit standard font (WinAnsi, one byte per character) — not used by
  // this builder currently, but decoded correctly all the same.
  return Buffer.from(hex, "hex").toString("latin1");
}

function decodeContentStream(
  stream: string,
  fontResources: Map<string, number>,
  objects: Map<number, string>,
  cmapsByFontObj: Map<number, Map<number, string>>,
): string {
  let currentFont: number | null = null;
  let out = "";
  const tokenPattern =
    /\/(F\d+)\s+[\d.]+\s+Tf|<([0-9a-fA-F]+)>\s*Tj|\[((?:<[0-9a-fA-F]+>|-?[\d.]+|\s)+)\]\s*TJ/g;
  for (const m of stream.matchAll(tokenPattern)) {
    if (m[1]) {
      currentFont = fontResources.get(`/${m[1]}`) ?? null;
    } else if (m[2] !== undefined) {
      out += decodeHexShow(m[2], currentFont, objects, cmapsByFontObj);
    } else if (m[3] !== undefined) {
      for (const piece of m[3].matchAll(/<([0-9a-fA-F]+)>/g)) {
        out += decodeHexShow(piece[1] ?? "", currentFont, objects, cmapsByFontObj);
      }
    }
  }
  return out;
}

function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const objects = parsePdfObjects(raw);

  const cmapsByFontObj = new Map<number, Map<number, string>>();
  for (const [fontObjNum, body] of objects) {
    if (!/\/Subtype\s*\/Type0/.test(body)) continue;
    const toUnicode = body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    const cmapBody = toUnicode && objects.get(Number(toUnicode[1]));
    const cmapStream = cmapBody && extractStreamBody(cmapBody);
    if (cmapStream) cmapsByFontObj.set(fontObjNum, parseBfRangeCMap(cmapStream));
  }

  const fontResourcesByContentStream = parseFontResourcesByContentStream(objects);

  let text = "";
  for (const [contentObjNum, fontResources] of fontResourcesByContentStream) {
    const stream = extractStreamBody(objects.get(contentObjNum) ?? "");
    if (stream) text += decodeContentStream(stream, fontResources, objects, cmapsByFontObj);
  }
  return text;
}

function containsText(buffer: Buffer, text: string): boolean {
  return extractPdfText(buffer).includes(text);
}

// pdfkit writes .fillColor(hex) as a literal "<r> <g> <b> scn" operator in
// the (uncompressed) content stream, each channel as component/255 — so,
// unlike text, no decoding is needed: reproducing that same division here
// gives the exact same float representation pdfkit itself wrote, and we can
// just look for it as a plain substring.
function usesFillColor(buffer: Buffer, hex: string): boolean {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(n.slice(offset, offset + 2), 16) / 255);
  return buffer.toString("latin1").includes(`${r} ${g} ${b} scn`);
}

describe("buildProposalPdf", () => {
  it("produces a real PDF file", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "CONCEPT",
        order: 1,
        content: { name: "Entre Montanhas e Flores", text: "Um conceito único." },
      },
    ]);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("adds an executive summary and a commercial closing page", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "COVER",
        order: 1,
        content: {
          conceptName: "Jardim Atemporal",
          coupleNames: "Karen & Daniel",
          venueName: "Villa Massari",
        },
      },
      {
        type: "CONCEPT",
        order: 4,
        content: { name: "Jardim Atemporal", description: "Uma celebração leve e acolhedora." },
      },
      {
        type: "TIMELINE",
        order: 17,
        content: { steps: [{ label: "Reunião criativa", description: "Alinhamento do projeto." }] },
      },
      {
        type: "INVESTMENT",
        order: 18,
        content: { includes: ["Direção artística"], amount: 30000, currency: "BRL" },
      },
    ]);

    expect(containsText(buffer, "Resumo executivo")).toBe(true);
    expect(containsText(buffer, "PRÓXIMOS PASSOS")).toBe(true);
    expect(containsText(buffer, "Vamos criar este momento juntos.")).toBe(true);
  });

  it("renders a narrative component's title/description text", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "ENTRANCE",
        order: 7,
        content: { title: "Um Portal Floral", description: "Arcos de flores brancas." },
      },
    ]);
    expect(containsText(buffer, "Um Portal Floral")).toBe(true);
    expect(containsText(buffer, "Arcos de flores brancas.")).toBe(true);
    expect(containsText(buffer, "ENTRADA")).toBe(true);
  });

  it("falls back to the name/text key pair when title/description aren't present", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "CONCEPT",
        order: 4,
        content: { name: "Jardim Atemporal", text: "A narrativa do conceito." },
      },
    ]);
    expect(containsText(buffer, "Jardim Atemporal")).toBe(true);
    expect(containsText(buffer, "A narrativa do conceito.")).toBe(true);
  });

  it("renders the Cover's own fields", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "COVER",
        order: 1,
        content: {
          conceptName: "Entre Montanhas e Flores",
          coupleNames: "Elis & Fabio",
          venueName: "Villa Massari",
        },
      },
    ]);
    expect(containsText(buffer, "Entre Montanhas e Flores")).toBe(true);
    expect(containsText(buffer, "Elis & Fabio")).toBe(true);
    expect(containsText(buffer, "Villa Massari")).toBe(true);
  });

  it("renders the Palette's colors as text, never a fabricated hex swatch", async () => {
    const buffer = await buildProposalPdf([
      { type: "PALETTE", order: 6, content: { colors: ["rose", "verde salvia", "champagne"] } },
    ]);
    expect(containsText(buffer, "rose, verde salvia, champagne")).toBe(true);
  });

  it("renders the Moodboard's categorized lists", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "MOODBOARD",
        order: 5,
        content: {
          fabrics: ["Linho"],
          flowers: ["Peonia"],
          furniture: [],
          lighting: [],
          architecture: [],
        },
      },
    ]);
    expect(containsText(buffer, "Tecidos")).toBe(true);
    expect(containsText(buffer, "Linho")).toBe(true);
    expect(containsText(buffer, "Peonia")).toBe(true);
  });

  it("renders the Timeline's steps in order", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "TIMELINE",
        order: 17,
        content: {
          steps: [
            { label: "Cerimonia", description: "16h" },
            { label: "Recepcao", description: "17h" },
          ],
        },
      },
    ]);
    expect(containsText(buffer, "1. Cerimonia")).toBe(true);
    expect(containsText(buffer, "2. Recepcao")).toBe(true);
  });

  it("renders the Investment's includes list and amount", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "INVESTMENT",
        order: 18,
        content: { includes: ["Direcao artistica", "Montagem"], amount: 30000, currency: "BRL" },
      },
    ]);
    expect(containsText(buffer, "Direcao artistica")).toBe(true);
    expect(containsText(buffer, "Montagem")).toBe(true);
    expect(containsText(buffer, "30.000")).toBe(true);
  });

  it("embeds a valid conceptual render image without throwing", async () => {
    const buffer = await buildProposalPdf([
      { type: "COVER", order: 1, content: { conceptName: "Teste" }, imageBuffer: VALID_PNG },
    ]);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("never fails the whole document when an image is corrupt/undecodable", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "COVER",
        order: 1,
        content: { conceptName: "Teste com imagem quebrada" },
        imageBuffer: Buffer.from("not-a-real-image"),
      },
    ]);
    expect(containsText(buffer, "Teste com imagem quebrada")).toBe(true);
  });

  it("renders components in order regardless of input order", async () => {
    const components: ProposalPdfComponent[] = [
      { type: "INVESTMENT", order: 18, content: { includes: [], amount: null } },
      { type: "COVER", order: 1, content: { conceptName: "Primeiro" } },
    ];
    const buffer = await buildProposalPdf(components);
    const text = extractPdfText(buffer);
    expect(text.indexOf("Primeiro")).toBeLessThan(text.indexOf("INVESTIMENTO"));
  });

  it("stacks components without a hero image onto a shared page instead of one page each", async () => {
    // Neither COVER nor INVESTMENT has an imageBuffer here — both are
    // narrative/data-only, so they should share the one page pdfkit
    // creates by default instead of each claiming a mostly-empty one.
    const buffer = await buildProposalPdf([
      { type: "COVER", order: 1, content: { conceptName: "Primeiro" } },
      { type: "INVESTMENT", order: 18, content: { includes: [], amount: null } },
    ]);
    const pageCount = (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pageCount).toBe(3);
  });

  it("gives a component with a hero image its own page, even next to text-only ones", async () => {
    const buffer = await buildProposalPdf([
      { type: "COVER", order: 1, imageBuffer: VALID_PNG, content: { conceptName: "Primeiro" } },
      { type: "BIA_STORY", order: 2, content: { title: "A Bia", description: "Texto curto." } },
    ]);
    const pageCount = (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pageCount).toBe(4);
  });

  it("derives the document's accent color from a recognizable palette color", async () => {
    const buffer = await buildProposalPdf([
      { type: "COVER", order: 1, content: { conceptName: "Teste" } },
      { type: "PALETTE", order: 6, content: { colors: ["Verde-sálvia", "Champagne"] } },
    ]);
    // "Verde-sálvia" matches before "Champagne" — same order as the couple's
    // own list, so the earliest recognizable tone wins.
    expect(usesFillColor(buffer, "#8A9A7B")).toBe(true);
    expect(usesFillColor(buffer, "#B8935E")).toBe(false);
  });

  it("falls back to the default brand accent when there is no usable palette color", async () => {
    const withoutPalette = await buildProposalPdf([
      { type: "COVER", order: 1, content: { conceptName: "Teste" } },
    ]);
    expect(usesFillColor(withoutPalette, "#B8935E")).toBe(true);

    // "Branco" and "Creme" are real palette entries, just too pale to
    // decorate gold rules and headings with — never a reason to invent a
    // color for them, only to skip them as accent candidates.
    const paleOnly = await buildProposalPdf([
      { type: "COVER", order: 1, content: { conceptName: "Teste" } },
      { type: "PALETTE", order: 6, content: { colors: ["Branco", "Creme"] } },
    ]);
    expect(usesFillColor(paleOnly, "#B8935E")).toBe(true);
  });

  it("still renders the palette's colors as plain text, never a swatch, once an accent is derived", async () => {
    const buffer = await buildProposalPdf([
      { type: "PALETTE", order: 6, content: { colors: ["Verde-sálvia", "Champagne"] } },
    ]);
    expect(containsText(buffer, "Verde-sálvia, Champagne")).toBe(true);
  });

  it("renders a placeholder when there are no components yet", async () => {
    const buffer = await buildProposalPdf([]);
    expect(containsText(buffer, "Esta proposta ainda")).toBe(true);
    expect(containsText(buffer, "componentes gerados.")).toBe(true);
  });
});
