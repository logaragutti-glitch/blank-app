import type { GeneratableDocumentType, DocumentContent as TypedContent } from "@/modules/documents/schemas";

/** Renderização somente-leitura de cada tipo de documento — a forma de `content` varia por tipo, ver src/modules/documents/schemas.ts. */
export function DocumentContentView({
  type,
  content,
}: {
  type: GeneratableDocumentType;
  content: unknown;
}) {
  switch (type) {
    case "DNA_EVENTO": {
      const c = content as TypedContent<"DNA_EVENTO">;
      return (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">{c.essence}</p>
          <div className="flex flex-wrap gap-1.5">
            {c.guidingEmotions.map((emotion) => (
              <Chip key={emotion}>{emotion}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.keywords.map((keyword) => (
              <Chip key={keyword} muted>
                {keyword}
              </Chip>
            ))}
          </div>
          <p className="text-muted-foreground">{c.narrative}</p>
        </div>
      );
    }
    case "MAPA_EMOCAO": {
      const c = content as TypedContent<"MAPA_EMOCAO">;
      return (
        <ul className="flex flex-col gap-3 text-sm">
          {c.moments.map((moment, i) => (
            <li key={i}>
              <span className="font-medium">
                {moment.phase} — {moment.emotion}
              </span>
              <p className="text-muted-foreground">{moment.description}</p>
            </li>
          ))}
        </ul>
      );
    }
    case "JORNADA_MEMORAVEL": {
      const c = content as TypedContent<"JORNADA_MEMORAVEL">;
      return (
        <ol className="flex flex-col gap-3 text-sm">
          {c.stages.map((stage, i) => (
            <li key={i}>
              <span className="font-medium">
                {i + 1}. {stage.title}
              </span>
              <p className="text-muted-foreground">{stage.description}</p>
            </li>
          ))}
        </ol>
      );
    }
    case "LINHA_DO_TEMPO": {
      const c = content as TypedContent<"LINHA_DO_TEMPO">;
      return (
        <ul className="flex flex-col gap-2 text-sm">
          {c.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-16 shrink-0 font-medium text-muted-foreground">{item.time}</span>
              <div>
                <span className="font-medium">{item.title}</span>
                {item.description && <p className="text-muted-foreground">{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      );
    }
    case "PLANO_OPERACIONAL": {
      const c = content as TypedContent<"PLANO_OPERACIONAL">;
      return (
        <div className="flex flex-col gap-4 text-sm">
          {c.phases.map((phase, i) => (
            <div key={i}>
              <p className="font-medium">{phase.title}</p>
              <ul className="ml-4 list-disc text-muted-foreground">
                {phase.tasks.map((task, j) => (
                  <li key={j}>{task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    case "CHECKLIST": {
      const c = content as TypedContent<"CHECKLIST">;
      return (
        <ul className="flex flex-col gap-2 text-sm">
          {c.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 shrink-0 rounded border border-border" />
              {item.title}
              {item.dueOffsetDays != null && (
                <span className="text-xs text-muted-foreground">
                  ({item.dueOffsetDays} dias antes)
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    }
    case "PLANO_FINANCEIRO": {
      const c = content as TypedContent<"PLANO_FINANCEIRO">;
      const total = c.lines.reduce((sum, l) => sum + l.amount, 0);
      return (
        <div className="flex flex-col gap-2 text-sm">
          {c.lines.map((line, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <span className="font-medium">{line.category}</span>
                <span className="text-muted-foreground"> — {line.description}</span>
              </div>
              <span>{formatCurrency(line.amount)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      );
    }
    case "PLANO_B": {
      const c = content as TypedContent<"PLANO_B">;
      return (
        <ul className="flex flex-col gap-3 text-sm">
          {c.risks.map((r, i) => (
            <li key={i}>
              <span className="font-medium">{r.risk}</span>
              <p className="text-muted-foreground">{r.mitigation}</p>
            </li>
          ))}
        </ul>
      );
    }
    case "RESUMO_EXECUTIVO": {
      const c = content as TypedContent<"RESUMO_EXECUTIVO">;
      return (
        <div className="flex flex-col gap-3 text-sm">
          <p>{c.summary}</p>
          <ul className="ml-4 list-disc text-muted-foreground">
            {c.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      );
    }
    default:
      return null;
  }
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={
        muted
          ? "rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
          : "rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
      }
    >
      {children}
    </span>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
