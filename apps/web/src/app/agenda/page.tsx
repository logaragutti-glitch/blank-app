"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { ProjectSummary } from "../../lib/api-types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * A real chronological view of every event's ceremonyDateTime — no separate
 * calendar/scheduling entity exists yet, so this is derived entirely from
 * GET /projects rather than a dedicated Agenda backend module.
 */
function AgendaContent() {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a agenda."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!projects) return <p style={{ color: colors.textMuted }}>Reunindo os eventos...</p>;

  const now = Date.now();
  const past = projects
    .filter((p) => p.ceremonyDateTime && new Date(p.ceremonyDateTime).getTime() < now - ONE_DAY_MS)
    .sort((a, b) => new Date(b.ceremonyDateTime!).getTime() - new Date(a.ceremonyDateTime!).getTime());
  const upcoming = projects
    .filter((p) => p.ceremonyDateTime && new Date(p.ceremonyDateTime).getTime() >= now - ONE_DAY_MS)
    .sort((a, b) => new Date(a.ceremonyDateTime!).getTime() - new Date(b.ceremonyDateTime!).getTime());
  const withoutDate = projects.filter((p) => !p.ceremonyDateTime);

  return (
    <>
      <h1>Agenda</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Datas de cerimônia de todos os projetos, dos mais próximos aos mais distantes.
      </p>

      <h2>Próximos</h2>
      {upcoming.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Nenhum evento com data marcada por vir.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.lg }}>
          {upcoming.map((project) => (
            <Link key={project.eventId} href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ color: colors.textPrimary }}>{project.clientNames}</strong>
                  <span
                    style={{
                      color: colors.primary,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radii.sm,
                      padding: "2px 6px",
                      textTransform: "capitalize",
                    }}
                  >
                    {dateFormatter.format(new Date(project.ceremonyDateTime!))}
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

      {past.length > 0 && (
        <>
          <h2>Já realizados</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.lg }}>
            {past.map((project) => (
              <Link key={project.eventId} href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
                <Card style={{ opacity: 0.7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong style={{ color: colors.textPrimary }}>{project.clientNames}</strong>
                    <span style={{ color: colors.textMuted, fontSize: "0.8rem", textTransform: "capitalize" }}>
                      {dateFormatter.format(new Date(project.ceremonyDateTime!))}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {withoutDate.length > 0 && (
        <>
          <h2>Sem data definida</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {withoutDate.map((project) => (
              <Link key={project.eventId} href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
                <Card>
                  <strong style={{ color: colors.textPrimary }}>{project.clientNames}</strong>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function AgendaPage() {
  return (
    <AuthGuard>
      <AppShell>
        <AgendaContent />
      </AppShell>
    </AuthGuard>
  );
}
