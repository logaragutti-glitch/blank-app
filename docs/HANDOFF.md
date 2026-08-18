# MEM Architect — Relatório de Handoff Técnico

**Data:** 29/07/2026
**Branch de trabalho:** `claude/mem-architect-mvp-design-4s3t21`
**Repositório:** `logaragutti-glitch/blank-app`
**App em produção:** `https://blank-app-swart.vercel.app` (Vercel, time "HUB Azul")

Este documento existe para que qualquer desenvolvedor consiga assumir o projeto sem precisar
reconstruir o contexto lendo todo o histórico de commits ou conversas anteriores. Ele cobre:
o que está pronto, o que está quebrado agora, e o que falta.

---

## 1. O que é o produto

SaaS que transforma o briefing de um evento (via uma entrevista guiada) em um pacote
completo de planejamento profissional, gerado por IA:

| Documento | Descrição |
|---|---|
| DNA do Evento™ | Essência, emoções-guia, palavras-chave, narrativa |
| Mapa da Emoção™ | Jornada emocional por fase do evento |
| Jornada Memorável™ | Etapas da experiência do convidado |
| Linha do Tempo MEM™ | Cronograma do dia do evento |
| Plano Operacional™ | Tarefas por fase de produção |
| Checklist | Providências com prazo |
| Plano Financeiro | Orçamento por categoria |
| Plano B | Riscos e mitigação |
| Resumo Executivo | Síntese para o cliente |
| **MEM Score™** | Nota 0-100 calculada a partir da completude dos documentos |
| **PDF Executivo** | Todos os documentos consolidados, com upload para Storage e link assinado |

## 2. Stack técnico

- **Framework**: Next.js 16 (App Router, Turbopack), React 18.3.1, TypeScript
- **Estilo**: Tailwind CSS + design system próprio (`/design-system`)
- **Banco**: PostgreSQL (Supabase gerenciado), Prisma ORM, Row Level Security (RLS) como
  segunda camada de isolamento multi-tenant
- **Auth**: Auth.js (NextAuth) v5 beta, sessão com organização ativa
- **IA**: OpenAI API via abstração própria `AiProvider` (`src/modules/ai/`), trocável por
  outro provedor sem tocar em código de domínio
- **Storage/PDF**: Supabase Storage + `@react-pdf/renderer` (gera PDF em Node puro, sem
  browser embarcado — mais leve numa function serverless)
- **Testes**: Vitest (unitários, lógica de domínio pura), Playwright (E2E contra Postgres
  real), script dedicado de verificação de RLS
- **Deploy**: Vercel (app) + Supabase (Postgres + Storage), função serverless na região
  `gru1` (São Paulo, mesma região do banco)

## 3. Estado por sprint

| Sprint | Escopo | Status |
|---|---|---|
| 1 | Arquitetura, banco multi-tenant, auth, design system | ✅ completo |
| 2 | CRUD de eventos/clientes, dashboard real, membros/convites | ✅ completo |
| 3 | Entrevista Inteligente (motor de regras + extensão de IA) | ✅ completo |
| 4 | Geração dos 9 documentos, MEM Score, edição manual versionada | ✅ completo |
| 5.1 | Testes (Vitest + Playwright + RLS), revisão de segurança, upgrade next-auth | ✅ completo |
| 5.2a | Upgrade Next.js 14 → 16 | ✅ completo |
| 5.2b | Estrutura de exportação em PDF | ✅ código completo, upload nunca testado com Storage real |
| 5.2c | Deploy em produção (Vercel + Supabase) | 🟡 **em andamento — ver seção 6** |

Todo o código de produto (Sprints 1-5.2b) está implementado, testado localmente (42 testes
unitários, 4 fluxos E2E, verificação de RLS) e documentado. **O que resta é
infraestrutura de produção**, não desenvolvimento de feature.

## 4. Estrutura do repositório

