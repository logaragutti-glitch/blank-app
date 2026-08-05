"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useProject } from "../../../../lib/use-project";
import type { ProjectSupplierAssignment, ProjectSupplierStatus, Supplier } from "../../../../lib/api-types";
import {
  PROJECT_SUPPLIER_STATUS_COLOR,
  PROJECT_SUPPLIER_STATUS_LABEL,
  SUPPLIER_CATEGORY_LABEL,
} from "../../../../lib/labels";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const STATUS_OPTIONS = Object.keys(PROJECT_SUPPLIER_STATUS_LABEL) as ProjectSupplierStatus[];

function StatusPill({ status }: { status: ProjectSupplierStatus }) {
  const tone = PROJECT_SUPPLIER_STATUS_COLOR[status];
  const toneColor = tone === "primary" ? colors.primary : tone === "danger" ? colors.danger : colors.textMuted;
  return (
    <span
      style={{
        fontSize: "0.75rem",
        color: toneColor,
        border: `1px solid ${toneColor}`,
        borderRadius: radii.full,
        padding: "2px 10px",
      }}
    >
      {PROJECT_SUPPLIER_STATUS_LABEL[status]}
    </span>
  );
}

function AddSupplierForm({
  assignments,
  candidates,
  onAdd,
}: {
  assignments: ProjectSupplierAssignment[];
  candidates: Supplier[];
  onAdd: (input: { supplierId: string; status: ProjectSupplierStatus; notes: string }) => Promise<void>;
}) {
  const assignedIds = new Set(assignments.map((a) => a.supplierId));
  const available = candidates.filter((c) => !assignedIds.has(c.id));
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<ProjectSupplierStatus>("CONTACTED");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supplierId && available.length > 0) setSupplierId(available[0]!.id);
  }, [available, supplierId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({ supplierId, status, notes });
      setNotes("");
      setStatus("CONTACTED");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos adicionar o fornecedor.");
    } finally {
      setSubmitting(false);
    }
  }

  if (candidates.length === 0) {
    return (
      <p style={{ color: colors.textMuted }}>
        Nenhum fornecedor cadastrado ainda no <Link href="/fornecedores">catálogo</Link>.
      </p>
    );
  }

  if (available.length === 0) {
    return <p style={{ color: colors.textMuted }}>Todos os fornecedores do catálogo já estão neste projeto.</p>;
  }

  const selectStyle = {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: "0.95rem",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
      <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ ...selectStyle, flex: "1 1 200px" }}>
        {available.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name} ({SUPPLIER_CATEGORY_LABEL[candidate.category]})
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ProjectSupplierStatus)}
        style={{ ...selectStyle, flex: "1 1 160px" }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {PROJECT_SUPPLIER_STATUS_LABEL[option]}
          </option>
        ))}
      </select>
      <Input
        placeholder="Observações (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ flex: "1 1 200px" }}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adicionando..." : "+ Adicionar"}
      </Button>
      {error && <p style={{ color: colors.danger, margin: 0, width: "100%" }}>{error}</p>}
    </form>
  );
}

function SupplierRow({
  assignment,
  onChangeStatus,
  onRemove,
}: {
  assignment: ProjectSupplierAssignment;
  onChangeStatus: (status: ProjectSupplierStatus) => void;
  onRemove: () => void;
}) {
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: colors.textPrimary, fontSize: "0.9rem" }}>{assignment.name}</strong>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem" }}>
            {assignment.category ? SUPPLIER_CATEGORY_LABEL[assignment.category] : "—"} · desde{" "}
            {dateFormatter.format(new Date(assignment.addedAt))}
          </p>
          {assignment.notes && (
            <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.8rem" }}>{assignment.notes}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <StatusPill status={assignment.status} />
          <select
            value={assignment.status}
            onChange={(e) => onChangeStatus(e.target.value as ProjectSupplierStatus)}
            style={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              padding: `2px ${spacing.sm}`,
              fontSize: "0.8rem",
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PROJECT_SUPPLIER_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRemove}
            title="Remover do projeto"
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: "0.85rem" }}
          >
            🗑
          </button>
        </div>
      </div>
    </Card>
  );
}

function FornecedoresProjetoContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project } = useProject(eventId);
  const [assignments, setAssignments] = useState<ProjectSupplierAssignment[] | null>(null);
  const [candidates, setCandidates] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSupplierAssignment[]>(`/events/${eventId}/suppliers`, accessToken)
      .then(setAssignments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os fornecedores."));
    apiClient
      .get<Supplier[]>("/knowledge-graph/suppliers", accessToken)
      .then(setCandidates)
      .catch(() => setCandidates([]));
  }, [accessToken, eventId]);

  async function handleAdd(input: { supplierId: string; status: ProjectSupplierStatus; notes: string }) {
    const added = await apiClient.post<ProjectSupplierAssignment>(
      `/events/${eventId}/suppliers`,
      { supplierId: input.supplierId, status: input.status, notes: input.notes || undefined },
      accessToken,
    );
    setAssignments((current) => [...(current ?? []).filter((a) => a.supplierId !== added.supplierId), added]);
  }

  async function handleChangeStatus(supplierId: string, status: ProjectSupplierStatus) {
    const updated = await apiClient.post<ProjectSupplierAssignment>(
      `/events/${eventId}/suppliers`,
      { supplierId, status },
      accessToken,
    );
    setAssignments((current) => (current ?? []).map((a) => (a.supplierId === supplierId ? updated : a)));
  }

  async function handleRemove(supplierId: string) {
    await apiClient.delete(`/events/${eventId}/suppliers/${supplierId}`, accessToken);
    setAssignments((current) => (current ?? []).filter((a) => a.supplierId !== supplierId));
  }

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>Fornecedores do Projeto</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project?.clientNames ?? ""}</p>

      <Card style={{ marginBottom: spacing.lg }}>
        <h3 style={{ marginTop: 0 }}>Adicionar fornecedor</h3>
        {assignments === null ? (
          <p style={{ color: colors.textMuted }}>Reunindo os fornecedores...</p>
        ) : (
          <AddSupplierForm assignments={assignments} candidates={candidates} onAdd={handleAdd} />
        )}
      </Card>

      {assignments === null ? (
        <p style={{ color: colors.textMuted }}>Reunindo os fornecedores...</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Nenhum fornecedor vinculado a este projeto ainda.</p>
      ) : (
        assignments.map((assignment) => (
          <SupplierRow
            key={assignment.supplierId}
            assignment={assignment}
            onChangeStatus={(status) => handleChangeStatus(assignment.supplierId, status)}
            onRemove={() => handleRemove(assignment.supplierId)}
          />
        ))
      )}
    </>
  );
}

export default function FornecedoresProjetoPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <FornecedoresProjetoContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
