import path from "node:path";
import PDFDocument from "pdfkit";
import type { CommercialProposal } from "@eve-os/types";

const FONT_DIR = path.join(__dirname, "fonts");
const FONT_SCRIPT = "Script";
const FONT_HEADING = "Heading";
const FONT_HEADING_SEMIBOLD = "HeadingSemiBold";
const FONT_BODY = "Body";
const FONT_BODY_MEDIUM = "BodyMedium";

const COLORS = {
  ink: "#332E2A",
  muted: "#756B63",
  accent: "#B8935E",
  pale: "#F8F3EC",
  border: "#EAE1D6",
  green: "#54745A",
  warning: "#946B35",
};

function registerFonts(doc: PDFKit.PDFDocument): void {
  doc.registerFont(FONT_SCRIPT, path.join(FONT_DIR, "GreatVibes-Regular.ttf"));
  doc.registerFont(FONT_HEADING, path.join(FONT_DIR, "CormorantGaramond-Regular.ttf"));
  doc.registerFont(FONT_HEADING_SEMIBOLD, path.join(FONT_DIR, "CormorantGaramond-SemiBold.ttf"));
  doc.registerFont(FONT_BODY, path.join(FONT_DIR, "Poppins-Regular.ttf"));
  doc.registerFont(FONT_BODY_MEDIUM, path.join(FONT_DIR, "Poppins-Medium.ttf"));
}

function money(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(value: string | null): string {
  if (!value) return "A definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { dateStyle: "long" });
}

function typeLabel(value: string): string {
  const labels: Record<string, string> = {
    WEDDING: "Casamento",
    DESTINATION: "Destination wedding",
    VENUE_MANAGED: "Evento em espaço gerenciado",
    HOTEL: "Casamento em hotel",
    CORPORATE: "Evento corporativo",
  };
  return labels[value] ?? value;
}

function statusLabel(value: string): string {
  const labels: Record<string, string> = {
    ESTIMATE: "Estimativa",
    QUOTE_PENDING: "Cotação pendente",
    CONFIRMED: "Confirmado",
  };
  return labels[value] ?? value;
}

function commercialStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    READY: "Pronta para envio",
    SENT: "Enviada",
    APPROVED: "Aprovada",
    REJECTED: "Devolvida para revisão",
    EXPIRED: "Expirada",
  };
  return labels[value] ?? value;
}

function scopeLabel(value: CommercialProposal["scope"]): string {
  return value === "DECORATION_ONLY" ? "Orçamento somente de decoração" : "Orçamento completo do evento";
}

function pageRule(doc: PDFKit.PDFDocument): void {
  doc.save().strokeColor(COLORS.border).lineWidth(0.7).moveTo(54, 43).lineTo(541, 43).stroke().restore();
}

function sectionHeading(doc: PDFKit.PDFDocument, kicker: string, title: string): void {
  doc.fillColor(COLORS.accent).font(FONT_SCRIPT).fontSize(18).text(kicker, { continued: true });
  doc.fillColor(COLORS.ink).font(FONT_HEADING_SEMIBOLD).fontSize(24).text(`  ${title}`);
  doc.moveTo(54, doc.y + 7).lineTo(541, doc.y + 7).lineWidth(0.8).strokeColor(COLORS.accent).stroke();
  doc.moveDown(0.9);
}

function ensureSpace(doc: PDFKit.PDFDocument, required: number): void {
  if (doc.y + required > doc.page.height - 60) {
    doc.addPage();
    pageRule(doc);
  }
}

function labelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number): void {
  doc.font(FONT_BODY_MEDIUM).fontSize(8).fillColor(COLORS.muted).text(label.toUpperCase(), x, y, { width });
  doc.font(FONT_BODY).fontSize(11).fillColor(COLORS.ink).text(value || "A definir", x, y + 13, { width });
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, pageCount: number): void {
  const y = doc.page.height - 38;
  doc.font(FONT_BODY).fontSize(7).fillColor(COLORS.muted);
  doc.text("EVE OS · Proposta comercial", 54, y, { width: 220 });
  doc.text(`${pageNumber} / ${pageCount}`, 470, y, { width: 71, align: "right" });
}

