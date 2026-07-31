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
import type { ProductionPlan } from "../../../../lib/api-types";

const THOUGHTS = [
  "Estou calculando as quantidades de materiais para o número de convidados...",
  "Estou organizando a montagem e desmontagem do dia do evento...",
  "🧰 Materiais  🗓️ Cronograma  ✅ Checklist",
  "Estou montando o checklist operacional...",
];

function ProducaoContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { proposalId, error: proposalError } = useLatestProposalId(eventId);
  const [plan, setPlan] = useState<ProductionPlan | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {!generating && plan === null && (
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
