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

## Sprint 2 — Eventos, Clientes e Dashboard
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
- [x] `InterviewSession`/`InterviewAnswer` persistidos (`src/modules/interview/service.ts`),
  com sessão criada sob demanda (`getOrCreateSession`) e evento transicionando
  `DRAFT → INTERVIEW` automaticamente ao começar
- [x] Motor de entrevista por regras (`src/modules/interview/questions.ts`): perguntas
  base, ramos específicos por tipo de evento (casamento/corporativo) e perguntas comuns —
  a sequência é recalculada a cada resposta, não fixa
- [x] Ponto de extensão de IA (`src/modules/interview/ai.ts`): depois que a árvore de
  regras se esgota, uma chamada real ao `AiProvider` (OpenAI) pode propor UMA pergunta de
  esclarecimento extra; sem `OPENAI_API_KEY` ou em caso de erro, a entrevista segue sem
  bloquear (IA como copiloto, nunca dependência dura) — chamada logada em `AiGenerationLog`
- [x] Tela "uma pergunta por vez" (mobile first), com opções de seleção como botões grandes
  (avançam sozinhos, sem passo extra de "confirmar"), pular perguntas opcionais, e
  editar qualquer resposta anterior a partir da revisão
- [x] Editar uma resposta invalida **apenas o que dependia dela** (ex.: trocar o tipo do
  evento descarta as perguntas do ramo antigo, mas preserva `objective`/`guest_count`/etc.)
  — corrigido depois de um teste E2E expor que a primeira versão invalidava a entrevista
  inteira ao editar a primeira pergunta
- [x] Tela de revisão com todas as respostas e edição inline antes de gerar o projeto
- [x] Ao concluir, a entrevista sincroniza os campos estruturados do `Event` (tipo, local,
  convidados, orçamento, data) — sem isso a aba "Visão geral" ficaria vazia mesmo com a
  entrevista completa

**Critério de pronto:** validado via Playwright contra Postgres real, incluindo o caso que
quebrou na primeira implementação — editar a primeira pergunta (tipo do evento) no meio da
revisão, confirmando que só as perguntas do ramo antigo são descartadas e a entrevista
segue corretamente pelo novo ramo até a geração do projeto.

## Sprint 4 — Geração dos documentos MEM (ESTE ENTREGÁVEL)
- [x] Orchestrator de geração (`src/modules/documents/orchestrator.ts`) disparando os 9
  documentos com conteúdo (DNA do Evento™, Mapa da Emoção™, Jornada Memorável™, Linha do
  Tempo MEM™, Plano Operacional™, Checklist, Plano Financeiro, Plano B, Resumo Executivo)
  em paralelo — as chamadas de IA acontecem fora de transação de banco, só o resultado é
  persistido dentro de uma transação
- [x] Persistência versionada em `Document` (`regenerateDocument`/`editDocument` criam
  versão nova, nunca sobrescrevem) + `MemScore` calculado por regras determinísticas (não
  por IA — completude, aderência ao orçamento, riscos identificados), documentado e
  recalculado a cada geração, regeneração **ou edição manual** — não só na geração em lote
- [x] Checklist, Plano Financeiro e Linha do Tempo também sincronizam para as tabelas
  relacionais (`ChecklistItem`/`BudgetLine`/`TimelineItem`) já modeladas na Sprint 1, além
  do snapshot em `Document`
- [x] Editor inline por documento: JSON validado contra o mesmo schema Zod da IA, com um
  esqueleto pré-preenchido (`DOCUMENT_SKELETONS`) quando não há conteúdo ainda — funciona
  tanto para corrigir um documento pronto quanto para preencher manualmente um que falhou
  (sem `OPENAI_API_KEY`, é o único caminho até a chave ser configurada)
- [x] Estado por documento na UI: pendente/gerando/pronto/falhou, com "tentar novamente" e
  edição manual disponíveis mesmo em falha
- [x] `AiGenerationLog` gravado a cada geração/regeneração bem-sucedida (auditoria de
  custo/tokens); chamadas que falham (ex.: sem chave configurada) não geram log, só o
  `Document.status = FAILED`

**Critério de pronto:** validado via Playwright contra Postgres real, incluindo o caminho
sem `OPENAI_API_KEY` configurada (o cenário real deste ambiente) — geração completa falha
graciosamente nos 9 documentos, o evento ainda transiciona para "Revisão", e a edição
manual preenche um documento do zero e recalcula o MEM Score corretamente (confirmado
subindo de 27 para 30 após uma única edição).

## Sprint 5 — Exportação, testes e preparação para produção