function renderCover(doc: PDFKit.PDFDocument, proposal: CommercialProposal): void {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pale);
  doc.fillColor(COLORS.accent).font(FONT_SCRIPT).fontSize(42).text("Proposta", 54, 125);
  doc.fillColor(COLORS.ink).font(FONT_HEADING_SEMIBOLD).fontSize(34).text("comercial", 54, 170);
  doc.moveTo(54, 224).lineTo(245, 224).strokeColor(COLORS.accent).lineWidth(1.2).stroke();
  doc.fillColor(COLORS.ink).font(FONT_BODY_MEDIUM).fontSize(13).text(proposal.clientNames, 54, 260, { width: 420 });
  doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(10).text(
    `${typeLabel(proposal.eventType)} · ${dateLabel(proposal.eventDate)} · ${proposal.guestsExpected ?? "Número de convidados a confirmar"} convidados`,
    54,
    286,
    { width: 430 },
  );
  doc.fillColor(COLORS.accent).font(FONT_BODY_MEDIUM).fontSize(10).text(scopeLabel(proposal.scope), 54, 322, { width: 430 });
  doc.roundedRect(54, 360, 487, 118, 8).fill("#FFFFFF");
  doc.fillColor(COLORS.accent).font(FONT_BODY_MEDIUM).fontSize(9).text("COMPOSIÇÃO SELECIONADA", 78, 386);
  doc.fillColor(COLORS.ink).font(FONT_HEADING).fontSize(24).text(proposal.venue.name, 78, 411, { width: 430 });
  doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(10).text(
    [proposal.venue.municipality, proposal.venue.venueType].filter(Boolean).join(" · ") || "Espaço de evento selecionado",
    78,
    447,
    { width: 430 },
  );
  doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(8).text(
    `Versão ${proposal.version} · ${commercialStatusLabel(proposal.status)} · Validade: ${proposal.validityDays} dias${proposal.validUntil ? ` · Até ${dateLabel(proposal.validUntil)}` : ""}`,
    54,
    690,
    { width: 470 },
  );
}

function renderVenuePage(doc: PDFKit.PDFDocument, proposal: CommercialProposal): void {
  doc.addPage();
  pageRule(doc);
  sectionHeading(doc, "01", "Espaço e premissas");
  doc.font(FONT_HEADING_SEMIBOLD).fontSize(21).fillColor(COLORS.ink).text(proposal.venue.name);
  doc.font(FONT_BODY).fontSize(10).fillColor(COLORS.muted).text(
    [proposal.venue.municipality, proposal.venue.venueType, proposal.venue.status].filter(Boolean).join(" · "),
    { paragraphGap: 8 },
  );

  labelValue(doc, "Capacidade publicada", [proposal.venue.capacityMin, proposal.venue.capacityMax].filter(Boolean).join("–") || "A confirmar", 54, 160, 140);
  labelValue(doc, "Capacidade de hospedagem", proposal.venue.lodgingCapacity ? `${proposal.venue.lodgingCapacity} pessoas` : "Não informado", 220, 160, 150);
  labelValue(doc, "Contato do espaço", proposal.venue.contact ?? "A confirmar", 395, 160, 145);

  doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("SERVIÇOS E PREMISSAS", 54, 232);
  doc.font(FONT_BODY).fontSize(10).fillColor(COLORS.ink);
  const notes = [...proposal.venue.services, ...proposal.venue.recommendationNotes];
  if (notes.length === 0) {
    doc.fillColor(COLORS.muted).text("Nenhum serviço ou observação adicional foi informado.", 54, 252, { width: 470 });
  } else {
    notes.slice(0, 12).forEach((note) => {
      ensureSpace(doc, 24);
      doc.fillColor(COLORS.accent).text("•", 58, doc.y, { continued: true });
      doc.fillColor(COLORS.ink).text(`  ${note}`, { width: 465 });
      doc.moveDown(0.35);
    });
  }

  doc.moveDown(1);
  doc.roundedRect(54, Math.min(doc.y, 620), 487, 74, 6).fill(COLORS.pale);
  doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(8).text(
    `Fonte do espaço: ${proposal.venue.source === "RESEARCH_CATALOG" ? "catálogo de pesquisa regional" : "cadastro interno do EVE OS"}. Nível de evidência: ${proposal.venue.evidenceLevel ?? "não informado"}.`,
    72,
    Math.min(doc.y + 16, 640),
    { width: 450 },
  );
}

