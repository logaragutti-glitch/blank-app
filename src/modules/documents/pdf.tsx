import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { DocumentContent as TypedContent, GeneratableDocumentType } from "./schemas";

/**
 * Layout do PDF executivo (docs/API_SPEC.md "Exportação", docs/ARCHITECTURE.md "PDF Service").
 * `@react-pdf/renderer` tem seu próprio conjunto de primitivas (View/Text/Page, não divs/spans)
 * e roda em Node puro via `renderToBuffer` — sem depender de um browser (Chromium/Puppeteer),
 * o que pesa menos numa function serverless da Vercel. Por isso este arquivo não reaproveita
 * `document-content.tsx` (feito para o DOM) e reimplementa a formatação de cada tipo de
 * documento com as primitivas do react-pdf.
 */

export interface PdfEventInfo {
  name: string;
  clientName: string | null;
  eventDate: string | null;
  location: string | null;
  guestCount: number | null;
  targetBudget: string | null;
}

export interface PdfMemScore {
  score: number;
  breakdown: Record<string, number>;
}

export interface PdfDocumentEntry {
  type: GeneratableDocumentType;
  label: string;
  content: unknown;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  coverTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  coverSubtitle: { fontSize: 11, color: "#666666", marginBottom: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metaLabel: { color: "#666666" },
  metaValue: { fontWeight: 700 },
  scoreBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
  },
  scoreValue: { fontSize: 28, fontWeight: 700 },
  scoreLabel: { fontSize: 9, color: "#666666" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e4e4e7",
  },
  paragraph: { marginBottom: 6, lineHeight: 1.4 },
  itemTitle: { fontWeight: 700, marginBottom: 2 },
  itemDescription: { color: "#444444", marginBottom: 8, lineHeight: 1.4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  chip: {
    fontSize: 9,
    backgroundColor: "#f4f4f5",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  timelineRow: { flexDirection: "row", marginBottom: 6 },
  timelineTime: { width: 60, fontWeight: 700, color: "#444444" },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: "1px solid #f4f4f5",
  },
  budgetTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTop: "1px solid #1a1a1a",
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
  },
});

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DocumentSection({ entry }: { entry: PdfDocumentEntry }) {
  return (
    <View style={{ marginBottom: 18 }} wrap={false}>
      <Text style={styles.sectionTitle}>{entry.label}</Text>
      <DocumentBody entry={entry} />
    </View>
  );
}

function DocumentBody({ entry }: { entry: PdfDocumentEntry }) {
  switch (entry.type) {
    case "DNA_EVENTO": {
      const c = entry.content as TypedContent<"DNA_EVENTO">;
      return (
        <View>
          <Text style={styles.itemTitle}>{c.essence}</Text>
          <View style={styles.chipRow}>
            {c.guidingEmotions.map((emotion) => (
              <Text key={emotion} style={styles.chip}>
                {emotion}
              </Text>
            ))}
          </View>
          <View style={styles.chipRow}>
            {c.keywords.map((keyword) => (
              <Text key={keyword} style={styles.chip}>
                {keyword}
              </Text>
            ))}
          </View>
          <Text style={styles.paragraph}>{c.narrative}</Text>
        </View>
      );
    }
    case "MAPA_EMOCAO": {
      const c = entry.content as TypedContent<"MAPA_EMOCAO">;
      return (
        <View>
          {c.moments.map((moment, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.itemTitle}>
                {moment.phase} — {moment.emotion}
              </Text>
              <Text style={styles.itemDescription}>{moment.description}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "JORNADA_MEMORAVEL": {
      const c = entry.content as TypedContent<"JORNADA_MEMORAVEL">;
      return (
        <View>
          {c.stages.map((stage, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.itemTitle}>
                {i + 1}. {stage.title}
              </Text>
              <Text style={styles.itemDescription}>{stage.description}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "LINHA_DO_TEMPO": {
      const c = entry.content as TypedContent<"LINHA_DO_TEMPO">;
      return (
        <View>
          {c.items.map((item, i) => (
            <View key={i} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
              </View>
            </View>
          ))}
        </View>
      );
    }
    case "PLANO_OPERACIONAL": {
      const c = entry.content as TypedContent<"PLANO_OPERACIONAL">;
      return (
        <View>
          {c.phases.map((phase, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={styles.itemTitle}>{phase.title}</Text>
              {phase.tasks.map((task, j) => (
                <Text key={j} style={styles.itemDescription}>
                  • {task}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case "CHECKLIST": {
      const c = entry.content as TypedContent<"CHECKLIST">;
      return (
        <View>
          {c.items.map((item, i) => (
            <Text key={i} style={styles.paragraph}>
              ☐ {item.title}
              {item.dueOffsetDays != null ? ` (${item.dueOffsetDays} dias antes)` : ""}
            </Text>
          ))}
        </View>
      );
    }
    case "PLANO_FINANCEIRO": {
      const c = entry.content as TypedContent<"PLANO_FINANCEIRO">;
      const total = c.lines.reduce((sum, l) => sum + l.amount, 0);
      return (
        <View>
          {c.lines.map((line, i) => (
            <View key={i} style={styles.budgetRow}>
              <Text>
                {line.category} — {line.description}
              </Text>
              <Text>{formatCurrency(line.amount)}</Text>
            </View>
          ))}
          <View style={styles.budgetTotal}>
            <Text>Total</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>
      );
    }
    case "PLANO_B": {
      const c = entry.content as TypedContent<"PLANO_B">;
      return (
        <View>
          {c.risks.map((r, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.itemTitle}>{r.risk}</Text>
              <Text style={styles.itemDescription}>{r.mitigation}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "RESUMO_EXECUTIVO": {
      const c = entry.content as TypedContent<"RESUMO_EXECUTIVO">;
      return (
        <View>
          <Text style={styles.paragraph}>{c.summary}</Text>
          {c.highlights.map((h, i) => (
            <Text key={i} style={styles.itemDescription}>
              • {h}
            </Text>
          ))}
        </View>
      );
    }
    default:
      return null;
  }
}

export function EventPdfDocument({
  event,
  memScore,
  documents,
}: {
  event: PdfEventInfo;
  memScore: PdfMemScore | null;
  documents: PdfDocumentEntry[];
}) {
  return (
    <Document title={`MEM Architect — ${event.name}`} author="MEM Technologies">
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>{event.name}</Text>
        <Text style={styles.coverSubtitle}>Projeto executivo gerado pelo MEM Architect</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Cliente</Text>
          <Text style={styles.metaValue}>{event.clientName ?? "—"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Data</Text>
          <Text style={styles.metaValue}>{event.eventDate ?? "—"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Local</Text>
          <Text style={styles.metaValue}>{event.location ?? "—"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Convidados</Text>
          <Text style={styles.metaValue}>{event.guestCount?.toString() ?? "—"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Orçamento alvo</Text>
          <Text style={styles.metaValue}>{event.targetBudget ?? "—"}</Text>
        </View>

        {memScore && (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{memScore.score}</Text>
            <Text style={styles.scoreLabel}>MEM Score™</Text>
          </View>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {documents.map((entry) => (
        <Page key={entry.type} size="A4" style={styles.page}>
          <DocumentSection entry={entry} />
          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}
