"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../components/AppShell";
import { AuthGuard } from "../lib/auth-guard";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { ProjectSummary } from "../lib/api-types";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
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

  return (
    <>
      <h1 style={{ marginBottom: spacing.xs }}>
        {greeting()}, {user?.name.split(" ")[0]}.
      </h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>Você possui:</p>
      <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.xl, flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 160px" }}>
          <strong style={{ fontSize: "1.6rem" }}>{inProgress}</strong>
          <p style={{ color: colors.textMuted, margin: 0 }}>propostas em andamento</p>
        </Card>
        <Card style={{ flex: "1 1 160px" }}>
          <strong style={{ fontSize: "1.6rem" }}>{thisWeek}</strong>
          <p style={{ color: colors.textMuted, margin: 0 }}>eventos esta semana</p>
        </Card>
        <Card style={{ flex: "1 1 160px" }}>
          <strong style={{ fontSize: "1.6rem" }}>{awaitingDiagnosis}</strong>
          <p style={{ color: colors.textMuted, margin: 0 }}>aguardando diagnóstico</p>
        </Card>
      </div>

      <h2>Seus projetos</h2>
      {projects.length === 0 ? (
        <p style={{ color: colors.textMuted }}>
          Nenhum projeto ainda. Que tal <Link href="/projects/new">começar um novo</Link>?
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {projects.map((project) => (
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