function renderSuppliersPage(doc: PDFKit.PDFDocument, proposal: CommercialProposal): void {
  doc.addPage();
  pageRule(doc);
  sectionHeading(doc, "02", proposal.scope === "DECORATION_ONLY" ? "Ambientação decorativa" : "Equipe e fornecedores");
  doc.font(FONT_BODY).fontSize(10).fillColor(COLORS.muted).text(
    proposal.scope === "DECORATION_ONLY"
      ? "A composição abaixo contempla flores e folhagens, móveis e locações, iluminação decorativa, objetos, tecidos, mesa posta, estruturas decorativas e montagem."
      : "A composição abaixo integra os fornecedores selecionados para este evento. O escopo deve ser confirmado em orçamento e contrato próprios.",
    { width: 470 },
  );
  doc.moveDown(1);

  if (proposal.suppliers.length === 0) {
    doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(10).text("Nenhum fornecedor foi selecionado ainda.");
    return;
  }

  proposal.suppliers.forEach((supplier) => {
    ensureSpace(doc, 112);
    const top = doc.y;
    doc.roundedRect(54, top, 487, 94, 6).fill("#FFFFFF").strokeColor(COLORS.border).stroke();
    doc.fillColor(COLORS.accent).font(FONT_BODY_MEDIUM).fontSize(8).text(supplier.categoryLabel.toUpperCase(), 70, top + 14, { width: 200 });
    doc.fillColor(COLORS.ink).font(FONT_HEADING_SEMIBOLD).fontSize(16).text(supplier.name, 70, top + 31, { width: 260 });
    doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(8).text(
      [supplier.phone, supplier.email].filter(Boolean).join(" · ") || "Contato a confirmar",
      70,
      top + 57,
      { width: 300 },
    );
    doc.fillColor(supplier.pricingStatus === "CONFIRMED" ? COLORS.green : COLORS.warning).font(FONT_BODY_MEDIUM).fontSize(8).text(statusLabel(supplier.pricingStatus), 385, top + 16, { width: 135, align: "right" });
    doc.fillColor(COLORS.ink).font(FONT_BODY).fontSize(8).text(supplier.scope, 300, top + 38, { width: 220, align: "right" });
    doc.y = top + 108;
  });
}

