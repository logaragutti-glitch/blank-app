"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import type { Client, ProjectSummary } from "../../../lib/api-types";

function clientName(client: Client): string {
  return [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ");
}

function ClientDetailContent({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
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
  }, [accessToken, clientId]);

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
