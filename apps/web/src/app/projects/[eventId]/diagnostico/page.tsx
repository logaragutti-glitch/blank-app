"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AiThought } from "../../../../components/AiThought";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import type { Proposal } from "../../../../lib/api-types";

const THOUGHTS = [
  "Estou conectando as inspirações e procurando a essência deste evento...",
  "Estou identificando padrões de estilo e emoção...",
  "🌿 Natural  ✨ Elegância  🤍 Romance",
  "Estou verificando a compatibilidade com o espaço escolhido...",
];

function DiagnosticoContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadLatest() {
    if (!accessToken) return;
    apiClient
      .get<Proposal[]>(`/creative/${eventId}/proposals`, accessToken)
      .then((proposals) => setProposal(proposals[0] ?? null))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o diagnóstico."));
  }

  useEffect(loadLatest, [accessToken, eventId]);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const result = await apiClient.post<Proposal>(
        `/creative/${eventId}/diagnostico-criativo`,
        undefined,
        accessToken,
      );
      setProposal(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Encontrei um ponto que merece atenção: ${err.message}`
          : "Não consegui gerar o diagnóstico agora.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1>Diagnóstico Criativo</h1>

      {generating && <AiThought thoughts={THOUGHTS} />}

      {!generating && proposal === undefined && (
        <p style={{ color: colors.textMuted }}>Reunindo o que já sabemos deste projeto...</p>
      )}

      {!generating && proposal === null && (
        <Card>
          <p>Ainda não interpretamos o briefing deste casal.</p>
          <Button onClick={handleGenerate}>Gerar diagnóstico criativo</Button>
        </Card>
      )}

      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!generating && proposal && (
        <>
          <Card>
            <p style={{ margin: 0 }}>
              <em>{proposal.diagnosticoCriativo.perfilCasal}</em>
            </p>
            <p style={{ color: colors.textMuted }}>{proposal.diagnosticoCriativo.atmosferaDesejada}</p>

            <h3>Estilo predominante</h3>
            <p>{proposal.diagnosticoCriativo.estiloPredominante}</p>

            <h3>Paleta sugerida</h3>
            <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
              {proposal.diagnosticoCriativo.paletaSugerida.map((color) => (
                <span
                  key={color}
                  style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: 9999,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                >
                  {color}
                </span>
              ))}
            </div>

            <h3>Mobiliário sugerido</h3>
            <p>{proposal.diagnosticoCriativo.mobiliarioSugerido.join(", ") || "—"}</p>

            <h3>Iluminação</h3>
            <p>{proposal.diagnosticoCriativo.iluminacaoSugerida}</p>

            <h3>Materiais recomendados</h3>
            <p>{proposal.diagnosticoCriativo.materiaisRecomendados.join(", ") || "—"}</p>

            <h3>Compatibilidade com o espaço</h3>
            <p style={{ color: colors.textMuted }}>{proposal.diagnosticoCriativo.compatibilidadeComEspaco}</p>

            <h3>Justificativa</h3>
            <p style={{ color: colors.textMuted }}>{proposal.diagnosticoCriativo.justificativa}</p>

            {proposal.wowScore !== null && (
              <p style={{ color: colors.textMuted }}>WOW Score interno: {proposal.wowScore}</p>
            )}
          </Card>

          <div style={{ marginTop: spacing.lg }}>
            <Link href={`/projects/${eventId}/editor`}>
              <Button>Continuar para o Editor do Projeto</Button>
            </Link>
          </div>
        </>
      )}
    </>
  );
}

export default function DiagnosticoPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <DiagnosticoContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