**Parte 1 — Testes e revisão de segurança (ESTE ENTREGÁVEL):** feita sem depender de
nenhuma credencial externa, ao contrário da Parte 2 abaixo.

- [x] Suite de testes unitários (Vitest): 42 testes sobre lógica de domínio pura — motor de
  entrevista (`questions.ts`, incluindo a regressão do bug de invalidação da Sprint 3),
  validação de resposta (`schema.ts`), cálculo do MEM Score (`score.ts`), `slugify`/`cn`
- [x] Suite de testes E2E (Playwright) formalizada em `e2e/` — os fluxos que antes eram
  scripts manuais viraram testes commitados: cadastro→cliente→evento, convite de membro
  aceito automaticamente no cadastro, edição de entrevista invalidando só o ramo antigo
  (regressão), geração de documentos com falha graciosa + edição manual + recálculo do
  MEM Score. `npm run test:e2e` sobe o próprio Next.js dev server contra um Postgres de
  teste dedicado (`e2e/global-setup.ts` cuida de criar o banco/rodar migrations/RLS)
- [x] Rate limiting nas rotas de IA (`src/lib/rate-limit.ts`), por organização: 10
  gerações completas / 10 min, 30 regenerações ou chamadas de esclarecimento da
  entrevista / 10 min — validado forçando o limite e confirmando o bloqueio na 11ª chamada
- [x] Verificação automatizada de RLS (`scripts/verify-rls.sh`, `npm run test:rls`):
  formaliza a checagem manual das sprints anteriores com uma role Postgres sem privilégio
  de owner
- [x] Revisão de segurança formal (`docs/SECURITY.md`): autorização por rota, validação de
  entrada, segredos, e auditoria de dependências — encontrou e corrigiu 3 vulnerabilidades
  críticas/altas reais no `next-auth` (não só transitivas decorativas), revalidando toda a
  suite depois do upgrade

**Parte 2a — Upgrade do Next.js 14 → 16 (FEITO, sessão dedicada de teste):**

- [x] Mapeamento da superfície de breaking changes (async `params`/`searchParams`,
  Turbopack como default, `middleware.ts` → `proxy.ts`, remoção de `next lint`)
- [x] `params`/`searchParams` convertidos para `Promise<T>` e `await`ados nos 10 route
  handlers dinâmicos e nas 5 páginas afetadas do App Router
- [x] `src/middleware.ts` renomeado para `src/proxy.ts` (nova convenção do Next 16)
- [x] Migração para ESLint 9 flat config (`eslint.config.mjs`, `eslint-config-next/core-web-vitals`
  importado direto); script `lint` trocado de `next lint` para `eslint .`
- [x] Correção de um bug real de React descoberto pela nova regra `react-hooks/set-state-in-effect`
  nos 4 dialogs de formulário — a primeira tentativa de correção introduziu um erro de
  runtime ("Cannot update a component while rendering a different component"), pego pelos
  testes E2E, não pelo lint/tsc; corrigido de vez com `useFormState` isolado num componente
  filho que desmonta ao fechar o dialog + `useEffect` para notificar o pai
  (`src/hooks/use-close-on-success.ts`)
- [x] Revalidação completa: build (Turbopack), lint, typecheck, 42 testes unitários,
  `test:rls`, 4 fluxos E2E — todos passando
- [x] `docs/SECURITY.md` §6 atualizado com o resultado, incluindo avaliação honesta do
  risco residual (`postcss`/`sharp` vendorizados dentro de `next/node_modules`, baixo
  impacto, sem correção disponível que não seja downgrade nonsense do Next)

**Parte 2b — Exportação e deploy (não feita nesta entrega, depende de credenciais externas
que este ambiente não tem):**
- Geração de PDF executivo a partir dos documentos do evento
- Upload para Supabase Storage + link de compartilhamento
- Deploy de produção (Vercel + Supabase) com variáveis de ambiente e monitoramento básico

**Critério de pronto (Parte 1 + 2a):** `npm test`, `npm run test:e2e` e `npm run test:rls`
passam limpos contra Postgres real; `npm run build`/`lint`/`typecheck` sem erros depois do
upgrade de segurança do next-auth e do upgrade do Next.js 14 → 16.

## Depois do MVP (não neste roadmap, apenas registrado)
- Módulo `/templates` completo (biblioteca compartilhável entre organizações)
- Módulo `/analytics` completo (funil, custo de IA por organização, MEM Score histórico)
- Internacionalização (`next-intl`) ativada para en/es
- Billing e planos
- Command Palette funcional (hoje é só reserva de atalho)
