"use client";

import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { useProject } from "../../../lib/use-project";

function ProjectHubContent({ eventId }: { eventId: string }) {
  const { project, error } = useProject(eventId);

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;
  if (project === undefined) return <p style={{ color: colors.textMuted }}>Reunindo os detalhes do projeto...</p>;
  if (project === null) return <p style={{ color: colors.danger }}>Projeto não encontrado.</p>;

  const hasProposal = Boolean(project.latestProposal);

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href="/" style={{ color: colors.textMuted }}>
          ← Voltar
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>{project.clientNames}</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project.venueName ?? "Espaço não definido"}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, marginTop: spacing.lg }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>1. Diagnóstico Criativo</h3>
          <p style={{ color: colors.textMuted }}>
            {hasProposal
              ? `Conceito: ${project.latestProposal?.conceptName ?? "ainda sem nome"}`
              : "A IA ainda não interpretou este briefing."}
          </p>
          <Link href={`/projects/${eventId}/diagnostico`}>
            <Button>{hasProposal ? "Ver diagnóstico" : "Gerar diagnóstico criativo"}</Button>
          </Link>
        </Card>

        <Card style={{ opacity: hasProposal ? 1 : 0.6 }}>
          <h3 style={{ marginTop: 0 }}>2. Editor do Projeto</h3>
          <p style={{ color: colors.textMuted }}>Os 18 componentes reutilizáveis da proposta.</p>
          {hasProposal ? (
            <Link href={`/projects/${eventId}/editor`}>
              <Button>Abrir editor</Button>
            </Link>
          ) : (
            <Button disabled>Gere o diagnóstico primeiro</Button>
          )}
        </Card>

        <Card style={{ opacity: hasProposal ? 1 : 0.6 }}>
          <h3 style={{ marginTop: 0 }}>3. Gerar Proposta</h3>
          <p style={{ color: colors.textMuted }}>O documento final, pronto para encantar.</p>
          {hasProposal ? (
            <Link href={`/projects/${eventId}/proposta`}>
              <Button>Ver proposta</Button>
            </Link>
          ) : (
            <Button disabled>Gere o diagnóstico primeiro</Button>
          )}
        </Card>

        <Card style={{ opacity: hasProposal ? 1 : 0.6 }}>
          <h3 style={{ marginTop: 0 }}>4. Produção</h3>
          <p style={{ color: colors.textMuted }}>Lista de materiais, cronograma de montagem e checklist.</p>
          {hasProposal ? (
            <Link href={`/projects/${eventId}/producao`}>
              <Button>Ver produção</Button>
            </Link>
          ) : (
            <Button disabled>Gere o diagnóstico primeiro</Button>
          )}
        </Card>
      </div>
    </>
  );
}

export default function ProjectHubPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <ProjectHubContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
