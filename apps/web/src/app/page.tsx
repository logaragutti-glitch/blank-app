"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../components/AppShell";
import { AuthGuard } from "../lib/auth-guard";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { ProjectSummary } from "../lib/api-types";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <Card style={{ flex: "1 1 160px" }}>
      <strong style={{ fontSize: "1.6rem" }}>{value}</strong>
      <p style={{ color: colors.textMuted, margin: 0 }}>{label}</p>
    </Card>
  );
}

/**
 * "Converse com a EVE" — visible in the target dashboard layout, but there's
 * no conversational agent backend yet (today's AI is invoked per-action,
 * e.g. "Gerar diagnóstico"). Shown disabled with an honest label instead of
 * a chat box that goes nowhere — see the "em breve" sidebar items for the
 * same reasoning.
 */
function EveChatTeaser() {
  return (
    <Card style={{ opacity: 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
        <span aria-hidden style={{ fontSize: "1.4rem" }}>
          ✨
        </span>
        <div>
          <strong>Converse com a EVE</strong>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.85rem" }}>
            Chat com a IA em breve — hoje cada etapa (diagnóstico, proposta, produção) já usa IA de verdade
            dentro do próprio projeto.
          </p>
        </div>
      </div>
    </Card>
  );
}

function HomeContent() {
  const { user, accessToken } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar seus projetos."));
  }, [accessToken]);

  if (error) {
    return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  }
  if (!projects) {
    return <p style={{ color: colors.textMuted }}>Reunindo os projetos do seu dia...</p>;
  }

  const inProgress = projects.filter(
    (p) => p.latestProposal && ["DRAFT", "INTERNAL_REVIEW"].includes(p.latestProposal.status),
  ).length;
  const thisWeek = projects.filter((p) => {
    if (!p.ceremonyDateTime) return false;
    const diff = new Date(p.ceremonyDateTime).getTime() - Date.now();
    return diff >= 0 && diff <= ONE_WEEK_MS;
  }).length;
  const awaitingDiagnosis = projects.filter((p) => !p.latestProposal).length;
  const approved = projects.filter((p) => p.latestProposal?.status === "APPROVED").length;

  const withDates = projects
    .filter((p) => p.ceremonyDateTime && new Date(p.ceremonyDateTime).getTime() >= Date.now() - ONE_DAY_MS)
    .sort((a, b) => new Date(a.ceremonyDateTime!).getTime() - new Date(b.ceremonyDateTime!).getTime());
  const upcoming = withDates.slice(0, 4);

  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <>
      <h1 style={{ marginBottom: spacing.xs }}>
        {greeting()}, {user?.name.split(" ")[0]}! ✨
      </h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>Hoje é um ótimo dia para criar memórias inesquecíveis.</p>

      <div style={{ display: "flex", gap: spacing.md, margin: `${spacing.lg} 0 ${spacing.xl}`, flexWrap: "wrap" }}>
        <StatCard value={inProgress} label="propostas em andamento" />
        <StatCard value={thisWeek} label="eventos esta semana" />
        <StatCard value={awaitingDiagnosis} label="aguardando diagnóstico" />
        <StatCard value={approved} label="propostas aprovadas" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: spacing.lg }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ marginBottom: spacing.sm }}>Projetos Recentes</h2>
            <Link href="/projects" style={{ color: colors.primary, fontSize: "0.9rem" }}>
              Ver todos os projetos →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p style={{ color: colors.textMuted }}>
              Nenhum projeto ainda. Que tal <Link href="/projects/new">começar um novo</Link>?
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              {recent.map((project) => (
                <Link key={project.eventId} href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ color: colors.textPrimary }}>{project.clientNames}</strong>
                      <span style={{ color: colors.textMuted, fontSize: "0.85rem" }}>
                        {project.latestProposal?.conceptName ?? "Sem conceito ainda"}
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
          <Card>
            <h3 style={{ marginTop: 0 }}>Agenda</h3>
            {upcoming.length === 0 ? (
              <p style={{ color: colors.textMuted, margin: 0 }}>Nenhum evento com data marcada em breve.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                {upcoming.map((project) => (
                  <Link
                    key={project.eventId}
                    href={`/projects/${project.eventId}`}
                    style={{ textDecoration: "none", display: "flex", gap: spacing.sm, alignItems: "baseline" }}
                  >
                    <span
                      style={{
                        color: colors.primary,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radii.sm,
                        padding: "2px 6px",
                      }}
                    >
                      {dateFormatter.format(new Date(project.ceremonyDateTime!))}
                    </span>
                    <span style={{ color: colors.textPrimary }}>{project.clientNames}</span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/agenda" style={{ color: colors.primary, fontSize: "0.85rem" }}>
              Ver agenda completa →
            </Link>
          </Card>

          <EveChatTeaser />
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <AppShell>
        <HomeContent />
      </AppShell>
    </AuthGuard>
  );
}
