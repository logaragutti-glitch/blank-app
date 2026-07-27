# MEM Architect — Backlog Priorizado

Priorização por impacto no "briefing → projeto profissional em 30 minutos" vs. esforço.
`P0` bloqueia o MVP, `P1` é essencial para o MVP mas não bloqueia a primeira demo, `P2` é
pós-MVP.

## P0 — Bloqueia o MVP

| # | Item | Módulo | Sprint |
|---|---|---|---|
| 1 | Modelo de dados multi-tenant + migrations | DB | 1 |
| 2 | Autenticação e sessão com organização ativa | Auth | 1 |
| 3 | Design System base (Button/Card/Badge/Input/Avatar/Progress) | Design System | 1 |
| 4 | Shell autenticado (Sidebar + Topbar + layout responsivo) | Dashboard | 1 |
| 5 | CRUD de Evento | Eventos | 2 |
| 6 | CRUD de Cliente | Clientes | 2 |
| 7 | Motor de entrevista dinâmica (regras) | Entrevista | 3 |
| 8 | Tela de entrevista uma-pergunta-por-vez | Entrevista | 3 |
| 9 | Abstração `AiProvider` + implementação OpenAI | IA | 3 |
| 10 | Geração do DNA do Evento™ | Documentos | 4 ✅ |
| 11 | Geração da Jornada Memorável™ | Documentos | 4 ✅ |
| 12 | Geração da Linha do Tempo MEM™ | Documentos | 4 ✅ |
| 13 | Geração do Checklist | Documentos | 4 ✅ |
| 14 | Geração do Orçamento/Plano Financeiro inicial | Documentos | 4 ✅ |
| 15 | Cálculo do MEM Score™ | Documentos | 4 ✅ |
| 16 | Exportação em PDF executivo | Documentos | 5 |

## P1 — Essencial para o MVP, não bloqueia a primeira demo

| # | Item | Módulo | Sprint |
|---|---|---|---|
| 17 | Convite de membros e papéis (Owner/Admin/Member) | Auth/Settings | 2 |
| 18 | Dashboard com métricas reais (não mock) | Dashboard | 2 |
| 19 | Edição inline dos documentos gerados | Documentos | 4 ✅ |
| 20 | Mapa da Emoção™ e Plano B | Documentos | 4 ✅ |
| 21 | Resumo Executivo (documento consolidado) | Documentos | 4 ✅ |
| 22 | `AiGenerationLog` (auditoria de custo/tokens) | IA/Analytics | 4 ✅ |
| 23 | Testes E2E do fluxo crítico | Qualidade | 5 ✅ |
| 24 | RLS por tenant no Postgres | Segurança | 2 ✅ |
| 25 | Rate limiting nas rotas de IA | Segurança | 5 ✅ |
| 35 | Testes unitários dos módulos de domínio (Vitest) | Qualidade | 5 ✅ |
| 36 | Verificação automatizada de isolamento RLS (`scripts/verify-rls.sh`) | Segurança | 5 ✅ |
| 37 | Revisão de segurança formal (`docs/SECURITY.md`) + upgrade do next-auth (3 vulnerabilidades críticas/altas corrigidas) | Segurança | 5 ✅ |
| 38 | Upgrade do Next.js 14 → 16 (corrige vulnerabilidades altas restantes — DoS, SSRF, cache poisoning) | Plataforma | 5 ✅ |
| 39 | Atualizar `postcss`/`sharp` vendorizados dentro de `next/node_modules` quando o Next.js 16.x liberar uma patch — risco residual de baixo impacto (build-time / `next/image` sem fontes remotas), ver `docs/SECURITY.md` §6 | Plataforma | — |

## P2 — Pós-MVP

| # | Item | Módulo |
|---|---|---|
| 26 | Biblioteca de templates reutilizáveis | Templates |
| 27 | Command Palette funcional (busca + ações) | Design System |
| 28 | Analytics agregado (funil, MEM Score histórico) | Analytics |
| 29 | Internacionalização en/es | Plataforma |
| 30 | Billing e planos | Plataforma |
| 31 | Kanban e Calendar (visões alternativas de evento) | Eventos |
| 32 | Multi-provedor de LLM (Anthropic/outros) habilitado por organização | IA |
| 33 | Edição por item nas tabelas relacionais (marcar checklist concluído, reordenar linhas de orçamento) direto na UI — hoje Checklist/Financeiro/Timeline renderizam o snapshot do `Document` (editável só via JSON), embora `ChecklistItem`/`BudgetLine`/`TimelineItem` já estejam sincronizados no banco desde a Sprint 4 | Documentos |
| 34 | Fila de workers para geração de documentos (hoje síncrona, paralela, dentro de uma request) — só migra quando o volume real justificar, ver `docs/ARCHITECTURE.md` §2 | IA |

## Critérios de aceite gerais (aplicam-se a todo item P0/P1)

- Segue os princípios de `ARCHITECTURE.md` §1 (mobile first, API first, multi-tenant).
- Não introduz acesso ao banco fora da camada de serviço do módulo correspondente.
- Toda rota de API tem schema Zod de entrada e está documentada em `API_SPEC.md`.
- Todo componente novo de UI é adicionado à página `/design-system` antes de ser usado
  em produto (quando fizer parte do design system reutilizável).
