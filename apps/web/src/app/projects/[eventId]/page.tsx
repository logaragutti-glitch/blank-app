"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import { useProject } from "../../../lib/use-project";
import type { BudgetAnalysis, ProductionPlan } from "../../../lib/api-types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProjectOverview = NonNullable<ReturnType<typeof useProject>["project"]>;

function WorkflowRail({ project }: { project: ProjectOverview }) {
  return (
    <Card style={{ marginTop: spacing.lg }}>
      <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Fluxo do projeto
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: spacing.xs, marginTop: spacing.sm }}>
        {project.workflow.map((step, index) => {
          const content = (
            <div style={{ minHeight: 72, padding: spacing.sm, borderRadius: 10, background: step.status === "CURRENT" ? colors.background : step.status === "DONE" ? "#F2F7F2" : "#F7F5F2", border: `1px solid ${step.status === "CURRENT" ? colors.primary : colors.border}`, opacity: step.status === "LOCKED" ? 0.58 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: step.status === "DONE" ? "#54745A" : step.status === "CURRENT" ? colors.primary : colors.border, color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
                  {step.status === "DONE" ? "✓" : index + 1}
                </span>
                <strong style={{ fontSize: "0.78rem" }}>{step.label}</strong>
              </div>
              <p style={{ margin: "8px 0 0", color: colors.textMuted, fontSize: "0.72rem" }}>
                {step.status === "DONE" ? "Concluído" : step.status === "CURRENT" ? "Próxima etapa" : "Bloqueado"}
              </p>
            </div>
          );
          return step.status === "LOCKED" ? <div key={step.id}>{content}</div> : <Link key={step.id} href={step.href} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
        })}
      </div>
    </Card>
  );
}

function ProjectMetrics({ eventId, project }: { eventId: string; project: ProjectOverview }) {
  const commercialScopeLabel = project.commercial?.scope === "DECORATION_ONLY" ? "Somente decoração" : "Evento completo";
  const commercialLabel = project.commercial ? `${commercialScopeLabel} · versão ${project.commercial.version} · ${project.commercial.status}` : "Ainda não criada";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: spacing.sm, marginTop: spacing.md }}>
      <Card>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Próxima ação</p>
        <strong style={{ display: "block", marginTop: 8 }}>{project.nextAction.label}</strong>
        <Link href={project.nextAction.href} style={{ color: colors.primary, fontSize: "0.8rem" }}>Abrir etapa →</Link>
      </Card>
      <Card>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Proposta comercial</p>
        <strong style={{ display: "block", marginTop: 8 }}>{project.commercial ? moneyFormatter.format(project.commercial.totalInvestment) : "A definir"}</strong>
        <span style={{ color: project.commercial?.hasUnconfirmedData ? colors.danger : colors.textMuted, fontSize: "0.8rem" }}>{commercialLabel}{project.commercial?.hasUnconfirmedData ? " · pendências" : ""}</span>
      </Card>
      <Card>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Tarefas</p>
        <strong style={{ display: "block", marginTop: 8 }}>{project.tasks.open} abertas</strong>
        <span style={{ color: colors.textMuted, fontSize: "0.8rem" }}>{project.tasks.done} concluídas de {project.tasks.total}</span>
      </Card>
      <Card>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Fornecedores</p>
        <strong style={{ display: "block", marginTop: 8 }}>{project.suppliers.total} vinculados</strong>
        <Link href={`/projects/${eventId}/fornecedores`} style={{ color: colors.primary, fontSize: "0.8rem" }}>Gerenciar equipe →</Link>
      </Card>
    </div>
  );
}

/**
 * Modo Produção (06-ui-bible.md): once the client approves the proposal,
 * the project hub — the same data, not a new screen from scratch —
 * changes shape to foreground checklist, fornecedores, horários and
 * montagem instead of the creative workflow steps.
 */
