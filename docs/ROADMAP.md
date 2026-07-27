# MEM Architect — Roadmap do MVP (por sprints de 1 semana)

Cada sprint entrega algo demonstrável de ponta a ponta. Nenhuma sprint começa "código"
sem que a anterior tenha fechado o raciocínio de produto/arquitetura correspondente.

## Sprint 1 — Fundação
**Objetivo:** arquitetura, banco de dados, autenticação e design system prontos para os
módulos de produto serem construídos em cima sem retrabalho.

- [x] Documento de arquitetura (`ARCHITECTURE.md`) com decisões e justificativas
- [x] Modelagem completa do banco (`DATABASE.md` + `prisma/schema.prisma`)
- [x] Fluxos de usuário (`USER_FLOWS.md`) e wireframes em texto (`WIREFRAMES.md`)
- [x] Design System v1: tokens, `Button/Card/Badge/Input/Avatar/Progress`, `Sidebar/Topbar`
- [x] Scaffold Next.js + TypeScript + Tailwind funcionando (`npm run build` passa)
- [x] Auth.js configurado com sessão multi-tenant (`organizationId`, `role`)
- [x] Backlog priorizado e especificação inicial de API

**Critério de pronto:** projeto roda localmente, tela de login funciona contra o banco,
dashboard shell renderiza com dados mockados usando os componentes do design system.

## Sprint 2 — Eventos, Clientes e Dashboard (ESTE ENTREGÁVEL)
- [x] CRUD de `Event` e `Client` (services + rotas de API + UI) — criação e listagem
  completas; edição de campos e exclusão ficam para quando a Entrevista (Sprint 3) e a
  geração de documentos (Sprint 4) derem mais motivo para editar um evento existente
- [x] Dashboard com dados reais (`src/modules/dashboard/service.ts`): eventos ativos, MEM
  Score médio, pendências, checklist prioritário, atividades recentes, eventos recentes
- [x] Página de detalhe do evento (tabs reais com Radix: Visão geral/DNA/Jornada/
  Timeline/Checklist/Financeiro/Resumo; as abas de documento mostram estado vazio até a
  Sprint 4 gerar conteúdo)
- [x] Fluxo de cadastro (`/sign-up`) — Sprint 1 só tinha `/sign-in`; sem ele não havia como
  testar convite de membros de ponta a ponta
- [x] Convite de membros e papéis funcionando ponta a ponta: e-mail já cadastrado ganha
  acesso na hora, e-mail novo fica como `Invitation` pendente e é aceito automaticamente
  no cadastro (validado via Playwright: segundo usuário se cadastra e entra na organização
  do convite, não cria uma nova)
- [x] RLS do Postgres ativada (`prisma/rls.sql`) e validada manualmente com uma role
  não-owner: sem `app.org_id` setado a query não retorna linhas, com `app.org_id` setado
  só retorna linhas do tenant correspondente (ver `docs/DATABASE.md`)

**Critério de pronto:** validado de ponta a ponta contra Postgres real (não só build) —
cadastro cria organização, cliente e evento são criados e aparecem no dashboard com dados
reais, convite de membro é aceito automaticamente no cadastro do convidado.

## Sprint 3 — Entrevista Inteligente + integração inicial com IA
- `InterviewSession`/`InterviewAnswer` persistidos
- Motor de entrevista: árvore de decisão inicial (regras) + ponto de extensão para IA
  decidir a próxima pergunta com base no histórico
- Tela "uma pergunta por vez" (mobile first) com voltar/editar
- Primeira chamada real ao `AiProvider` (OpenAI) para sugerir a próxima pergunta
- Tela de revisão das respostas antes de gerar o projeto

## Sprint 4 — Geração dos documentos MEM
- Orchestrator de geração (`src/modules/documents`) disparando os 7 documentos base
- Persistência versionada em `Document` + cálculo do `MemScore`
- Editor inline por documento (edição manual sobrescreve, mantém histórico de versão)
- Estado de progresso por documento na UI (pendente/gerando/pronto)
- `AiGenerationLog` funcionando (auditoria de custo/tokens)

## Sprint 5 — Exportação, testes e preparação para produção
- Geração de PDF executivo a partir dos documentos do evento
- Upload para Supabase Storage + link de compartilhamento
- Suite de testes: unitário nos módulos de domínio, E2E no fluxo crítico
  (criar evento → entrevista → gerar documentos → exportar PDF)
- Revisão de segurança (checklist de RLS, rate limiting nas rotas de IA, secrets)
- Deploy de produção (Vercel + Supabase) com variáveis de ambiente e monitoramento básico

## Depois do MVP (não neste roadmap, apenas registrado)
- Módulo `/templates` completo (biblioteca compartilhável entre organizações)
- Módulo `/analytics` completo (funil, custo de IA por organização, MEM Score histórico)
- Internacionalização (`next-intl`) ativada para en/es
- Billing e planos
- Command Palette funcional (hoje é só reserva de atalho)
