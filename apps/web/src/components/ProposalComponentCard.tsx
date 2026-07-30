import { Card, colors, spacing } from "@eve-os/ui";
import type { ProposalComponent } from "@eve-os/types";
import { COMPONENT_LABELS } from "./proposal-component-labels";

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <span style={{ color: colors.textMuted }}>—</span>;
  return (
    <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: 9999,
            border: `1px solid ${colors.border}`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function NarrativeContent({ content }: { content: Record<string, unknown> }) {
  return (
    <>
      <h4 style={{ margin: 0 }}>{String(content.title ?? content.name ?? "")}</h4>
      <p style={{ color: colors.textMuted }}>{String(content.description ?? content.text ?? "")}</p>
    </>
  );
}

function ComponentBody({ component }: { component: ProposalComponent }) {
  const { content } = component;

  switch (component.type) {
    case "COVER":
      return (
        <>
          <h4 style={{ margin: 0 }}>{String(content.conceptName ?? "")}</h4>
          <p style={{ color: colors.textMuted, margin: 0 }}>{String(content.coupleNames ?? "")}</p>
          <p style={{ color: colors.textMuted, margin: 0 }}>{String(content.venueName ?? "")}</p>
        </>
      );
    case "PALETTE":
      return <ChipList items={(content.colors as string[] | undefined) ?? []} />;
    case "MOODBOARD":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {(
            [
              ["Tecidos", "fabrics"],
              ["Flores", "flowers"],
              ["Mobiliário", "furniture"],
              ["Iluminação", "lighting"],
              ["Arquitetura", "architecture"],
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <strong style={{ fontSize: "0.85rem" }}>{label}</strong>
              <ChipList items={(content[key] as string[] | undefined) ?? []} />
            </div>
          ))}
        </div>
      );
    case "TIMELINE": {
      const steps = (content.steps as { label: string; description: string }[] | undefined) ?? [];
      return (
        <ol style={{ paddingLeft: spacing.lg, margin: 0 }}>
          {steps.map((step) => (
            <li key={step.label} style={{ marginBottom: spacing.sm }}>
              <strong>{step.label}</strong>
              <p style={{ color: colors.textMuted, margin: 0 }}>{step.description}</p>
            </li>
          ))}
        </ol>
      );
    }
    case "INVESTMENT": {
      const includes = (content.includes as string[] | undefined) ?? [];
      const amount = content.amount as number | null;
      const currency = content.currency as string | undefined;
      return (
        <>
          <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
            {includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {amount != null && (
            <p style={{ marginTop: spacing.md }}>
              <strong>
                {currency} {amount.toLocaleString("pt-BR")}
              </strong>
            </p>
          )}
        </>
      );
    }
    default:
      return <NarrativeContent content={content} />;
  }
}

export function ProposalComponentCard({ component }: { component: ProposalComponent }) {
  return (
    <Card>
      <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
        {component.order}. {COMPONENT_LABELS[component.type]}
      </p>
      <ComponentBody component={component} />
    </Card>
  );
}