function ModoProducao({ eventId, project }: { eventId: string; project: ProjectOverview }) {
  const { accessToken } = useAuth();
  const [plan, setPlan] = useState<ProductionPlan | null | undefined>(undefined);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null | undefined>(undefined);
  const proposalId = project.latestProposal?.id;

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    // A 400 here means "not generated yet", same as elsewhere in the app —
    // this is a preview widget, so any other failure just falls back to
    // the same "generate it" prompt; the full error surfaces on /producao.
    apiClient
      .get<ProductionPlan>(`/production/proposals/${proposalId}/plan`, accessToken)
      .then(setPlan)
      .catch(() => setPlan(null));
    apiClient
      .get<BudgetAnalysis>(`/production/proposals/${proposalId}/budget-analysis`, accessToken)
      .then(setBudgetAnalysis)
      .catch(() => setBudgetAnalysis(null));
  }, [accessToken, proposalId]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
        <span
          style={{
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            borderRadius: 9999,
            padding: `2px ${spacing.sm}`,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Modo Produção
        </span>
      </div>
      <h1 style={{ marginBottom: spacing.xs }}>{project.clientNames}</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project.venueName ?? "Espaço não definido"}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, marginTop: spacing.lg }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Horário</h3>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            {project.ceremonyDateTime
              ? dateTimeFormatter.format(new Date(project.ceremonyDateTime))
              : "Data/horário da cerimônia ainda não definidos."}
          </p>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Checklist operacional</h3>
          {plan === undefined && <p style={{ color: colors.textMuted }}>Reunindo o checklist...</p>}
          {plan === null && (
            <>
              <p style={{ color: colors.textMuted }}>Ainda não geramos o checklist deste projeto.</p>
              <Link href={`/projects/${eventId}/producao`}>
                <Button>Gerar na tela de Produção</Button>
              </Link>
            </>
          )}
          {plan && plan.checklist.length === 0 && <p style={{ color: colors.textMuted }}>—</p>}
          {plan && plan.checklist.length > 0 && (
            <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
              {plan.checklist.map((item) => (
                <li key={item.label} style={{ marginBottom: spacing.sm }}>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
                    {item.category}
                  </p>
                  <strong>{item.label}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Montagem</h3>
          {plan === undefined && <p style={{ color: colors.textMuted }}>Reunindo o cronograma...</p>}
          {plan === null && <p style={{ color: colors.textMuted }}>Ainda não geramos o cronograma de montagem.</p>}
          {plan && plan.setupSchedule.length === 0 && <p style={{ color: colors.textMuted }}>—</p>}
          {plan && plan.setupSchedule.length > 0 && (
            <ol style={{ paddingLeft: spacing.lg, margin: 0 }}>
              {plan.setupSchedule.map((step) => (
                <li key={step.label} style={{ marginBottom: spacing.sm }}>
                  <strong>{step.label}</strong>
                  <p style={{ color: colors.textMuted, margin: 0 }}>
                    {step.timing} · {step.durationEstimate}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Fornecedores</h3>
          {budgetAnalysis === undefined && <p style={{ color: colors.textMuted }}>Reunindo os fornecedores...</p>}
          {budgetAnalysis === null && (
            <>
              <p style={{ color: colors.textMuted }}>Ainda não geramos a análise financeira deste projeto.</p>
              <Link href={`/projects/${eventId}/producao`}>
                <Button>Gerar na tela de Produção</Button>
              </Link>
            </>
          )}
          {budgetAnalysis && budgetAnalysis.bestValueSuppliers.length === 0 && (
            <p style={{ color: colors.textMuted }}>—</p>
          )}
          {budgetAnalysis && budgetAnalysis.bestValueSuppliers.length > 0 && (
            <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
              {budgetAnalysis.bestValueSuppliers.map((supplier) => (
                <li key={supplier.supplierId} style={{ marginBottom: spacing.sm }}>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem", textTransform: "uppercase" }}>
                    {supplier.category}
                  </p>
                  <strong>{supplier.supplierName}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Link href={`/projects/${eventId}/producao`} style={{ color: colors.textMuted }}>
          Ver todos os detalhes de produção →
        </Link>
        <Link href={`/projects/${eventId}/proposta`} style={{ color: colors.textMuted }}>
          Ver proposta aprovada
        </Link>
        <Link href={`/projects/${eventId}/canvas`} style={{ color: colors.textMuted }}>
          Ver Canvas do Evento
        </Link>
        <Link href={`/projects/${eventId}/tarefas`} style={{ color: colors.textMuted }}>
          Ver Tarefas do Projeto
        </Link>
        <Link href={`/projects/${eventId}/equipe`} style={{ color: colors.textMuted }}>
          Ver Equipe do Projeto
        </Link>
        <Link href={`/projects/${eventId}/arquivos`} style={{ color: colors.textMuted }}>
          Ver Arquivos do Projeto
        </Link>
        <Link href={`/projects/${eventId}/fornecedores`} style={{ color: colors.textMuted }}>
          Ver Fornecedores do Projeto
        </Link>
        <Link href={`/projects/${eventId}/chat`} style={{ color: colors.textMuted }}>
          Conversar com a EVE
        </Link>
      </div>
    </>
  );
}

function ProjectHubContent({ eventId }: { eventId: string }) {
  const { project, error } = useProject(eventId);

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;
  if (project === undefined) return <p style={{ color: colors.textMuted }}>Reunindo os detalhes do projeto...</p>;
  if (project === null) return <p style={{ color: colors.danger }}>Projeto não encontrado.</p>;

  const hasProposal = Boolean(project.latestProposal);

  if (project.commercial?.status === "APPROVED") {
    return (
      <>
        <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
          <Link href="/" style={{ color: colors.textMuted }}>
            ← Voltar
          </Link>
        </p>
        <ModoProducao eventId={eventId} project={project} />
      </>
    );
  }

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href="/" style={{ color: colors.textMuted }}>
          ← Voltar
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>{project.clientNames}</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project.venueName ?? "Espaço não definido"}</p>
      <WorkflowRail project={project} />
      <ProjectMetrics eventId={eventId} project={project} />

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

        <Card style={{ opacity: 0.6 }}>
          <h3 style={{ marginTop: 0 }}>4. Produção</h3>
          <p style={{ color: colors.textMuted }}>Lista de materiais, cronograma de montagem e checklist.</p>
          <Button disabled>Aprove a proposta comercial primeiro</Button>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Canvas do Evento</h3>
          <p style={{ color: colors.textMuted }}>
            Um quadro visual conectando cliente, espaço, flores, luz, música, gastronomia, mobiliário e experiência.
          </p>
          <Link href={`/projects/${eventId}/canvas`}>
            <Button variant="ghost">Abrir Canvas</Button>
          </Link>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Tarefas do Projeto</h3>
          <p style={{ color: colors.textMuted }}>
            Um checklist do que precisa ser feito, com responsável e prazo — independente do diagnóstico.
          </p>
          <Link href={`/projects/${eventId}/tarefas`}>
            <Button variant="ghost">Abrir Tarefas</Button>
          </Link>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Equipe do Projeto</h3>
          <p style={{ color: colors.textMuted }}>
            Quem da sua equipe está envolvido neste projeto, e em que papel.
          </p>
          <Link href={`/projects/${eventId}/equipe`}>
            <Button variant="ghost">Abrir Equipe</Button>
          </Link>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Arquivos do Projeto</h3>
          <p style={{ color: colors.textMuted }}>
            Contratos, plantas, orçamentos de fornecedores — tudo num só lugar.
          </p>
          <Link href={`/projects/${eventId}/arquivos`}>
            <Button variant="ghost">Abrir Arquivos</Button>
          </Link>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Fornecedores do Projeto</h3>
          <p style={{ color: colors.textMuted }}>
            Quais fornecedores do catálogo estão neste projeto, e em que estágio da contratação.
          </p>
          <Link href={`/projects/${eventId}/fornecedores`}>
            <Button variant="ghost">Abrir Fornecedores</Button>
          </Link>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>✨ Chat com a EVE</h3>
          <p style={{ color: colors.textMuted }}>
            Converse sobre este projeto — status, tarefas, equipe, fornecedores. Ainda não realiza ações.
          </p>
          <Link href={`/projects/${eventId}/chat`}>
            <Button variant="ghost">Abrir Chat</Button>
          </Link>
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
