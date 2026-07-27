# MEM Architect — Revisão de Segurança (Sprint 5)

Checklist de segurança do MVP, com o resultado de cada item verificado nesta revisão
(não é só uma lista de intenções — cada item abaixo foi checado de verdade, com o método
usado documentado). Ver `docs/BACKLOG.md` P1 #24/#25 para os itens que originaram esta
revisão.

## 1. Isolamento por tenant (RLS)

**Status: ✅ verificado automaticamente.**

`prisma/rls.sql` ativa Row Level Security em toda tabela de negócio. `scripts/verify-rls.sh`
formaliza a verificação manual feita nas Sprints 2–4: cria uma role Postgres **sem**
privilégio de owner (o cenário real de produção — a role de deploy/migração nunca deve ser
a mesma usada pela aplicação), insere dados de dois tenants e confirma que:

1. sem `app.org_id` setado, uma query não retorna nenhuma linha;
2. com `app.org_id` setado, só retorna linhas do tenant correspondente.

Rodar com `npm run test:rls` (usa `DATABASE_URL` do ambiente, ou o Postgres local padrão).

**Limitação conhecida:** RLS é a segunda camada de defesa. A primeira é o filtro explícito
por `organizationId` em toda query da camada de serviço (`src/lib/tenant.ts`
`withTenant`) — se um service esquecesse esse filtro, RLS ainda bloquearia o vazamento
entre tenants, mas só se a aplicação se conectar com uma role não-owner em produção (ver
aviso em `prisma/rls.sql`). Isso ainda não está automatizado como *gate* de deploy —
fica registrado como item de acompanhamento antes de produção.

## 2. Rate limiting nas rotas de IA

**Status: ✅ implementado e verificado.**

`src/lib/rate-limit.ts` (`enforceAiRateLimit`) limita por organização, com contagem em
`AiRateLimitHit` (conta tentativas, não só sucessos — o custo/abuso a prevenir é de
chamadas, não de respostas):

| Rota | Limite |
|---|---|
| `documents.generate` (dispara os 9 documentos em paralelo) | 10 a cada 10 min |
| `documents.regenerate` (um documento) | 30 a cada 10 min |
| `interview.clarify` (ponto de extensão de IA da entrevista) | 30 a cada 10 min |

Verificado manualmente: 10 chamadas sucessivas a `documents.generate` passam, a 11ª lança
`RateLimitError`, mapeado para `429` em `handleApiError`. Em `interview.clarify` o limite
nunca deveria travar a entrevista (é opcional por design, ver `src/modules/interview/ai.ts`)
— um `RateLimitError` ali cai no mesmo `catch` que já trata qualquer outra falha de IA,
retornando `null` e seguindo sem a pergunta extra.

**Limitação conhecida:** o limite é por organização, não por usuário — um usuário mal
intencionado dentro de uma organização legítima poderia esgotar a cota de todos os colegas.
Aceitável para o MVP (o custo é da organização, que é quem paga); rate limiting por usuário
é um refinamento futuro se isso se mostrar um problema real.

## 3. Segredos

**Status: ✅ verificado.**

- `.env` (e variantes `.local`/`.production`) estão no `.gitignore`; `.env.example` só tem
  placeholders, nunca um valor real.
- `git log --all` no histórico do repositório não mostra nenhum arquivo `.env` já commitado.
- Busca por padrões de chave (`sk-…`, `password = "…"` hardcoded) nos arquivos rastreados:
  nada encontrado fora de `node_modules`/lockfiles.
- Senhas de usuário: nunca logadas (`console.error` só recebe o objeto de erro de
  validação/Prisma, nunca o payload da requisição); sempre tratadas via `bcrypt.hash`
  antes de tocar o banco (`src/modules/auth/service.ts`).
- Erros inesperados (`500`) são logados no servidor com detalhe, mas a resposta ao
  cliente é sempre a mensagem genérica `"Erro interno"` (`src/lib/api.ts`) — detalhes de
  implementação (stack trace, mensagem crua do Postgres/Prisma) nunca vazam para o
  cliente.

## 4. Autorização por rota

