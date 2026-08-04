"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { ProjectSummary } from "../../lib/api-types";

function matches(project: ProjectSummary, query: string): boolean {
  const haystack = `${project.clientNames} ${project.venueName ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function ProjectsContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar seus projetos."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!projects) return <p style={{ color: colors.textMuted }}>Reunindo seus projetos...</p>;

  const filtered = query.trim() ? projects.filter((p) => matches(p, query.trim())) : projects;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.md }}>
        <h1 style={{ margin: 0 }}>Projetos</h1>
        <Link href="/projects/new">
          <Button>✨ Criar Novo Projeto</Button>
        </Link>
      </div>
      <Input
        placeholder="Filtrar por casal ou espaço..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: spacing.lg, maxWidth: 360 }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: colors.textMuted }}>
          {projects.length === 0 ? (
            <>
              Nenhum projeto ainda. Que tal <Link href="/projects/new">começar um novo</Link>?
            </>
          ) : (
            "Nenhum projeto encontrado para essa busca."
          )}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {filtered.map((project) => (
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

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <ProjectsContent />
      </AppShell>
    </AuthGuard>
  );
}
