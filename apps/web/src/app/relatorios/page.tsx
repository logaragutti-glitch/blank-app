"use client";

import { useEffect, useState } from "react";
import { Card, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { Client, ProjectSummary } from "../../lib/api-types";
import { EVENT_TYPE_LABEL, PROPOSAL_STATUS_LABEL } from "../../lib/labels";

const LEAD_SOURCE_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FRIEND_REFERRAL: "Indicação de amigos",
  SUPPLIER_REFERRAL: "Indicação de fornecedor",
  OTHER: "Outros",
  NAO_INFORMADO: "Não informado",
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function BarList({ entries, labels }: { entries: [string, number][]; labels: Record<string, string> }) {
  const max = Math.max(1, ...entries.map(([, count]) => count));
  if (entries.length === 0) return <p style={{ color: colors.textMuted }}>Sem dados ainda.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      {entries.map(([key, count]) => (
        <div key={key}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span>{labels[key] ?? key}</span>
            <span style={{ color: colors.textMuted }}>{count}</span>
          </div>
          <div style={{ height: 8, borderRadius: radii.full, backgroundColor: colors.border, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(count / max) * 100}%`,
                backgroundColor: colors.primary,
                borderRadius: radii.full,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLORS = [colors.primary, colors.danger, colors.border];

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <p style={{ color: colors.textMuted }}>Sem dados ainda.</p>;

  let cursor = 0;
  const stops = segments
    .map((segment) => {
      const start = (cursor / total) * 360;
      cursor += segment.value;
      const end = (cursor / total) * 360;
      return `${segment.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing.lg, flexWrap: "wrap" }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: radii.full,
          background: `conic-gradient(${stops})`,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 18,
            borderRadius: radii.full,
            backgroundColor: colors.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          {Math.round(((segments[0]?.value ?? 0) / total) * 100)}%
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        {segments.map((segment) => (
          <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: "0.85rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: radii.full, backgroundColor: segment.color }} />
            <span>{segment.label}</span>
            <span style={{ color: colors.textMuted }}>({segment.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: "1 1 160px" }}>
      <strong style={{ fontSize: "1.6rem" }}>{value}</strong>
      <p style={{ color: colors.textMuted, margin: 0 }}>{label}</p>
    </Card>
  );
}

/**
 * Every metric here is computed client-side from GET /projects + GET
 * /clients (already fetched elsewhere in the app) — no backend change, and
 * critically, no invented KPI: everything traces back to a real field
 * (proposal status, wowScore, event type, ceremonyDateTime, the briefing
 * questionnaire's "como conheceu o trabalho"). Anything the org hasn't
 * collected data for yet (e.g. leadSource on older clients) shows up
 * honestly as "Não informado" instead of being silently excluded.
 */
function RelatoriosContent() {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os relatórios."));
    apiClient
      .get<Client[]>("/clients", accessToken)
      .then(setClients)
      .catch(() => setClients([]));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!projects || !clients) return <p style={{ color: colors.textMuted }}>Reunindo os números...</p>;

  const withProposal = projects.filter((p) => p.latestProposal !== null);
  const approved = withProposal.filter((p) => p.latestProposal?.status === "APPROVED").length;
  const rejected = withProposal.filter((p) => p.latestProposal?.status === "REJECTED").length;
  const approvalRate = approved + rejected > 0 ? `${Math.round((approved / (approved + rejected)) * 100)}%` : "—";

  const wowScores = withProposal
    .map((p) => p.latestProposal?.wowScore)
    .filter((score): score is number => score != null);
  const avgWowScore = wowScores.length > 0 ? String(Math.round(wowScores.reduce((a, b) => a + b, 0) / wowScores.length)) : "—";

  const inProgress = projects.length - approved - rejected;
  const donutSegments = [
    { label: "Aprovadas", value: approved, color: DONUT_COLORS[0]! },
    { label: "Rejeitadas", value: rejected, color: DONUT_COLORS[1]! },
    { label: "Em andamento", value: inProgress, color: DONUT_COLORS[2]! },
  ];

  const statusCounts = countBy(projects, (p) => p.latestProposal?.status ?? "SEM_PROPOSTA");
  const statusEntries = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);
  const statusLabels = { ...PROPOSAL_STATUS_LABEL, SEM_PROPOSTA: "Sem proposta ainda" };

  const typeCounts = countBy(projects, (p) => p.type);
  const typeEntries = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);

  const leadSourceCounts = countBy(clients, (c) => c.additionalDetails?.leadSource ?? "NAO_INFORMADO");
  const leadSourceEntries = [...leadSourceCounts.entries()].sort((a, b) => b[1] - a[1]);

  const now = Date.now();
  const upcoming = projects.filter((p) => p.ceremonyDateTime && new Date(p.ceremonyDateTime).getTime() >= now);
  const monthCounts = countBy(upcoming, (p) => {
    const date = new Date(p.ceremonyDateTime!);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthEntries = [...monthCounts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(0, 6);
  const monthLabels = Object.fromEntries(
    monthEntries.map(([key]) => {
      const parts = key.split("-");
      const year = Number(parts[0] ?? 0);
      const month = Number(parts[1] ?? 1);
      return [key, monthFormatter.format(new Date(year, month - 1, 1))];
    }),
  );

  return (
    <>
      <h1>Relatórios</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Números reais dos seus projetos e clientes — nada aqui é estimado ou inventado.
      </p>

      <div style={{ display: "flex", gap: spacing.md, margin: `${spacing.lg} 0 ${spacing.xl}`, flexWrap: "wrap" }}>
        <StatCard value={String(projects.length)} label="projetos no total" />
        <StatCard value={approvalRate} label="taxa de aprovação" />
        <StatCard value={avgWowScore} label="WOW Score médio" />
        <StatCard value={String(clients.length)} label="clientes cadastrados" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Situação das propostas</h3>
          <DonutChart segments={donutSegments} />
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Funil de propostas</h3>
          <BarList entries={statusEntries} labels={statusLabels} />
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Eventos por tipo</h3>
          <BarList entries={typeEntries} labels={EVENT_TYPE_LABEL} />
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Como os clientes conheceram o trabalho</h3>
          <BarList entries={leadSourceEntries} labels={LEAD_SOURCE_LABEL} />
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Eventos futuros por mês</h3>
          <BarList entries={monthEntries} labels={monthLabels} />
        </Card>
      </div>
    </>
  );
}

export default function RelatoriosPage() {
  return (
    <AuthGuard>
      <AppShell>
        <RelatoriosContent />
      </AppShell>
    </AuthGuard>
  );
}