**Status: ✅ verificado por inspeção — todo endpoint de API chama `requireActiveSession()`
antes de tocar no banco, exceto `/api/auth/*` (gerenciado pelo Auth.js).** Rotas que agem
sobre um recurso específico (evento, documento, membro) sempre filtram a query pelo
`organizationId` da sessão — nunca confiam em um `id` vindo da URL sem essa checagem (ver
`docs/API_SPEC.md` "Convenções transversais": nenhuma rota aceita `organizationId` no
body). Ações de organização (convidar membro, alterar papel) checam adicionalmente
`role IN (OWNER, ADMIN)` (`assertCanManageMembers`).

## 5. Validação de entrada

**Status: ✅ verificado.** Toda rota de API e Server Action valida o payload com Zod antes
de chegar à camada de serviço (`submitAnswerSchema`, `createEventSchema`,
`inviteMemberSchema`, os 9 schemas de documento em `src/modules/documents/schemas.ts`,
etc.). Edição manual de documento é validada contra o **mesmo schema** usado para validar a
resposta da IA — nunca podem divergir de formato.

## 6. Dependências

**Status: ⚠️ parcialmente corrigido — um risco real permanece registrado, não escondido.**

`npm audit` encontrou vulnerabilidades reais em dependências que tocam autenticação
diretamente, não só transitivas decorativas:

- **Corrigido nesta revisão:** `next-auth` estava em `5.0.0-beta.22`, com 3 vulnerabilidades
  **críticas/altas** conhecidas no Auth.js — `getToken()` lançava exceção não tratada com
  headers `Authorization: Bearer` malformados, o normalizador de e-mail validava antes da
  normalização Unicode (permitindo bypass por homóglifo), e cookies de estado/nonce/PKCE do
  OAuth não eram vinculados ao provedor que os criou. Atualizado para `5.0.0-beta.32`
  (última beta da série 5, resolve as três) — build, typecheck, lint, os 42 testes
  unitários e os 4 fluxos E2E (que exercitam sign-up/sign-in pesadamente) revalidados depois
  do bump, todos passando.
- **Não corrigido, registrado como risco conhecido:** o Next.js instalado (`14.2.x`) tem
  vulnerabilidades altas (DoS, SSRF, cache poisoning, XSS em cenários específicos) cuja
  correção exige subir para `next@16`, uma mudança de major version com risco real de quebra
  (App Router, Server Actions e o pipeline de build mudaram entre 14 e 16). Decisão desta
  revisão: **não** forçar essa migração sem uma sessão dedicada a testá-la — um upgrade malfeito
  sob pressão de "revisão de segurança" é pior do que documentar o risco e agendar
  corretamente. Recomendação: tratar como item P0 antes de produção (`docs/BACKLOG.md`),
  feito de forma isolada, com o build e os testes revalidados a cada passo intermediário.

## 7. Testes automatizados

**Status: ✅ implementado.**

- `npm test` (Vitest): 42 testes unitários sobre lógica de domínio pura (motor de
  entrevista, cálculo de MEM Score, parsing de resposta, slugify) — sem depender de banco.
- `npm run test:e2e` (Playwright): 4 fluxos críticos de ponta a ponta contra Postgres real,
  incluindo a regressão do bug de invalidação de entrevista (Sprint 3) e o caminho de
  falha graciosa de geração de documentos sem `OPENAI_API_KEY` (Sprint 4) — não só o
  caminho feliz.
- `npm run test:rls`: isolamento por tenant, descrito acima.

## Itens fora do escopo desta revisão (registrados, não bloqueiam o MVP)

- Rate limiting por usuário (não só por organização) — `docs/BACKLOG.md`.
- Gate de CI automatizado rodando `test:rls`/`test:e2e` a cada PR — hoje são scripts
  manuais; a integração com CI (GitHub Actions ou equivalente) é um passo de
  infraestrutura que depende de credenciais de deploy, fora do que este ambiente consegue
  configurar sozinho.
- Upgrade do Next.js 14 → 16 (corrige as vulnerabilidades altas restantes, ver §6) —
  registrado como P0 antes de produção, não feito nesta revisão por exigir uma sessão
  dedicada de teste, não um bump apressado no meio de uma revisão de segurança.
