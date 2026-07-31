import { useState, type ReactNode } from "react";
import { Button, Card, Input, colors, radii, spacing } from "@eve-os/ui";
import type { ProposalComponent } from "@eve-os/types";
import { COMPONENT_LABELS } from "./proposal-component-labels";

const textareaStyle = {
  padding: spacing.sm,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  fontFamily: "inherit",
  fontSize: "0.95rem",
  width: "100%",
  boxSizing: "border-box" as const,
};

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
      <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>{label}</label>
      {children}
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function NarrativeContent({ content }: { content: Record<string, unknown> }) {
  return (
    <>
      {typeof content.renderImageUrl === "string" && (
        // eslint-disable-next-line @next/next/no-img-element -- external, time-limited signed URL; not a local/optimizable asset
        <img
          src={content.renderImageUrl}
          alt={`Render conceitual: ${String(content.title ?? "")}`}
          style={{ width: "100%", borderRadius: radii.md, marginBottom: spacing.md, display: "block" }}
        />
      )}
      <h4 style={{ margin: 0 }}>{String(content.title ?? content.name ?? "")}</h4>
      <p style={{ color: colors.textMuted }}>{String(content.description ?? content.text ?? "")}</p>
    </>
  );
}

// The narrative components (Conceito, Historia da Bia, Entrada...) use
// either the {title, description} or {name, text} key pair depending on
// how Agente 3/the builder produced them (see ComponentBody's own fallback
// reads) — editing writes back whichever pair is already present, defaulting
// to title/description for a component that somehow has neither yet.
function narrativeKeys(content: Record<string, unknown>): { titleKey: "title" | "name"; descriptionKey: "description" | "text" } {
  if ("name" in content || "text" in content) return { titleKey: "name", descriptionKey: "text" };
  return { titleKey: "title", descriptionKey: "description" };
}

