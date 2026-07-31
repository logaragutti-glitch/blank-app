"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import type { ProposalComponent } from "@eve-os/types";
import { AppShell } from "../../../../components/AppShell";
import { AiThought } from "../../../../components/AiThought";
import { ProposalComponentCard } from "../../../../components/ProposalComponentCard";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useLatestProposalId } from "../../../../lib/use-latest-proposal-id";

const THOUGHTS = [
  "Estou nomeando o conceito deste projeto...",
  "Estou desenhando cada ambiente com a história do casal em mente...",
  "🕯️ Velas  🌸 Flores delicadas  🏛️ Arquitetura",
  "Estou montando o moodboard...",
];

function EditorContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { proposalId, error: proposalError } = useLatestProposalId(eventId);
  const [components, setComponents] = useState<ProposalComponent[] | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderingImage, setRenderingImage] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    apiClient
      .get<ProposalComponent[]>(`/creative/proposals/${proposalId}/components`, accessToken)
      .then((result) => setComponents(result.length > 0 ? result : null))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os componentes."));
  }, [accessToken, proposalId]);

  async function handleGenerate() {
    if (!proposalId) return;
    setError(null);
    setGenerating(true);
    try {
      const result = await apiClient.post<ProposalComponent[]>(
        `/creative/proposals/${proposalId}/components`,
        undefined,
        accessToken,
      );
      setComponents(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Encontrei um ponto que merece atenção: ${err.message}`
          : "Não consegui gerar os componentes agora.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateRender() {
    if (!proposalId) return;
    setRenderError(null);
    setRenderingImage(true);
    try {
      const updatedCover = await apiClient.post<ProposalComponent>(
        `/creative/proposals/${proposalId}/render`,
        undefined,
        accessToken,
      );
      setComponents(
        (previous) =>
          previous?.map((component) => (component.type === "COVER" ? updatedCover : component)) ?? previous,
      );
    } catch (err) {
      setRenderError(
        err instanceof ApiError
          ? `Encontrei um ponto que merece atenção: ${err.message}`
          : "Não consegui gerar o render agora.",
      );
    } finally {
      setRenderingImage(false);
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
      <h1>Editor do Projeto</h1>

      {generating && <AiThought thoughts={THOUGHTS} />}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!generating && components === undefined && (
        <p style={{ color: colors.textMuted }}>Reunindo os componentes já gerados...</p>
      )}

      {!generating && components === null && (
        <Card>
          <p>Ainda não geramos os componentes reutilizáveis desta proposta.</p>
          <Button onClick={handleGenerate}>Gerar componentes da proposta</Button>
        </Card>
      )}

      {!generating && components && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing.md }}>
            <Button variant="ghost" onClick={handleGenerate}>
              Gerar novamente
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {components.map((component) =>
              component.type === "COVER" ? (
                <ProposalComponentCard
                  key={component.id}
                  component={component}
                  actions={
                    <>
                      {renderingImage && (
                        <p style={{ color: colors.textMuted, fontStyle: "italic", margin: `0 0 ${spacing.sm}` }}>
                          Pintando o conceito em imagem...
                        </p>
                      )}
                      {renderError && (
                        <p style={{ color: colors.danger, margin: `0 0 ${spacing.sm}` }}>{renderError}</p>
                      )}
                      <Button variant="ghost" disabled={renderingImage} onClick={handleGenerateRender}>
                        {component.content.renderImageUrl ? "Gerar novo render" : "Gerar render conceitual"}
                      </Button>
                    </>
                  }
                />
              ) : (
                <ProposalComponentCard key={component.id} component={component} />
              ),
            )}
          </div>
          <div style={{ marginTop: spacing.lg }}>
            <Link href={`/projects/${eventId}/proposta`}>
              <Button>Ver proposta final</Button>
            </Link>
          </div>
        </>
      )}
    </>
  );
}

export default function EditorPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <EditorContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
