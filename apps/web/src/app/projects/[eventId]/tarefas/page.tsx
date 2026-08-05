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
import type { ProjectTask, ProjectTaskStatus, User } from "../../../../lib/api-types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

// Real stages the backend actually tracks (ProjectTaskStatus) — no
// invented pipeline stage on top of it.
const STATUS_COLUMNS: { key: ProjectTaskStatus; label: string }[] = [
  { key: "TODO", label: "A fazer" },
  { key: "IN_PROGRESS", label: "Em andamento" },
  { key: "DONE", label: "Concluída" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function CreateTaskForm({
  members,
  onCreate,
}: {
  members: User[];
  onCreate: (input: { title: string; description: string; dueDate: string; assigneeUserId: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ title, description, dueDate, assigneeUserId });
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssigneeUserId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos criar a tarefa.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <h3 style={{ marginTop: 0 }}>Nova tarefa</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
        <Input placeholder="O que precisa ser feito?" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input
          placeholder="Detalhes (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ flex: "1 1 160px" }}
          />
          <select
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(e.target.value)}
            style={{
              flex: "1 1 200px",
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: "0.95rem",
            }}
          >
            <option value="">Sem responsável</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? "Adicionando..." : "+ Adicionar tarefa"}
        </Button>
      </form>
    </Card>
  );
}

function TaskCard({
  task,
  assigneeName,
  onMove,
  onDelete,
}: {
  task: ProjectTask;
  assigneeName: string | null;
  onMove: (status: ProjectTaskStatus) => void;
  onDelete: () => void;
}) {
  const columnIndex = STATUS_COLUMNS.findIndex((c) => c.key === task.status);
  const previous = STATUS_COLUMNS[columnIndex - 1];
  const next = STATUS_COLUMNS[columnIndex + 1];

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <strong style={{ color: colors.textPrimary, fontSize: "0.9rem" }}>{task.title}</strong>
      {task.description && (
        <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.8rem" }}>
          {task.description}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" }}>
        {task.dueDate && (
          <span style={{ color: colors.textMuted, fontSize: "0.75rem" }}>
            📅 {dateFormatter.format(new Date(task.dueDate))}
          </span>
        )}
        {assigneeName && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: colors.textMuted,
              fontSize: "0.75rem",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: radii.full,
                backgroundColor: colors.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              {initials(assigneeName)}
            </span>
            {assigneeName}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.sm }}>
        <div style={{ display: "flex", gap: spacing.xs }}>
          {previous && (
            <button
              type="button"
              onClick={() => onMove(previous.key)}
              title={`Mover para "${previous.label}"`}
              style={{ ...moveButtonStyle }}
            >
              ←
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => onMove(next.key)}
              title={`Mover para "${next.label}"`}
              style={{ ...moveButtonStyle }}
            >
              →
            </button>
          )}
        </div>
        <button type="button" onClick={onDelete} title="Excluir tarefa" style={{ ...moveButtonStyle, color: colors.danger }}>
          🗑
        </button>
      </div>
    </Card>
  );
}

const moveButtonStyle = {
  background: "none",
  border: `1px solid ${colors.border}`,
  borderRadius: radii.sm,
  color: colors.textMuted,
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: "2px 8px",
};

function TarefasContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project } = useProject(eventId);
  const [tasks, setTasks] = useState<ProjectTask[] | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectTask[]>(`/events/${eventId}/tasks`, accessToken)
      .then(setTasks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar as tarefas."));
    apiClient
      .get<User[]>("/auth/members", accessToken)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [accessToken, eventId]);

  async function handleCreate(input: { title: string; description: string; dueDate: string; assigneeUserId: string }) {
    const created = await apiClient.post<ProjectTask>(
      `/events/${eventId}/tasks`,
      {
        title: input.title,
        description: input.description || undefined,
        dueDate: input.dueDate || undefined,
        assigneeUserId: input.assigneeUserId || undefined,
      },
      accessToken,
    );
    setTasks((current) => [...(current ?? []), created]);
  }

  async function handleMove(taskId: string, status: ProjectTaskStatus) {
    const updated = await apiClient.patch<ProjectTask>(`/events/${eventId}/tasks/${taskId}`, { status }, accessToken);
    setTasks((current) => (current ?? []).map((t) => (t.id === taskId ? updated : t)));
  }

  async function handleDelete(taskId: string) {
    await apiClient.delete(`/events/${eventId}/tasks/${taskId}`, accessToken);
    setTasks((current) => (current ?? []).filter((t) => t.id !== taskId));
  }

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>Tarefas do Projeto</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project?.clientNames ?? ""}</p>

      <CreateTaskForm members={members} onCreate={handleCreate} />

      {tasks === null ? (
        <p style={{ color: colors.textMuted }}>Reunindo as tarefas...</p>
      ) : (
        <div style={{ display: "flex", gap: spacing.md, overflowX: "auto", paddingBottom: spacing.sm }}>
          {STATUS_COLUMNS.map((column) => {
            const items = tasks.filter((t) => t.status === column.key);
            return (
              <div key={column.key} style={{ minWidth: 260, flex: "0 0 260px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: colors.textMuted,
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: spacing.sm,
                    padding: `0 ${spacing.xs}`,
                  }}
                >
                  <span>{column.label}</span>
                  <span>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: "0.8rem", padding: `0 ${spacing.xs}` }}>—</p>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={members.find((m) => m.id === task.assigneeUserId)?.name ?? null}
                      onMove={(status) => handleMove(task.id, status)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function TarefasPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <TarefasContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