function ComponentBody({ component }: { component: ProposalComponent }) {
  const { content } = component;

  switch (component.type) {
    case "COVER":
      return (
        <>
          {typeof content.renderImageUrl === "string" && (
            // eslint-disable-next-line @next/next/no-img-element -- external, time-limited signed URL; not a local/optimizable asset
            <img
              src={content.renderImageUrl}
              alt={`Render conceitual: ${String(content.conceptName ?? "")}`}
              style={{ width: "100%", borderRadius: radii.md, marginBottom: spacing.md, display: "block" }}
            />
          )}
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

// Mirrors ComponentBody's own switch, one edit form per content shape — a
// manual refinement of an already-generated component (Sprint 5+ item 6),
// not a full AI regeneration. Each form only ever submits the top-level
// keys it owns; the backend shallow-merges them into the existing content,
// so sibling fields (e.g. a conceptual render's renderStorageKey) are never
// touched by an edit to unrelated fields.
function ComponentEditForm({
  component,
  onCancel,
  onSubmit,
}: {
  component: ProposalComponent;
  onCancel: () => void;
  onSubmit: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const { content, type } = component;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conceptName, setConceptName] = useState(String(content.conceptName ?? ""));
  const [coupleNames, setCoupleNames] = useState(String(content.coupleNames ?? ""));
  const [venueName, setVenueName] = useState(String(content.venueName ?? ""));
  const [colors_, setColors] = useState(((content.colors as string[] | undefined) ?? []).join(", "));
  const [fabrics, setFabrics] = useState(((content.fabrics as string[] | undefined) ?? []).join(", "));
  const [flowers, setFlowers] = useState(((content.flowers as string[] | undefined) ?? []).join(", "));
  const [furniture, setFurniture] = useState(((content.furniture as string[] | undefined) ?? []).join(", "));
  const [lighting, setLighting] = useState(((content.lighting as string[] | undefined) ?? []).join(", "));
  const [architecture, setArchitecture] = useState(((content.architecture as string[] | undefined) ?? []).join(", "));
  const [steps, setSteps] = useState((content.steps as { label: string; description: string }[] | undefined) ?? []);
  const [includes, setIncludes] = useState(((content.includes as string[] | undefined) ?? []).join(", "));
  const [amount, setAmount] = useState(content.amount != null ? String(content.amount) : "");
  const [currency, setCurrency] = useState(String(content.currency ?? ""));
  const { titleKey, descriptionKey } = narrativeKeys(content);
  const [title, setTitle] = useState(String(content[titleKey] ?? ""));
  const [description, setDescription] = useState(String(content[descriptionKey] ?? ""));

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      let patch: Record<string, unknown>;
      switch (type) {
        case "COVER":
          patch = { conceptName, coupleNames, venueName };
          break;
        case "PALETTE":
          patch = { colors: splitList(colors_) };
          break;
        case "MOODBOARD":
          patch = {
            fabrics: splitList(fabrics),
            flowers: splitList(flowers),
            furniture: splitList(furniture),
            lighting: splitList(lighting),
            architecture: splitList(architecture),
          };
          break;
        case "TIMELINE":
          patch = { steps };
          break;
        case "INVESTMENT":
          patch = { includes: splitList(includes), amount: amount === "" ? null : Number(amount), currency };
          break;
        default:
          patch = { [titleKey]: title, [descriptionKey]: description };
      }
      await onSubmit(patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui salvar essa edição.");
    } finally {
      setSaving(false);
    }
  }

  function updateStep(index: number, field: "label" | "description", value: string) {
    setSteps((previous) => previous.map((step, i) => (i === index ? { ...step, [field]: value } : step)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
      {type === "COVER" && (
        <>
          <Field label="Nome do conceito">
            <Input value={conceptName} onChange={(e) => setConceptName(e.target.value)} />
          </Field>
          <Field label="Nomes do casal">
            <Input value={coupleNames} onChange={(e) => setCoupleNames(e.target.value)} />
          </Field>
          <Field label="Espaço">
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </Field>
        </>
      )}
      {type === "PALETTE" && (
        <Field label="Cores (separadas por vírgula)">
          <Input value={colors_} onChange={(e) => setColors(e.target.value)} />
        </Field>
      )}
      {type === "MOODBOARD" && (
        <>
          <Field label="Tecidos (separados por vírgula)">
            <Input value={fabrics} onChange={(e) => setFabrics(e.target.value)} />
          </Field>
          <Field label="Flores (separadas por vírgula)">
            <Input value={flowers} onChange={(e) => setFlowers(e.target.value)} />
          </Field>
          <Field label="Mobiliário (separado por vírgula)">
            <Input value={furniture} onChange={(e) => setFurniture(e.target.value)} />
          </Field>
          <Field label="Iluminação (separada por vírgula)">
            <Input value={lighting} onChange={(e) => setLighting(e.target.value)} />
          </Field>
          <Field label="Arquitetura (separada por vírgula)">
            <Input value={architecture} onChange={(e) => setArchitecture(e.target.value)} />
          </Field>
        </>
      )}
      {type === "TIMELINE" &&
        steps.map((step, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
            <Field label={`Etapa ${index + 1} — título`}>
              <Input value={step.label} onChange={(e) => updateStep(index, "label", e.target.value)} />
            </Field>
            <Field label={`Etapa ${index + 1} — descrição`}>
              <textarea
                rows={2}
                style={textareaStyle}
                value={step.description}
                onChange={(e) => updateStep(index, "description", e.target.value)}
              />
            </Field>
          </div>
        ))}
      {type === "INVESTMENT" && (
        <>
          <Field label="Itens incluídos (separados por vírgula)">
            <Input value={includes} onChange={(e) => setIncludes(e.target.value)} />
          </Field>
          <Field label="Valor">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Moeda">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </Field>
        </>
      )}
      {!["COVER", "PALETTE", "MOODBOARD", "TIMELINE", "INVESTMENT"].includes(type) && (
        <>
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Descrição">
            <textarea rows={4} style={textareaStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </>
      )}

      {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: spacing.sm }}>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ProposalComponentCard({
  component,
  actions,
  onEdit,
}: {
  component: ProposalComponent;
  /** Extra controls rendered below the content — e.g. the Editor's "gerar render conceitual" button on the Capa. */
  actions?: ReactNode;
  /** When provided, shows an "Editar" toggle that lets a human manually refine this component's fields. */
  onEdit?: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
          {component.order}. {COMPONENT_LABELS[component.type]}
        </p>
        {onEdit && !isEditing && (
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </div>
      {isEditing && onEdit ? (
        <ComponentEditForm
          component={component}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (patch) => {
            await onEdit(patch);
            setIsEditing(false);
          }}
        />
      ) : (
        <ComponentBody component={component} />
      )}
      {!isEditing && actions && <div style={{ marginTop: spacing.md }}>{actions}</div>}
    </Card>
  );
}
