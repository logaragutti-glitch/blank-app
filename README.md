# MEM Architect

O primeiro Sistema Operacional para Empresas de Eventos, parte do ecossistema
**MEM Technologies**. Transforma qualquer briefing de evento em um projeto profissional
completo — DNA do Evento™, Jornada Memorável™, Linha do Tempo MEM™, checklist, orçamento,
plano de produção, MEM Score™ e PDF executivo — em menos de 30 minutos, usando IA como
copiloto.

Leia `docs/` antes de tocar em código — cada decisão está documentada com o porquê, não só
o quê.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, decisões técnicas e justificativas, estrutura de módulos |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Modelo de dados, diagrama de entidades, decisões de modelagem |
| [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) | Fluxos de ponta a ponta (onboarding, entrevista, geração, colaboração) |
| [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) | Wireframes em texto das telas principais |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, princípios de interação, inventário de componentes |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Plano de implementação por sprints (1 a 5) |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Backlog priorizado (P0/P1/P2) |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | Contrato de todas as rotas de API por módulo |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Revisão de segurança: RLS, rate limiting, segredos, dependências |

## Stack

Next.js 14 (App Router) · React · TypeScript · TailwindCSS · Prisma · PostgreSQL ·
Auth.js · OpenAI API (atrás de uma interface de provedor). Ver `docs/ARCHITECTURE.md`
para o porquê de cada escolha.

## Como rodar localmente

Pré-requisitos: Node.js 20+, um Postgres acessível (local ou Supabase).

```bash
cp .env.example .env      # preencha DATABASE_URL, AUTH_SECRET etc.
npm install
npm run prisma:generate
npm run prisma:migrate    # cria as tabelas a partir de prisma/schema.prisma
psql "$DATABASE_URL" -f prisma/rls.sql   # ativa o isolamento por tenant (ver docs/SECURITY.md)
npm run dev                # http://localhost:3000
```

Style guide vivo do Design System: `http://localhost:3000/design-system`.

## Testes

```bash
npm test          # unitários (Vitest) — lógica de domínio pura, sem banco
npm run test:e2e  # ponta a ponta (Playwright) — sobe o app contra um Postgres de teste
npm run test:rls  # isolamento por tenant, com uma role Postgres sem privilégio de owner
```

## Estrutura

```
src/app/        rotas (Next.js App Router) — UI e API, o mais fino possível
src/components/ Design System (ui/) e componentes de layout
src/modules/    lógica de domínio por módulo (services, schemas, tipos)
src/lib/        infraestrutura compartilhada (Prisma client, Auth.js, utils)
prisma/         schema.prisma, migrations e rls.sql
e2e/            testes de ponta a ponta (Playwright)
scripts/        scripts de verificação (RLS)
docs/           toda a documentação de produto e arquitetura
```

## Estado do projeto

Sprints 1 a 4 concluídas, Sprint 5 parcialmente concluída (testes automatizados e revisão
de segurança — ver `docs/ROADMAP.md`). Falta exportação em PDF e deploy de produção, que
dependem de credenciais externas (Supabase Storage, Vercel) não configuradas neste
ambiente.
