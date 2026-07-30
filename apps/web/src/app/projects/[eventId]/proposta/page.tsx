"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { ProposalComponentCard } from "../../../../components/ProposalComponentCard";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useLatestProposalId } from "../../../../lib/use-latest-proposal-id";
import type { ProposalDocument } from "../../../../lib/api-types";

function PropostaContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { proposalId, error: proposalError } = useLatestProposalId(eventId);
  const [proposalDocument, setProposalDocument] = useState<ProposalDocument | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    apiClient
      .get<ProposalDocument>(`/creative/proposals/${proposalId}/document`, accessToken)
      .then(setProposalDocument)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos montar a proposta."));
  }, [accessToken, proposalId]);

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
      <h1>Gerar Proposta</h1>

      {error && (
        <p style={{ color: colors.textMuted }}>
          {error} —{" "}
          <Link href={`/projects/${eventId}/editor`}>gere os componentes no Editor do Projeto</Link>.
        </p>
      )}

      {!error && proposalDocument === undefined && (
        <p style={{ color: colors.textMuted }}>Montando o documento da proposta...</p>
      )}

      {proposalDocument && (
        <>
          <p style={{ color: colors.textMuted }}>Sua proposta está pronta para encantar.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {proposalDocument.components.map((component) => (
              <ProposalComponentCard key={component.id} component={component} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function PropostaPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <PropostaContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
