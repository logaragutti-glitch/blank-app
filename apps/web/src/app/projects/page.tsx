"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { ProjectSummary } from "../../lib/api-types";

function matches(project: ProjectSummary, query: string): boolean {
  const haystack = `${project.clientNames} ${project.venueName ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

// Real stages derived straight from ProposalStatus (+ "sem proposta ainda")
// — no invented pipeline stage (e.g. "Negociação", "Contrato assinado")
// that the domain model doesn't actually track.
const KANBAN_COLUMNS: { key: string; label: string; match: (p: ProjectSummary) => boolean }[] = [
  { key: "DIAGNOSIS", label: "Diagnóstico", match: (p) => p.latestProposal === null },
  {
    key: "DRAFTING",
    label: "Em elaboração",
    match: (p) => p.latestProposal !== null && ["DRAFT", "INTERNAL_REVIEW", "READY"].includes(p.latestProposal.status),
  },
  { key: "SENT", label: "Proposta enviada", match: (p) => p.latestProposal?.status === "SENT" },
  { key: "APPROVED", label: "Aprovado", match: (p) => p.latestProposal?.status === "APPROVED" },
  { key: "REJECTED", label: "Rejeitado", match: (p) => p.latestProposal?.status === "REJECTED" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: radii.full,
        backgroundColor: colors.border,
        color: colors.textPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.7rem",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function KanbanCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.eventId}`} style={{ textDecoration: "none" }}>
      <Card style={{ marginBottom: spacing.sm }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
          <Avatar name={project.clientNames} />
          <strong style={{ color: colors.textPrimary, fontSize: "0.9rem" }}>{project.clientNames}</strong>
        </div>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem" }}>
          {project.venueName ?? "Espaço não definido"}
        </p>
        {project.latestProposal?.conceptName && (
          <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.8rem", fontStyle: "italic" }}>
            {project.latestProposal.conceptName}
          </p>
        )}
      </Card>
    </Link>
  );
}

function KanbanBoard({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div style={{ display: "flex", gap: spacing.md, overflowX: "auto", paddingBottom: spacing.sm }}>
      {KANBAN_COLUMNS.map((column) => {
        const items = projects.filter(column.match);
        return (
          <div key={column.key} style={{ minWidth: 240, flex: "0 0 240px" }}>
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
              items.map((project) => <KanbanCard key={project.eventId} project={project} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: "list" | "kanban"; onChange: (v: "list" | "kanban") => void }) {
  return (
    <div style={{ display: "flex", gap: spacing.xs }}>
      {(["list", "kanban"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radii.full,
            border: `1px solid ${view === option ? colors.primary : colors.border}`,
            backgroundColor: view === option ? colors.primary : "transparent",
            color: view === option ? "#FFFFFF" : colors.textPrimary,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          {option === "list" ? "Lista" : "Kanban"}
        </button>
      ))}
    </div>
  );
}

function ProjectsContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [view, setView] = useState<"list" | "kanban">("list");

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg, flexWrap: "wrap", gap: spacing.sm }}>
        <Input
          placeholder="Filtrar por casal ou espaço..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 360, flex: "1 1 240px" }}
        />
        <ViewToggle view={view} onChange={setView} />
      </div>

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
      ) : view === "kanban" ? (
        <KanbanBoard projects={filtered} />
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
