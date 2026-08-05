"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { FinancialSummary } from "../../lib/api-types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function money(value: number): string {
  return currencyFormatter.format(value);
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: "1 1 200px" }}>
      <strong style={{ fontSize: "1.4rem" }}>{value}</strong>
      <p style={{ color: colors.textMuted, margin: 0 }}>{label}</p>
    </Card>
  );
}

function FitBadge({ fitsBudget }: { fitsBudget: boolean | null }) {
  if (fitsBudget === null) return <span style={{ color: colors.textMuted }}>—</span>;
  return (
    <span style={{ color: fitsBudget ? colors.primary : colors.danger }}>
      {fitsBudget ? "Dentro do orçamento" : "Acima do orçamento"}
    </span>
  );
}

/**
 * Every number here traces back to a real field: Event.budgetAmount (o
 * casal informa no briefing) e BudgetAnalysis.totalEstimatedCost (Agente 4
 * calcula sob demanda na tela de Produção). Não existe uma métrica de
 * "receita confirmada" — Proposal.investmentAmount está no modelo de
 * domínio mas nenhuma tela do sistema ainda o preenche, então usá-lo
 * mostraria sempre zero e enganaria em vez de informar.
 */
function FinanceiroContent() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<FinancialSummary>("/production/financial-summary", accessToken)
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o financeiro."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!summary) return <p style={{ color: colors.textMuted }}>Reunindo os números...</p>;

  return (
    <>
      <h1>Financeiro</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Orçamento declarado pelos clientes e custo estimado pela IA — nenhum valor aqui é inventado.
      </p>

      <div style={{ display: "flex", gap: spacing.md, margin: `${spacing.lg} 0 ${spacing.xl}`, flexWrap: "wrap" }}>
        <StatCard value={money(summary.totalBudgetAmount)} label={`orçamento declarado (${summary.eventsWithBudget} projetos)`} />
        <StatCard
          value={money(summary.totalEstimatedCost)}
          label={`custo estimado (${summary.eventsWithBudgetAnalysis} análises geradas)`}
        />
        <StatCard value={String(summary.fitsBudgetCount)} label="projetos dentro do orçamento" />
        <StatCard value={String(summary.overBudgetCount)} label="projetos acima do orçamento" />
      </div>

      <h2>Por projeto</h2>
      {summary.projects.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Nenhum projeto ainda.</p>
      ) : (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Cliente</th>
                <th style={{ padding: spacing.sm }}>Orçamento declarado</th>
                <th style={{ padding: spacing.sm }}>Custo estimado</th>
                <th style={{ padding: spacing.sm }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {summary.projects.map((project) => (
                <tr key={project.eventId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <Link href={`/projects/${project.eventId}`}>{project.clientNames}</Link>
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    {project.budgetAmount != null ? money(project.budgetAmount) : "—"}
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    {project.totalEstimatedCost != null ? money(project.totalEstimatedCost) : "Não gerado ainda"}
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    <FitBadge fitsBudget={project.fitsBudget} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

export default function FinanceiroPage() {
  return (
    <AuthGuard>
      <AppShell>
        <FinanceiroContent />
      </AppShell>
    </AuthGuard>
  );
}