```
src/
  app/                    → rotas (App Router): (app)/ autenticado, (auth)/ público, api/
  components/             → UI (design system + componentes de domínio)
  hooks/                  → hooks compartilhados (ex.: useCloseOnSuccess)
  lib/                    → infra transversal: db.ts, auth.ts, tenant.ts, storage.ts,
                             rate-limit.ts, api.ts (tratamento de erro padronizado)
  modules/                → lógica de domínio por bounded context:
    auth/, clients/, events/, interview/, documents/, organizations/, ai/
    cada módulo: schema.ts (Zod), service.ts (regra de negócio + Prisma), actions.ts
    (Server Actions), e nos casos de IA, um orchestrator/registry
  proxy.ts                → middleware de auth (renomeado de middleware.ts no Next 16)
prisma/
  schema.prisma           → modelo de dados completo
  migrations/              → 4 migrations aplicadas
  rls.sql                  → policies de Row Level Security (NÃO aplicado em produção ainda)
  seed.ts                  → dados de exemplo (org + usuário demo)
scripts/verify-rls.sh      → valida RLS com uma role Postgres sem privilégio de owner
e2e/                        → testes Playwright + global-setup (sobe DB de teste dedicado)
docs/                       → toda a documentação viva do projeto (ver seção 9)
vercel.json                 → fixa a região das functions em gru1 (São Paulo)
```

## 5. Como rodar localmente

```bash
npm install                  # roda `prisma generate` via postinstall automaticamente
service postgresql start     # se o Postgres local não estiver de pé
cp .env.example .env.local   # preencher com credenciais de dev
npx prisma migrate deploy
psql "$DATABASE_URL" -f prisma/rls.sql
npm run dev
```

Checklist antes de qualquer commit:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm test
npm run test:rls
npx playwright test
```

## 6. 🔴 PROBLEMA ATIVO — geração de documentos parcialmente falhando em produção

**Este é o item de maior prioridade para quem assumir o projeto.**

Estado no último teste em produção: **4 de 9 documentos gerados com sucesso, 5 falharam.**
A causa dos 4 sucessos + 5 falhas ainda **não foi diagnosticada** — o processo foi
interrompido esperando os logs da Vercel (Logs → filtro "Erro" → linha
`[documents.generate]` mais recente, expandir para ver a mensagem completa).

### Histórico da investigação (para não repetir passos já feitos)

Uma sequência de problemas foi encontrada e corrigida, um de cada vez, até chegar no estado
atual de "4 de 9":

1. **Deploy inicial detectado como projeto Python.** O commit inicial do repo (`main`,
   antes de qualquer trabalho) era de um template Python (`24455ba Initial commit`), e a
   Vercel herdou essa detecção de framework mesmo depois de trocar a branch de produção.
   **Corrigido**: Production Branch trocada para `claude/mem-architect-mvp-design-4s3t21`
   (Settings → Environments → Production) e Framework Preset trocado manualmente de
   "Python" para "Next.js" (Settings → Build and Deployment).

2. **Risco de `Cannot find module '.prisma/client'`.** Faltava `postinstall: "prisma
   generate"` no `package.json` — sem isso, um ambiente limpo (`npm install` + `next build`)
   nunca gera o Prisma Client. Corrigido no commit `e2b14ec`.

3. **`Transaction API error: Transaction already closed` (timeout de 5000ms).** Causa: a
   function da Vercel rodava na região padrão (Washington D.C., `iad1`), e o banco Supabase
   está em São Paulo (`sa-east-1`) — cada query dentro da transação interativa de
   `withTenant()` (`src/lib/tenant.ts`) pagava esse round-trip intercontinental, estourando
   o timeout default do Prisma. **Corrigido** no commit `aa2ca94`:
   - `vercel.json` fixa a região em `gru1` (São Paulo).
   - `withTenant()` teve o timeout subido de 5s para 15s (`maxWait: 10s`) como margem extra.

4. **`OPENAI_API_KEY` rejeitada com 401.** A causa raiz não foi confirmada com certeza —
   o valor salvo inicialmente na Vercel parecia não bater com a chave fornecida
   (possível corrupção no "Import .env" do painel da Vercel, ou erro de digitação). Ao
   tentar corrigir apagando e recriando a variável, ela **não ficou salva** (sumiu da lista
   de Environment Variables) — sintoma virou `Error: OPENAI_API_KEY não configurada`.
   Corrigido recriando a variável e confirmando visualmente na lista antes de redeployar.

5. **Estado atual: 4/9 sucesso.** Depois da correção #4, a geração passou a funcionar
   parcialmente. **Os logs do motivo específico das 5 falhas restantes ainda não foram
   coletados.**

