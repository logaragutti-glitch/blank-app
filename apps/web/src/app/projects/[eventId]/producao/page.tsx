"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AiThought } from "../../../../components/AiThought";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useLatestProposalId } from "../../../../lib/use-latest-proposal-id";
import type { BudgetAnalysis, ProductionPlan } from "../../../../lib/api-types";

const THOUGHTS = [
  "Estou calculando as quantidades de materiais para o número de convidados...",
  "Estou organizando a montagem e desmontagem do dia do evento...",
  "🧰 Materiais  🗓️ Cronograma  ✅ Checklist",
  "Estou montando o checklist operacional...",
];

const BUDGET_THOUGHTS = [
  "Estou estimando as quantidades de materiais para o orçamento...",
  "Estou comparando fornecedores por categoria...",
  "💰 Custos  📊 Margem  🤝 Fornecedores",
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ProducaoContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { proposalId, proposalStatus, error: proposalError } = useLatestProposalId(eventId);
  const [plan, setPlan] = useState<ProductionPlan | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null | undefined>(undefined);
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    apiClient
      .get<ProductionPlan>(`/production/proposals/${proposalId}/plan`, accessToken)
      .then(setPlan)
      .catch((err) => {
        // No plan generated yet is an expected state, not an error to surface.
        if (err instanceof ApiError && err.status === 400) {
          setPlan(null);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o plano de produção.");
      });
  }, [accessToken, proposalId]);

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    apiClient
      .get<BudgetAnalysis>(`/production/proposals/${proposalId}/budget-analysis`, accessToken)
      .then(setBudgetAnalysis)
      .catch((err) => {
        // No analysis generated yet is an expected state, not an error to surface.
        if (err instanceof ApiError && err.status === 400) {
          setBudgetAnalysis(null);
          return;
        }
        setBudgetError(err instanceof ApiError ? err.message : "Não conseguimos carregar a análise financeira.");
      });
  }, [accessToken, proposalId]);

  async function handleGenerate() {
    if (!proposalId) return;
    setError(null);
    setGenerating(true);
    try {
      const result = await apiClient.post<ProductionPlan>(
        `/production/proposals/${proposalId}/plan`,
        undefined,
        accessToken,
      );
      setPlan(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Encontrei um ponto que merece atenção: ${err.message}`
          : "Não consegui gerar o plano de produção agora.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateBudget() {
    if (!proposalId) return;
    setBudgetError(null);
    setGeneratingBudget(true);
    try {
      const result = await apiClient.post<BudgetAnalysis>(
        `/production/proposals/${proposalId}/budget-analysis`,
        undefined,
        accessToken,
      );
      setBudgetAnalysis(result);
    } catch (err) {
      setBudgetError(
        err instanceof ApiError
          ? `Encontrei um ponto que merece atenção: ${err.message}`
          : "Não consegui gerar a análise financeira agora.",
      );
    } finally {
      setGeneratingBudget(false);
    }
  }

  if (proposalError) return <p style={{ color: colors.danger }}>{proposalError}</p>;
  if (proposalId === undefined) return <p style={{ color: colors.textMuted }}>Reunindo a proposta...</p>;
  if (proposalId === null) {
    return (
      <p style={{ color: colors.textMuted }}>
        Ainda não há um diagnóstico para este projeto —{" "}
        <Link href={`/projects/${eventId}/diagnostico`}>gere um primeiro</Link>.
      </p>
    );
  }

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1>Produção</h1>

      {generating && <AiThought thoughts={THOUGHTS} />}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!generating && plan === undefined && (
        <p style={{ color: colors.textMuted }}>Reunindo o plano de produção já gerado...</p>
      )}

      {!generating && plan === null && proposalStatus !== undefined && proposalStatus !== "APPROVED" && (
        <Card>
          <p>
            Essa proposta ainda não foi aprovada pelo cliente — o plano de produção só pode ser gerado
            depois da aprovação.
          </p>
          <Link href={`/projects/${eventId}/proposta`}>
            <Button>Ir para a proposta</Button>
          </Link>
        </Card>
      )}

      {!generating && plan === null && (proposalStatus === undefined || proposalStatus === "APPROVED") && (
        <Card>
          <p>Ainda não geramos a lista de materiais, o cronograma de montagem e o checklist deste projeto.</p>
          <Button onClick={handleGenerate}>Gerar plano de produção</Button>
        </Card>
      )}

      {!generating && plan && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing.md }}>
            <Button variant="ghost" onClick={handleGenerate}>
              Gerar novamente
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <Card>
              <h3 style={{ marginTop: 0 }}>Lista de materiais</h3>
              {plan.materialsList.length === 0 ? (
                <p style={{ color: colors.textMuted }}>—</p>
              ) : (
                <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
                  {plan.materialsList.map((item) => (
                    <li key={item.name} style={{ marginBottom: spacing.sm }}>
                      <strong>{item.name}</strong> — {item.quantity}
                      {item.notes && (
                        <p style={{ color: colors.textMuted, margin: 0 }}>{item.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h3 style={{ marginTop: 0 }}>Cronograma de montagem</h3>
              {plan.setupSchedule.length === 0 ? (
                <p style={{ color: colors.textMuted }}>—</p>
              ) : (
                <ol style={{ paddingLeft: spacing.lg, margin: 0 }}>
                  {plan.setupSchedule.map((step) => (
                    <li key={step.label} style={{ marginBottom: spacing.sm }}>
                      <strong>{step.label}</strong>
                      <p style={{ color: colors.textMuted, margin: 0 }}>
                        {step.timing} · {step.durationEstimate}
                      </p>
                      <p style={{ color: colors.textMuted, margin: 0 }}>{step.description}</p>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card>
              <h3 style={{ marginTop: 0 }}>Checklist operacional</h3>
              {plan.checklist.length === 0 ? (
                <p style={{ color: colors.textMuted }}>—</p>
              ) : (
                <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
                  {plan.checklist.map((item) => (
                    <li key={item.label} style={{ marginBottom: spacing.sm }}>
                      <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
                        {item.category}
                      </p>
                      <strong>{item.label}</strong>
                      {item.description && (
                        <p style={{ color: colors.textMuted, margin: 0 }}>{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      <h2 style={{ marginTop: spacing.xl }}>Análise financeira</h2>

      {generatingBudget && <AiThought thoughts={BUDGET_THOUGHTS} />}
      {budgetError && <p style={{ color: colors.danger }}>{budgetError}</p>}

      {!generatingBudget && budgetAnalysis === undefined && (
        <p style={{ color: colors.textMuted }}>Reunindo a análise financeira já gerada...</p>
      )}

      {!generatingBudget &&
        budgetAnalysis === null &&
        proposalStatus !== undefined &&
        proposalStatus !== "APPROVED" && (
          <Card>
            <p>
              Essa proposta ainda não foi aprovada pelo cliente — a análise financeira só pode ser gerada
              depois da aprovação.
            </p>
            <Link href={`/projects/${eventId}/proposta`}>
              <Button>Ir para a proposta</Button>
            </Link>
          </Card>
        )}

      {!generatingBudget &&
        budgetAnalysis === null &&
        (proposalStatus === undefined || proposalStatus === "APPROVED") && (
          <Card>
            <p>
              Ainda não geramos a análise de custos, margem e melhores fornecedores deste projeto, com base no
              catálogo de materiais e fornecedores com custo conhecido.
            </p>
            <Button onClick={handleGenerateBudget}>Gerar análise financeira</Button>
          </Card>
        )}

      {!generatingBudget && budgetAnalysis && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing.md }}>
            <Button variant="ghost" onClick={handleGenerateBudget}>
              Gerar novamente
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {budgetAnalysis.hasIncompleteData && (
              <p style={{ color: colors.textMuted }}>
                Nem todos os materiais ou fornecedores usados neste projeto têm um custo cadastrado ainda — esta
                análise reflete apenas os itens com custo conhecido no catálogo.
              </p>
            )}

            <Card>
              <h3 style={{ marginTop: 0 }}>Resumo</h3>
              <p style={{ margin: 0 }}>
                Custo estimado de materiais: <strong>{currencyFormatter.format(budgetAnalysis.materialsCost)}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Custo estimado de fornecedores: <strong>{currencyFormatter.format(budgetAnalysis.suppliersCost)}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Custo total estimado:{" "}
                <strong>{currencyFormatter.format(budgetAnalysis.totalEstimatedCost)}</strong>
              </p>
              {budgetAnalysis.margin !== null && (
                <p style={{ margin: 0 }}>
                  Margem estimada: <strong>{currencyFormatter.format(budgetAnalysis.margin)}</strong>
                </p>
              )}
              {budgetAnalysis.fitsBudget !== null && (
                <p style={{ color: budgetAnalysis.fitsBudget ? colors.textPrimary : colors.danger, margin: 0 }}>
                  {budgetAnalysis.fitsBudget ? "Cabe no orçamento do evento." : "Não cabe no orçamento do evento."}
                </p>
              )}
            </Card>

            <Card>
              <h3 style={{ marginTop: 0 }}>Materiais</h3>
              {budgetAnalysis.lineItems.length === 0 ? (
                <p style={{ color: colors.textMuted }}>—</p>
              ) : (
                <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
                  {budgetAnalysis.lineItems.map((item) => (
                    <li key={item.materialName} style={{ marginBottom: spacing.sm }}>
                      <strong>{item.materialName}</strong> — {item.estimatedQuantity}x{" "}
                      {currencyFormatter.format(item.unitCost)} = {currencyFormatter.format(item.lineTotal)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h3 style={{ marginTop: 0 }}>Melhor custo-benefício por categoria</h3>
              {budgetAnalysis.bestValueSuppliers.length === 0 ? (
                <p style={{ color: colors.textMuted }}>—</p>
              ) : (
                <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
                  {budgetAnalysis.bestValueSuppliers.map((supplier) => (
                    <li key={supplier.supplierId} style={{ marginBottom: spacing.sm }}>
                      <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
                        {supplier.category}
                      </p>
                      <strong>{supplier.supplierName}</strong> — {currencyFormatter.format(supplier.estimatedCost)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

export default function ProducaoPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <ProducaoContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
