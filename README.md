# MEM Architect

O primeiro Sistema Operacional para Empresas de Eventos, parte do ecossistema
**MEM Technologies**. Transforma qualquer briefing de evento em um projeto profissional
completo — DNA do Evento™, Jornada Memorável™, Linha do Tempo MEM™, checklist, orçamento,
plano de produção, MEM Score™ e PDF executivo — em menos de 30 minutos, usando IA como
copiloto.

Este repositório contém a **Sprint 1** do MVP: arquitetura, modelagem de banco,
autenticação e Design System. Leia `docs/` antes de tocar em código — cada decisão está
documentada com o porquê, não só o quê.

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
npm run dev                # http://localhost:3000
```

Style guide vivo do Design System: `http://localhost:3000/design-system`.

## Estrutura

```
src/app/        rotas (Next.js App Router) — UI e API, o mais fino possível
src/components/ Design System (ui/) e componentes de layout
src/modules/    lógica de domínio por módulo (services, schemas, tipos)
src/lib/        infraestrutura compartilhada (Prisma client, Auth.js, utils)
prisma/         schema.prisma e migrations
docs/           toda a documentação de produto e arquitetura
```

## Estado do projeto

Sprint 1 de 5 concluída — ver `docs/ROADMAP.md` para o que vem a seguir (Eventos e
Clientes na Sprint 2, Entrevista Inteligente na Sprint 3, geração de documentos na
Sprint 4, exportação e produção na Sprint 5).