### Diagnóstico já preparado no código (aproveitar antes de investigar mais)

Dois logs de diagnóstico foram adicionados especificamente para esta investigação — **use-os
antes de adicionar logging novo**:

- `src/modules/documents/orchestrator.ts`, função `generateOne()`: loga
  `[documents.generate] <TIPO> falhou: <erro>` no catch.
- `src/modules/ai/openai-provider.ts`: o erro lançado em caso de resposta não-OK da OpenAI
  agora inclui o **corpo da resposta**, não só o status HTTP (ex. antes: `"OpenAI request
  failed: 401"`; agora: `"OpenAI request failed: 401 {\"error\":{\"message\":...}}"`).

### Hipóteses mais prováveis para as 5 falhas (a checar, em ordem de probabilidade)

1. **Resposta da IA não bate com o schema Zod esperado** (`ZodError` dentro de
   `generateStructured` → `spec.schema.parse(raw)` em
   `src/modules/documents/orchestrator.ts:62`). Alguns tipos de documento têm prompts mais
   complexos (ex. `PLANO_OPERACIONAL` pede uma estrutura aninhada `phases[].tasks[]`) — se o
   modelo devolver JSON válido mas em formato diferente do exigido, a validação falha. Isso
   é **esperado acontecer ocasionalmente** com `gpt-4o-mini` em prompts mais estruturados;
   se for isso, considerar reforçar o prompt ou trocar o parse para tolerar pequenas
   variações antes de tentar de novo automaticamente.
2. **Rate limit da própria IA (429) por causa dos 9 disparos em paralelo** — `Promise.all`
   em `generateDocuments` (orchestrator.ts) chama os 9 tipos ao mesmo tempo; se a conta da
   OpenAI tiver um limite de requisições por segundo baixo (comum em contas novas/téstese),
   parte das chamadas concorrentes pode ser rejeitada com 429 enquanto outras passam.
3. **Timeout do fetch em documentos com prompt/resposta maior** — não há timeout explícito
   configurado no `fetch()` de `openai-provider.ts`; em tese o Vercel mata a function depois
   de um limite de execução, o que apareceria como erro genérico, não como uma mensagem da
   OpenAI.
4. Menos provável, mas a checar: `max_tokens` insuficiente causando resposta truncada
   (JSON incompleto → falha no `JSON.parse`).

### Próximo passo imediato

Coletar os logs das 5 falhas (nível "Erro", requests mais recentes de
`/events/:eventId/...` relacionados a `documents.generate`) e comparar a mensagem contra as
hipóteses acima. Depois de identificado o padrão, a correção provavelmente é uma destas:

- Se for `ZodError`: revisar/reforçar o prompt do(s) tipo(s) específico(s) que falha(m), ou
  adicionar uma tentativa extra automática (retry) antes de marcar como `FAILED`.
- Se for 429: adicionar backoff/retry no `OpenAiProvider`, ou serializar os 9 disparos em
  lotes menores em vez de `Promise.all` puro.
- Se for timeout: considerar mover a geração para fora do ciclo de vida de uma única
  request HTTP (fila/job), algo já registrado como item P2 futuro em `docs/BACKLOG.md` #34.

## 7. Pendências de infraestrutura (fora do código)

- [ ] **RLS não aplicado no banco de produção.** `prisma/rls.sql` precisa ser rodado
  manualmente contra o Postgres do Supabase (via SQL Editor do painel — a conexão direta
  não é alcançável do ambiente onde isso foi construído, ver `docs/ROADMAP.md`). Sem isso,
  o isolamento entre organizações depende **só** do filtro explícito por `organizationId` na
  camada de serviço (que já existe e funciona), mas perde a segunda camada de defesa.
  **Prioridade alta antes de qualquer uso real com dados de clientes.**
- [ ] **Confirmar que o bucket `mem-architect-documents` existe** no Supabase Storage
  (privado, não público) — foi pedido para o usuário criar, nunca confirmado com certeza.
- [ ] **Testar upload real de PDF** — o código (`src/modules/documents/export.ts`,
  `src/lib/storage.ts`) nunca rodou contra um Storage real; só foi validado até o ponto do
  upload (que falhava de propósito com `StorageNotConfiguredError` num ambiente sem
  credenciais).