function renderInvestmentPage(doc: PDFKit.PDFDocument, proposal: CommercialProposal): void {
  doc.addPage();
  pageRule(doc);
  sectionHeading(doc, "03", proposal.scope === "DECORATION_ONLY" ? "Investimento da decoração" : "Investimento estimado");
  doc.font(FONT_BODY).fontSize(9).fillColor(COLORS.muted).text(
    proposal.scope === "DECORATION_ONLY"
      ? "Este total corresponde somente à ambientação decorativa selecionada; serviços de buffet, foto/filme, DJ e sonorização técnica não fazem parte desta modalidade."
      : proposal.hasUnconfirmedData
        ? "Atenção: esta composição contém dados estimados, pendentes de cotação ou contatos ainda não confirmados."
        : "Os itens abaixo foram marcados como confirmados no cadastro comercial.",
    { width: 470 },
  );
  doc.moveDown(1);

  doc.font(FONT_BODY_MEDIUM).fontSize(8).fillColor(COLORS.muted);
  doc.text("ITEM", 54, doc.y, { width: 245 });
  doc.text("QTD.", 302, doc.y, { width: 45, align: "right" });
  doc.text("VALOR", 375, doc.y, { width: 75, align: "right" });
  doc.text("TOTAL", 466, doc.y, { width: 75, align: "right" });
  doc.moveDown(0.5);
  doc.moveTo(54, doc.y).lineTo(541, doc.y).strokeColor(COLORS.border).stroke();
  doc.moveDown(0.5);

  const investmentItems = [
    ...proposal.lineItems.map((item) => ({
      description: item.description,
      categoryLabel: item.categoryLabel,
      pricingStatus: item.pricingStatus,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    ...proposal.logisticsItems.map((item) => ({
      description: `${item.label}${item.supplierName ? ` · ${item.supplierName}` : ""}`,
      categoryLabel: `Logística e deslocamento · ${item.treatment === "INCLUDED" ? "incluído" : item.treatment === "NOT_APPLICABLE" ? "não se aplica" : "adicional"}`,
      pricingStatus: item.pricingStatus,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
  ];

  investmentItems.forEach((item) => {
    ensureSpace(doc, 48);
    const y = doc.y;
    doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(item.description, 54, y, { width: 235 });
    doc.font(FONT_BODY).fontSize(7.5).fillColor(COLORS.muted).text(`${item.categoryLabel} · ${statusLabel(item.pricingStatus)}`, 54, y + 14, { width: 235 });
    doc.fillColor(COLORS.ink).text(`${item.quantity} ${item.unit}`, 299, y + 5, { width: 48, align: "right" });
    doc.text(money(item.unitPrice), 375, y + 5, { width: 75, align: "right" });
    doc.font(FONT_BODY_MEDIUM).text(money(item.total), 466, y + 5, { width: 75, align: "right" });
    doc.moveTo(54, y + 35).lineTo(541, y + 35).strokeColor(COLORS.border).lineWidth(0.4).stroke();
    doc.y = y + 46;
  });

  if (proposal.packages.length > 0) {
    ensureSpace(doc, 120);
    doc.moveDown(0.5);
    doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("OPÇÕES DE PACOTE");
    doc.moveDown(0.45);
    proposal.packages.forEach((pkg) => {
      ensureSpace(doc, 38);
      const packageLabel = `${pkg.name}${pkg.selected ? " · recomendado" : ""}`;
      doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(packageLabel, 54, doc.y, { width: 230 });
      doc.font(FONT_BODY).fontSize(8).fillColor(COLORS.muted).text(`${pkg.description} · ${statusLabel(pkg.pricingStatus)}`, 54, doc.y + 14, { width: 350 });
      doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(money(pkg.totalInvestment), 466, doc.y + 5, { width: 75, align: "right" });
      doc.moveDown(0.9);
    });
  }

  ensureSpace(doc, 145);
  doc.moveDown(0.5);
  const rows = [
    ["Subtotal", proposal.subtotal],
    ["Reserva técnica / contingência", proposal.contingencyAmount],
    ["Taxa de gestão e produção", proposal.managementFee],
    ["Desconto", -proposal.discount],
  ];
  rows.forEach(([label, value]) => {
    doc.font(FONT_BODY).fontSize(9).fillColor(COLORS.muted).text(String(label), 300, doc.y, { width: 150 });
    doc.fillColor(COLORS.ink).text(money(Number(value)), 466, doc.y, { width: 75, align: "right" });
    doc.moveDown(0.65);
  });
  doc.roundedRect(294, doc.y + 4, 247, 48, 5).fill(COLORS.pale);
  doc.fillColor(COLORS.accent).font(FONT_BODY_MEDIUM).fontSize(10).text("INVESTIMENTO TOTAL", 310, doc.y + 19, { width: 140 });
  doc.fillColor(COLORS.ink).font(FONT_HEADING_SEMIBOLD).fontSize(22).text(money(proposal.totalInvestment), 430, doc.y + 14, { width: 95, align: "right" });
  doc.y += 70;
}

function renderConditionsPage(doc: PDFKit.PDFDocument, proposal: CommercialProposal): void {
  doc.addPage();
  pageRule(doc);
  sectionHeading(doc, "04", "Condições e próximos passos");
  doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("FORMA DE PAGAMENTO");
  doc.moveDown(0.45);
  proposal.paymentTerms.forEach((term) => {
    ensureSpace(doc, 45);
    doc.font(FONT_BODY_MEDIUM).fontSize(10).fillColor(COLORS.ink).text(term.label, 54, doc.y, { width: 225 });
    doc.font(FONT_BODY).fontSize(9).fillColor(COLORS.muted).text(term.description, 280, doc.y, { width: 180 });
    doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(term.amount == null ? "A definir" : money(term.amount), 466, doc.y, { width: 75, align: "right" });
    doc.moveDown(0.8);
  });

  if (proposal.payments.length > 0) {
    doc.moveDown(0.8);
    doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("AGENDA FINANCEIRA");
    doc.moveDown(0.45);
    proposal.payments.forEach((payment) => {
      ensureSpace(doc, 28);
      doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(payment.label, 54, doc.y, { width: 220 });
      doc.font(FONT_BODY).fontSize(9).fillColor(COLORS.muted).text(new Date(payment.dueDate).toLocaleDateString("pt-BR"), 286, doc.y, { width: 90 });
      doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.ink).text(money(payment.amount), 382, doc.y, { width: 90, align: "right" });
      doc.font(FONT_BODY).fontSize(8).fillColor(COLORS.muted).text(payment.status, 480, doc.y, { width: 60, align: "right" });
      doc.moveDown(0.6);
    });
  }

  doc.moveDown(0.8);
  doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("CONDIÇÕES COMERCIAIS");
  doc.moveDown(0.45);
  proposal.conditions.forEach((condition) => {
    ensureSpace(doc, 30);
    doc.font(FONT_BODY).fontSize(9).fillColor(COLORS.ink).text(`•  ${condition}`, { width: 470, paragraphGap: 5 });
  });

  doc.moveDown(1);
  doc.font(FONT_BODY_MEDIUM).fontSize(9).fillColor(COLORS.accent).text("PRÓXIMOS PASSOS");
  doc.moveDown(0.45);
  proposal.nextSteps.forEach((step, index) => {
    ensureSpace(doc, 28);
    doc.circle(63, doc.y + 5, 9).fill(COLORS.accent);
    doc.fillColor("#FFFFFF").font(FONT_BODY_MEDIUM).fontSize(8).text(String(index + 1), 60, doc.y + 1, { width: 7, align: "center" });
    doc.fillColor(COLORS.ink).font(FONT_BODY).fontSize(9).text(step, 84, doc.y, { width: 450 });
    doc.moveDown(0.6);
  });

  if (proposal.commercialNotes) {
    doc.moveDown(0.8);
    doc.roundedRect(54, doc.y, 487, 60, 5).fill(COLORS.pale);
    doc.fillColor(COLORS.muted).font(FONT_BODY).fontSize(9).text(proposal.commercialNotes, 70, doc.y + 16, { width: 455 });
    doc.y += 78;
  }
}

export async function buildCommercialProposalPdf(proposal: CommercialProposal): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 54, compress: false, bufferPages: true });
  registerFonts(doc);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  renderCover(doc, proposal);
  renderVenuePage(doc, proposal);
  renderSuppliersPage(doc, proposal);
  renderInvestmentPage(doc, proposal);
  renderConditionsPage(doc, proposal);

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    drawFooter(doc, index - range.start + 1, range.count);
  }

  doc.end();
  return done;
}
