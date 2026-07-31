# 11 — Guia de Deploy de Produção

> **Nota de escopo:** este documento é um runbook de engenharia (como
> publicar o sistema), não uma transcrição do planejamento de produto
> original como os documentos 01-10 — foi escrito durante a implementação,
> junto com o item de infraestrutura independente do sequenciamento em
> `08-roadmap.md`. Nenhum passo aqui foi executado de fato: escrever e
> validar credenciais reais de provedores de nuvem (Vercel, Railway,
> Neon/Supabase, AWS/Cloudflare) está fora do alcance do ambiente onde este
> código foi desenvolvido — os passos abaixo devem ser executados por
> quem tiver acesso a essas contas.

## Estado atual (antes deste guia)

Já existe um deploy completo e funcional, só que local: `docker compose
--profile full up -d --build` sobe Postgres+pgvector, Redis, RabbitMQ,
OpenSearch, MinIO, `apps/api` (via `apps/api/Dockerfile`, já pronto para
produção — build multi-stage, só copia `dist` + `node_modules` no estágio
final), `apps/web` e `apps/admin`. O que falta é a mesma topologia rodando
em infraestrutura real, acessível pela internet, não só em `localhost`.

## O que realmente precisa de infraestrutura paga/gerenciada

Nem todo serviço do `docker-compose.yml` é usado por algum caminho de
código real hoje — publicar todos eles em produção pagaria por
infraestrutura ociosa:

| Serviço | Usado por código real? | Necessário em produção? |
| --- | --- | --- |
| Postgres + pgvector | Sim (todo o domínio + busca semântica de estilos) | **Sim** |
| Armazenamento S3-compatível (MinIO local) | Sim (imagens de inspiração, renders conceituais) | **Sim** (via um provedor real) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Sim (Agentes 1/3/4, embeddings, renders) | **Sim** |
| Redis | Não — nenhum módulo o injeta ainda | Não, por enquanto |
| RabbitMQ | Não — cogitado em `07-architecture-book.md` para geração assíncrona de PDF/propostas, mas todo esse fluxo hoje é HTTP síncrono | Não, por enquanto |
| OpenSearch | Não — a busca semântica real usa pgvector, não OpenSearch | Não, por enquanto |

## `apps/web` e `apps/admin` → Vercel

`apps/web` já tem `vercel.json` (`buildCommand: "next build"`, necessário
porque a Vercel detecta `apps/api/prisma/schema.prisma` quando "Include
files outside the Root Directory" está ligado e tenta injetar `prisma
migrate deploy && next build` — um heurístico real da Vercel para projetos
Prisma que não se aplica aqui, já que o frontend não roda migração
nenhuma). `apps/admin` ganhou o mesmo `vercel.json` nesta etapa — faltava.

Passos (por app, feitos uma vez cada na conta Vercel do usuário):

1. Criar um novo projeto Vercel apontando para este repositório.
2. Project Settings → General → **Root Directory**: `apps/web` (ou
   `apps/admin`).
3. Ligar **"Include files outside the Root Directory"** (necessário para a
   Vercel enxergar `packages/ui`/`packages/types`, que os apps importam via
   `transpilePackages` no `next.config.mjs`).
4. Environment Variables: `NEXT_PUBLIC_API_URL` apontando para a URL
   pública de `apps/api` (ver seção abaixo).
5. Deploy. Previews automáticos em PR já funcionam para `apps/web` neste
   repositório (é o check "Vercel Preview Comments" que aparece em todo
   PR) — `apps/admin` precisa do projeto Vercel criado antes de ganhar o
   mesmo comportamento.

## `apps/api` → um host com suporte a container (Railway/Render/Fly.io)

`apps/api/Dockerfile` já existe e está pronto (build multi-stage, copia só
o necessário para o estágio final). Qualquer provedor que aceite um
Dockerfile serve; os passos abaixo são genéricos o bastante para
Railway/Render, os dois mais simples para uma API NestJS + Postgres:

1. Criar o serviço apontando para este repositório, `Dockerfile Path:
   apps/api/Dockerfile`, **contexto de build: raiz do repositório** (o
   Dockerfile faz `COPY . .` e depois filtra via `pnpm --filter
   @eve-os/api...`, então precisa enxergar o monorepo inteiro, não só
   `apps/api`).
2. Variáveis de ambiente obrigatórias (ver `apps/api/.env.example`):
   `DATABASE_URL`, `S3_ENDPOINT`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`/
   `S3_BUCKET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `JWT_SECRET` (gerar
   um valor aleatório real — o `.env.example` só tem um placeholder, nunca
   usar `change-me-in-production` de verdade). `REDIS_URL`/
   `RABBITMQ_URL`/`OPENSEARCH_URL` podem ficar de fora — nada os lê hoje
   (ver tabela acima).
3. Migrações: rodar `npx prisma migrate deploy` (não `migrate dev`) contra
   o `DATABASE_URL` de produção antes do primeiro boot bem-sucedido — a
   maioria dos provedores tem um "release command"/"pre-deploy command"
   para isso. Rodar `npx prisma db seed` uma única vez depois, se quiser
   os dados de exemplo do Knowledge Graph (`prisma/seed.ts`) como ponto de
   partida real (o seed é idempotente).
4. Health check do provedor: `GET /health` (`apps/api/src/health`) já
   existe e é público (`@Public()`). **Limitação conhecida:** hoje só
   verifica heap de memória, não conectividade real com o Postgres — o
   provedor pode reportar "saudável" mesmo com o banco fora do ar. Uma
   melhoria futura razoável (não feita aqui) seria adicionar um
   `PrismaHealthIndicator`.
5. Porta: a API escuta em `PORT` (padrão `4000`) — a maioria dos
   provedores injeta essa env var automaticamente; conferir se bate com o
   que o provedor espera.

## Postgres com pgvector gerenciado

O Postgres precisa da extensão `pgvector` (usada pelo embedding de
`EventStyle`, `07-architecture-book.md`). Opções gerenciadas que já
suportam a extensão nativamente: **Neon** ou **Supabase** (ambos Postgres
gerenciado com `pgvector` disponível via `CREATE EXTENSION`). Depois de
provisionar, rodar as migrações (`prisma migrate deploy`) já cria a
extensão — ver a primeira migration do projeto (`CREATE EXTENSION IF NOT
EXISTS vector`).

## Armazenamento S3-compatível real

`StoragePort`/`S3StorageService` (`apps/api/src/infrastructure/storage`) já
fala o protocolo S3 puro (`@aws-sdk/client-s3`, `forcePathStyle: true`) —
funciona sem mudar código contra qualquer provedor S3-compatível real:
AWS S3 direto, ou Cloudflare R2 (mais barato, sem custo de egress). Só
trocar `S3_ENDPOINT`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`/`S3_BUCKET` pelas
credenciais reais — nenhuma mudança de código necessária.

## O que ainda falta para "produção completa" (fora do alcance deste guia)

- Provisionar de fato as contas/credenciais acima — decisão e execução de
  quem tem acesso a elas, não deste ambiente de desenvolvimento.
- Deploy automático de `apps/api` a cada merge em `main` (hoje só o
  preview de `apps/web` via Vercel é automático neste repositório).
- Observabilidade além de logs (`nestjs-pino` já está configurado) —
  métricas, tracing, alertas.
- O `PrismaHealthIndicator` mencionado acima.
