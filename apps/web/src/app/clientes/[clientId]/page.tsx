"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import type { Client, ClientInteraction, ClientInteractionType, ProjectSummary } from "../../../lib/api-types";

function clientName(client: Client): string {
  return [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ");
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

const INTERACTION_TYPE_LABEL: Record<ClientInteractionType, string> = {
  CALL: "📞 Ligação",
  MEETING: "🤝 Reunião",
  EMAIL: "✉️ E-mail",
  WHATSAPP: "💬 WhatsApp",
  MILESTONE: "🎉 Marco",
  NOTE: "📝 Nota",
  OTHER: "Outro",
};

const INTERACTION_TYPE_OPTIONS = Object.keys(INTERACTION_TYPE_LABEL) as ClientInteractionType[];

function LogInteractionForm({
  onCreate,
}: {
  onCreate: (input: { type: ClientInteractionType; occurredAt: string; notes: string }) => Promise<void>;
}) {
  const [type, setType] = useState<ClientInteractionType>("CALL");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ type, occurredAt, notes });
      setNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos registrar a interação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ClientInteractionType)}
          style={{
            flex: "1 1 160px",
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: "0.95rem",
          }}
        >
          {INTERACTION_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {INTERACTION_TYPE_LABEL[option]}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          style={{ flex: "1 1 160px" }}
          required
        />
      </div>
      <Input placeholder="O que aconteceu?" value={notes} onChange={(e) => setNotes(e.target.value)} required />
      {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
      <Button type="submit" disabled={submitting || !notes.trim()}>
        {submitting ? "Registrando..." : "+ Registrar interação"}
      </Button>
    </form>
  );
}

function InteractionTimeline({
  interactions,
  onDelete,
}: {
  interactions: ClientInteraction[];
  onDelete: (id: string) => void;
}) {
  if (interactions.length === 0) {
    return <p style={{ color: colors.textMuted }}>Nenhuma interação registrada ainda.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
      {interactions.map((interaction) => (
        <div key={interaction.id} style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: radii.full,
                backgroundColor: colors.primary,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <span style={{ flex: 1, width: 1, backgroundColor: colors.border }} />
          </div>
          <div style={{ paddingBottom: spacing.sm, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: "0.9rem" }}>{INTERACTION_TYPE_LABEL[interaction.type]}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                <span style={{ color: colors.textMuted, fontSize: "0.8rem" }}>
                  {dateTimeFormatter.format(new Date(interaction.occurredAt))}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(interaction.id)}
                  title="Excluir"
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.textMuted,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
            <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.9rem" }}>
              {interaction.notes}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientDetailContent({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [interactions, setInteractions] = useState<ClientInteraction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Client>(`/clients/${clientId}`, accessToken)
      .then(setClient)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setClient(null);
        } else {
          setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o cliente.");
        }
      });
    // Reuses GET /projects (already returns clientId per event) instead of a
    // dedicated "events for this client" endpoint — one less read model to
    // keep in sync with ProjectsController's own event→client join.
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then((all) => setProjects(all.filter((p) => p.clientId === clientId)))
      .catch(() => setProjects([]));
    apiClient
      .get<ClientInteraction[]>(`/clients/${clientId}/interactions`, accessToken)
      .then(setInteractions)
      .catch(() => setInteractions([]));
  }, [accessToken, clientId]);

  async function handleCreateInteraction(input: { type: ClientInteractionType; occurredAt: string; notes: string }) {
    const created = await apiClient.post<ClientInteraction>(
      `/clients/${clientId}/interactions`,
      input,
      accessToken,
    );
    setInteractions((current) => [created, ...(current ?? [])]);
  }

  async function handleDeleteInteraction(interactionId: string) {
    await apiClient.delete(`/clients/${clientId}/interactions/${interactionId}`, accessToken);
    setInteractions((current) => (current ?? []).filter((i) => i.id !== interactionId));
  }

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (client === undefined) return <p style={{ color: colors.textMuted }}>Reunindo os dados do cliente...</p>;
  if (client === null) return <p style={{ color: colors.danger }}>Cliente não encontrado.</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href="/clientes" style={{ color: colors.textMuted }}>
          ← Voltar para Clientes
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>{clientName(client)}</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        {[client.email, client.phone, client.city].filter(Boolean).join(" · ") || "Sem dados de contato"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: spacing.lg, marginTop: spacing.lg }}>
        <div>
          <h2 style={{ marginBottom: spacing.sm }}>Projetos</h2>
          {projects === null ? (
            <p style={{ color: colors.textMuted }}>Reunindo os projetos...</p>
          ) : projects.length === 0 ? (
            <p style={{ color: colors.textMuted }}>Nenhum projeto ainda para este cliente.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              {projects.map((project) => (
                <Link key={project.eventId} href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ color: colors.textPrimary }}>
                        {project.latestProposal?.conceptName ?? "Sem conceito ainda"}
                      </strong>
                      <span style={{ color: colors.textMuted, fontSize: "0.85rem" }}>
                        {project.latestProposal?.status ?? "Sem proposta"}
                      </span>
                    </div>
                    <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0` }}>
                      {project.venueName ?? "Espaço não definido"}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Timeline de Interações</h2>
          <Card style={{ marginBottom: spacing.md }}>
            <LogInteractionForm onCreate={handleCreateInteraction} />
          </Card>
          {interactions === null ? (
            <p style={{ color: colors.textMuted }}>Reunindo as interações...</p>
          ) : (
            <InteractionTimeline interactions={interactions} onDelete={handleDeleteInteraction} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {(client.howTheyMet || client.proposalStory) && (
            <Card>
              <h3 style={{ marginTop: 0 }}>História</h3>
              {client.howTheyMet && (
                <p style={{ color: colors.textMuted, margin: `0 0 ${spacing.sm}` }}>{client.howTheyMet}</p>
              )}
              {client.proposalStory && <p style={{ color: colors.textMuted, margin: 0 }}>{client.proposalStory}</p>}
            </Card>
          )}

          {client.lifestyleTags.length > 0 && (
            <Card>
              <h3 style={{ marginTop: 0 }}>Estilo</h3>
              <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
                {client.lifestyleTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: `${spacing.xs} ${spacing.md}`,
                      borderRadius: 9999,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <ClientDetailContent clientId={params.clientId} />
      </AppShell>
    </AuthGuard>
  );
}
