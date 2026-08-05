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
import type { TeamMember, User } from "../../../../lib/api-types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function AddMemberForm({
  members,
  candidates,
  onAdd,
}: {
  members: TeamMember[];
  candidates: User[];
  onAdd: (input: { userId: string; role: string }) => Promise<void>;
}) {
  const assignedIds = new Set(members.map((m) => m.userId));
  const available = candidates.filter((c) => !assignedIds.has(c.id));
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId && available.length > 0) setUserId(available[0]!.id);
  }, [available, userId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({ userId, role });
      setRole("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos adicionar à equipe.");
    } finally {
      setSubmitting(false);
    }
  }

  if (candidates.length === 0) {
    return (
      <p style={{ color: colors.textMuted }}>
        Nenhum outro membro da organização ainda. Convide alguém em <Link href="/team">Equipe</Link>.
      </p>
    );
  }

  if (available.length === 0) {
    return <p style={{ color: colors.textMuted }}>Todos os membros da organização já estão neste projeto.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
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
        {available.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </select>
      <Input
        placeholder="Papel (ex: Decoradora, Fotógrafa)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ flex: "1 1 200px" }}
        required
      />
      <Button type="submit" disabled={submitting || !role.trim()}>
        {submitting ? "Adicionando..." : "+ Adicionar"}
      </Button>
      {error && <p style={{ color: colors.danger, margin: 0, width: "100%" }}>{error}</p>}
    </form>
  );
}

function TeamMemberRow({ member, onRemove }: { member: TeamMember; onRemove: () => void }) {
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.full,
              backgroundColor: colors.border,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(member.name)}
          </div>
          <div>
            <strong style={{ color: colors.textPrimary, fontSize: "0.9rem" }}>{member.name}</strong>
            <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem" }}>{member.role}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span style={{ color: colors.textMuted, fontSize: "0.75rem" }}>
            desde {dateFormatter.format(new Date(member.addedAt))}
          </span>
          <button
            type="button"
            onClick={onRemove}
            title="Remover da equipe"
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: "0.85rem" }}
          >
            🗑
          </button>
        </div>
      </div>
    </Card>
  );
}

function EquipeContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project } = useProject(eventId);
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<TeamMember[]>(`/events/${eventId}/team`, accessToken)
      .then(setMembers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a equipe."));
    apiClient
      .get<User[]>("/auth/members", accessToken)
      .then(setCandidates)
      .catch(() => setCandidates([]));
  }, [accessToken, eventId]);

  async function handleAdd(input: { userId: string; role: string }) {
    const added = await apiClient.post<TeamMember>(`/events/${eventId}/team`, input, accessToken);
    setMembers((current) => [...(current ?? []).filter((m) => m.userId !== added.userId), added]);
  }

  async function handleRemove(userId: string) {
    await apiClient.delete(`/events/${eventId}/team/${userId}`, accessToken);
    setMembers((current) => (current ?? []).filter((m) => m.userId !== userId));
  }

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>Equipe do Projeto</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project?.clientNames ?? ""}</p>

      <Card style={{ marginBottom: spacing.lg }}>
        <h3 style={{ marginTop: 0 }}>Adicionar à equipe</h3>
        {members === null ? (
          <p style={{ color: colors.textMuted }}>Reunindo a equipe...</p>
        ) : (
          <AddMemberForm members={members} candidates={candidates} onAdd={handleAdd} />
        )}
      </Card>

      {members === null ? (
        <p style={{ color: colors.textMuted }}>Reunindo a equipe...</p>
      ) : members.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Ninguém foi atribuído a este projeto ainda.</p>
      ) : (
        members.map((member) => (
          <TeamMemberRow key={member.userId} member={member} onRemove={() => handleRemove(member.userId)} />
        ))
      )}
    </>
  );
}

export default function EquipePage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <EquipeContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
