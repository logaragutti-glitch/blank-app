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

**Status: ✅ corrigido — as vulnerabilidades diretas conhecidas foram resolvidas; resta um
risco residual de baixo impacto, documentado abaixo, não escondido.**

`npm audit` encontrou vulnerabilidades reais em dependências que tocam autenticação e
build diretamente, não só transitivas decorativas:

- **Corrigido (revisão anterior):** `next-auth` estava em `5.0.0-beta.22`, com 3
  vulnerabilidades **críticas/altas** conhecidas no Auth.js — `getToken()` lançava exceção
  não tratada com headers `Authorization: Bearer` malformados, o normalizador de e-mail
  validava antes da normalização Unicode (permitindo bypass por homóglifo), e cookies de
  estado/nonce/PKCE do OAuth não eram vinculados ao provedor que os criou. Atualizado para
  `5.0.0-beta.32` (última beta da série 5, resolve as três).
- **Corrigido nesta revisão (sessão dedicada, conforme planejado):** upgrade do Next.js
  `14.2.15` → `16.2.12`, resolvendo as vulnerabilidades altas então registradas (DoS, SSRF,
  cache poisoning, XSS em cenários específicos). Mudanças exigidas pela nova major version:
  - `params`/`searchParams` agora são `Promise<T>` em toda rota de API dinâmica e página do
    App Router — todos os 10 route handlers e as 5 páginas afetadas foram atualizados para
    `await` antes de usar.
  - `src/middleware.ts` renomeado para `src/proxy.ts` (nova convenção do Next 16); nenhuma
    mudança de lógica, só o arquivo.
  - Migração para ESLint 9 (flat config): `.eslintrc.json` removido, `eslint.config.mjs`
    criado importando `eslint-config-next/core-web-vitals` diretamente (já é um array de
    flat config nativo na v16, não precisa de `FlatCompat`). Script `lint` trocado de
    `next lint` (removido do CLI do Next 16) para `eslint .`.
  - A nova regra `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks 7) pegou um
    padrão usado nos 4 dialogs de formulário (`new-client-dialog`, `new-event-dialog`,
    `invite-member-dialog`, `edit-document-dialog`): fechavam o dialog chamando `setOpen`
    a partir de um `useEffect` depois de `useFormState` reportar sucesso. A correção não foi
    só silenciar o lint — a primeira tentativa (ajustar estado durante a renderização em vez
    de usar efeito) **introduziu um bug real**, confirmado em runtime pelos testes E2E
    (React: "Cannot update a component while rendering a different component" — atualizar o
    estado de um componente PAI a partir do filho durante a renderização não é seguro,
    diferente de ajustar o próprio estado). Correção final: `useFormState` foi movido para um
    componente filho renderizado só dentro de `DialogContent`, que desmonta ao fechar o
    dialog (comportamento padrão do Radix) — isso reseta o estado do hook a cada abertura —
    combinado com `useEffect` (hook `useCloseOnSuccess`, `src/hooks/use-close-on-success.ts`)
    para notificar o pai, que é o padrão correto para esse caso.
  - React mantido em `18.3.1` (não subiu para 19) — Next 16 aceita `^18.2.0` como peer e
    `next-auth` também, então o bump de major do React ficou fora do escopo deliberadamente.
  - Revalidação completa depois do upgrade: `tsc --noEmit` limpo, `npm run build`
    (Turbopack) limpo, `npm run lint` limpo, os 42 testes unitários (Vitest), `npm run
    test:rls` (3 checagens) e os 4 fluxos E2E (Playwright) — todos passando. Único aviso
    remanescente: `ReactDOM.useFormState` deprecado em favor de `React.useActionState`
    (existe só no React 19) — deixado de propósito para um eventual upgrade futuro do React,
    fora do escopo de "upgrade do Next.js".
- **Risco residual, registrado como conhecido (não bloqueia produção):** `npm audit
  --omit=dev` ainda relata 4 vulnerabilidades (1 moderada, 3 altas) em `postcss` e `sharp`
  — mas ambas são dependências **vendorizadas dentro de `node_modules/next/node_modules/`**,
  escolhidas e fixadas pelo próprio time do Next.js, não algo que este projeto declara ou
  controla diretamente. `npm audit fix --force` "resolveria" isso rebaixando `next` para
  `9.3.3` — um artefato do resolvedor do npm (tentando achar qualquer versão de `next` cujo
  `package-lock` não referencie essas versões vulneráveis das transitivas), não uma correção
  real; downgrade de 16→9 quebraria a aplicação inteira. Avaliação de risco: `sharp` é usado
  pelo Next só no pipeline de otimização de `next/image`, que este projeto **não usa** com
  fontes remotas não confiáveis (nenhum `next/image` com `remotePatterns` de terceiros
  configurado); `postcss` roda só em build-time (processamento do Tailwind), nunca recebe
  entrada de usuário em runtime. Superfície de exploração real, portanto, é baixa. Ação:
  acompanhar a próxima patch do Next.js 16.x que atualize essas transitivas internamente
  (não depende de mudança neste repositório) — registrado em `docs/BACKLOG.md`.
- **Novas dependências (Sprint 5 Parte 2b, exportação em PDF):** `@react-pdf/renderer` e
  `@supabase/supabase-js` foram adicionadas para a exportação em PDF (`docs/BACKLOG.md`
  #16). `npm audit --omit=dev` depois da instalação continua nos mesmos 4 achados já
  descritos acima — nenhuma das duas trouxe vulnerabilidade nova em produção. A chave de
  serviço do Supabase (`SUPABASE_SERVICE_ROLE_KEY`) só é lida em `src/lib/storage.ts`, que
  só roda no servidor (rota de API / Server Action) — nunca é exposta ao client.

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
- Vulnerabilidades vendorizadas dentro de `next/node_modules/{postcss,sharp}` (ver §6) —
  baixo risco (build-time / `next/image` não usado com fontes remotas), sem correção
  disponível que não seja um downgrade nonsense do Next; acompanhar próxima patch do
  Next.js 16.x.