- [ ] Validar o fluxo completo em produção do zero: cadastro → criar cliente → criar evento
  → entrevista → gerar os 9 documentos (depende do item 6) → exportar PDF.

## 8. Dívida técnica e riscos conhecidos (documentados, não bloqueiam o MVP)

Ver `docs/SECURITY.md` para o detalhamento completo. Resumo:

- **`npm audit --omit=dev`**: 4 vulnerabilidades (1 moderada, 3 altas) em `postcss`/`sharp`,
  **vendorizadas dentro do próprio `next`** (não são dependências diretas escolhidas pelo
  projeto). Risco real baixo (build-time / `next/image` não usado com fontes remotas). Sem
  correção disponível hoje que não seja downgrade do Next (inválido). Acompanhar próxima
  patch do Next 16.x.
- **Rate limiting é por organização, não por usuário** — aceito para o MVP, ver
  `docs/BACKLOG.md`.
- **Sem gate de CI automatizado** rodando os testes a cada PR — hoje são scripts manuais.
- **`ReactDOM.useFormState` deprecado** (aviso, não erro) — resolve só com upgrade futuro
  para React 19, fora de escopo até haver motivo real para o bump.
- **Geração de documentos é síncrona e paralela dentro de uma única request** (não é uma
  fila de verdade) — ver `docs/BACKLOG.md` #34. Se as falhas da seção 6 forem por rate
  limit/timeout, este é o ponto onde a arquitetura precisaria mudar.

## 9. Onde encontrar mais contexto

Toda a documentação abaixo é mantida viva (atualizada junto com o código, não depois):

| Arquivo | Conteúdo |
|---|---|
| `docs/ARCHITECTURE.md` | Decisões de arquitetura e por quê (banco, auth, storage, IA, deploy) |
| `docs/DATABASE.md` | Modelo de dados, RLS |
| `docs/API_SPEC.md` | Toda rota de API, contrato de request/response |
| `docs/SECURITY.md` | Checklist de segurança verificado item a item, com método usado |
| `docs/BACKLOG.md` | Backlog priorizado (P0/P1/P2) com status por item |
| `docs/ROADMAP.md` | Histórico sprint a sprint, incluindo detalhes da migração Next 16 e
  da estrutura de exportação em PDF |
| `docs/DESIGN_SYSTEM.md` / `/design-system` (rota no app) | Componentes de UI reutilizáveis |
| `docs/USER_FLOWS.md`, `docs/WIREFRAMES.md` | Fluxos de produto originais |

## 10. Credenciais e configuração

**Nenhuma credencial real está neste documento nem em qualquer arquivo commitado** (ver
`.gitignore`: `.env*.local`). As variáveis necessárias estão documentadas (sem valores) em
`.env.example`. Os valores reais de produção foram entregues ao dono do projeto em arquivos
locais (`.env.local` para dev, `.env.production.local` para produção) e estão configurados
diretamente no painel da Vercel (Project → Environment Variables) e no painel do Supabase.

Pontos de atenção específicos descobertos durante a configuração:

- `DATABASE_URL` de produção **deve** usar o host do "Transaction pooler" do Supabase
  (`aws-0-<região>.pooler.supabase.com:6543`, com `?pgbouncer=true`) — a conexão direta
  (`db.<ref>.supabase.co`) só resolve endereço IPv6 e falha em ambientes sem IPv6 (Vercel
  incluída, dependendo da região).
- `DIRECT_URL` (usado só por `prisma migrate deploy`) usa o mesmo host do pooler, porta
  **5432** (session pooler), não a conexão direta.
- O Build Command na Vercel precisa ser `prisma migrate deploy && next build` (configurado
  manualmente em Settings → Build and Deployment — não é o default do Next.js).
- A senha do Postgres, se contiver caracteres especiais (`@`, etc.), precisa estar
  URL-encoded na connection string (`@` → `%40`).

---

*Este relatório reflete o estado do projeto ao final da sessão de deploy inicial. A seção 6
é o ponto de partida obrigatório para quem continuar — sem os documentos gerando 9/9, o
produto não está pronto para uso real.*
