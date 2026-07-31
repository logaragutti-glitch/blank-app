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
// needed. pdfkit draws standard-font text as hex-string tokens (`<...>`)
// inside Tj/TJ operators — WinAnsi-encoded, one byte per character —
// sometimes split into several adjacent tokens interleaved with numeric
// kerning adjustments (e.g. `[<726f7365> 15 <2c2076>...] TJ`). Extracting
// and concatenating every hex token in file order reconstructs the
// rendered text faithfully enough to search for a substring.
function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const hexTokens = raw.match(/<[0-9a-fA-F]+>/g) ?? [];
  return hexTokens.map((token) => Buffer.from(token.slice(1, -1), "hex").toString("latin1")).join("");
}

function containsText(buffer: Buffer, text: string): boolean {
  return extractPdfText(buffer).includes(text);
}

describe("buildProposalPdf", () => {
  it("produces a real PDF file", async () => {
    const buffer = await buildProposalPdf([
      { type: "CONCEPT", order: 1, content: { name: "Entre Montanhas e Flores", text: "Um conceito único." } },
    ]);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("renders a narrative component's title/description text", async () => {
    const buffer = await buildProposalPdf([
      { type: "ENTRANCE", order: 7, content: { title: "Um Portal Floral", description: "Arcos de flores brancas." } },
    ]);
    expect(containsText(buffer, "Um Portal Floral")).toBe(true);
    expect(containsText(buffer, "Arcos de flores brancas.")).toBe(true);
    expect(containsText(buffer, "ENTRADA")).toBe(true);
  });

  it("falls back to the name/text key pair when title/description aren't present", async () => {
    const buffer = await buildProposalPdf([
      { type: "CONCEPT", order: 4, content: { name: "Jardim Atemporal", text: "A narrativa do conceito." } },
    ]);
    expect(containsText(buffer, "Jardim Atemporal")).toBe(true);
    expect(containsText(buffer, "A narrativa do conceito.")).toBe(true);
  });

  it("renders the Cover's own fields", async () => {
    const buffer = await buildProposalPdf([
      {
        type: "COVER",
        order: 1,
        content: { conceptName: "Entre Montanhas e Flores", coupleNames: "Elis & Fabio", venueName: "Villa Massari" },
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
        content: { fabrics: ["Linho"], flowers: ["Peonia"], furniture: [], lighting: [], architecture: [] },
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

  it("renders components in order, one per page, regardless of input order", async () => {
    const components: ProposalPdfComponent[] = [
      { type: "INVESTMENT", order: 18, content: { includes: [], amount: null } },
      { type: "COVER", order: 1, content: { conceptName: "Primeiro" } },
    ];
    const buffer = await buildProposalPdf(components);
    const pageCount = (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pageCount).toBe(2);

    const text = extractPdfText(buffer);
    expect(text.indexOf("Primeiro")).toBeLessThan(text.indexOf("INVESTIMENTO"));
  });

  it("renders a placeholder when there are no components yet", async () => {
    const buffer = await buildProposalPdf([]);
    expect(containsText(buffer, "Esta proposta ainda")).toBe(true);
    expect(containsText(buffer, "componentes gerados.")).toBe(true);
  });
});
