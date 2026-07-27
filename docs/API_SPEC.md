# MEM Architect — Especificação de API

Todas as rotas vivem sob `src/app/api/*` (Next.js Route Handlers), autenticadas via
Auth.js (cookie de sessão). Toda rota valida `organizationId` da sessão contra o recurso
acessado antes de tocar no banco. Request/response de cada rota são validados por schemas
Zod definidos em `src/modules/<módulo>/schema.ts` — o mesmo schema é reaproveitado no
frontend para validação de formulário, garantindo um único contrato.

Convenção de resposta de erro: `{ error: { code: string, message: string } }` com status
HTTP correspondente (`400` validação, `401` não autenticado, `403` fora do tenant,
`404` não encontrado, `429` rate limit, `500` erro interno).

## Auth — `/api/auth/*`
Gerenciado pelo Auth.js (`[...nextauth]`). Não é uma API de domínio; expõe
`signin`, `signout`, `session`, `csrf` conforme convenção do framework.

## Eventos — Sprint 2 ✅ implementado

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/events` | Lista eventos da organização ativa (filtro por `status`) |
| POST | `/api/events` | Cria evento (`name`, `clientId?`, `type?`) |
| GET | `/api/events/:eventId` | Detalhe do evento |
| PATCH | `/api/events/:eventId` | Atualiza campos do evento |
| DELETE | `/api/events/:eventId` | Arquiva o evento (`status = ARCHIVED`) |

Lógica em `src/modules/events/service.ts`. As telas de criação (`/events`, dialog "Novo
evento") chamam essa mesma camada de serviço via Server Action
(`src/modules/events/actions.ts`), não fazem `fetch` para a rota HTTP — evita um round-trip
de rede redundante dentro do próprio app. As rotas HTTP documentadas aqui existem para
integrações externas/futuras (mobile, automações) e são o contrato testável formalmente.

## Clientes — Sprint 2 ✅ implementado

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/clients` | Lista clientes da organização |
| POST | `/api/clients` | Cria cliente |
| PATCH | `/api/clients/:clientId` | Atualiza cliente |

Mesmo padrão dos Eventos: `src/modules/clients/service.ts` + Server Action para a UI.

## Entrevista — Sprint 3

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/interview/:eventId` | Retorna sessão atual + próxima pergunta calculada |
| POST | `/api/interview/:eventId/answer` | Envia resposta à pergunta atual, retorna a próxima |
| POST | `/api/interview/:eventId/back` | Volta e invalida perguntas dependentes da resposta editada |

`POST /answer` — request: `{ questionKey: string, value: unknown }`.
Response: `{ nextQuestion: Question | null, progressEstimate: number }`.
`nextQuestion: null` sinaliza que a entrevista está pronta para revisão.

## IA / Geração de documentos — Sprint 4

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/ai/generate/:eventId` | Dispara geração de todos os documentos do evento |
| GET | `/api/ai/generate/:eventId/status` | Status por tipo de documento (polling leve) |
| POST | `/api/documents/:documentId/regenerate` | Regenera um único documento (nova versão) |
| PATCH | `/api/documents/:documentId` | Edição manual do conteúdo (também cria versão) |

`POST /generate/:eventId` é assíncrono: retorna `202 Accepted` imediatamente e a UI faz
polling de `/status` (ou usa Server-Sent Events na revisão pós-MVP) para atualizar o
estado pendente/gerando/pronto por documento.

## Exportação — Sprint 5

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/events/:eventId/export-pdf` | Gera PDF executivo e retorna URL assinada do Storage |

## Configurações / Membros — Sprint 2 ✅ implementado

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/organizations/:orgId/members` | Lista membros e papéis |
| POST | `/api/organizations/:orgId/invites` | Convida membro por e-mail |
| PATCH | `/api/organizations/:orgId/members/:userId` | Altera papel do membro |

Lógica em `src/modules/organizations/service.ts`. Convite não tem rota HTTP própria de
"aceitar" — um convite pendente é resolvido implicitamente no cadastro
(`src/modules/auth/service.ts`, `signUp`), que varre `Invitation` por e-mail. Só
`OWNER`/`ADMIN` podem convidar ou alterar papel (`assertCanManageMembers`); a UI
(`/settings`) usa Server Action, as rotas HTTP acima existem para o mesmo caso de
integrações externas descrito em Eventos/Clientes.

## Convenções transversais

- Paginação: `?cursor=&limit=` (cursor-based) é o padrão-alvo, mas **ainda não
  implementada** nas rotas de listagem da Sprint 2 (`GET /events`, `GET /clients`) — o
  volume de dados de uma organização em MVP não justifica a complexidade ainda; entra
  quando a paginação simples (`findMany` sem cursor) começar a doer.
- Toda rota de IA (`/api/ai/*`) passa por rate limiting por organização (ver
  `ARCHITECTURE.md` §6) e grava uma linha em `AiGenerationLog`.
- Nenhuma rota aceita `organizationId` no body — ele vem sempre da sessão, nunca do
  cliente, para impedir troca de tenant por manipulação de payload.
