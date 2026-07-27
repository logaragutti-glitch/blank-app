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

## Entrevista — Sprint 3 ✅ implementado

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/interview/:eventId` | Cria a sessão se não existir e retorna estado + próxima pergunta |
| POST | `/api/interview/:eventId/answer` | Envia resposta (`{ questionKey, rawValue }`), retorna o novo estado |

`POST /answer` — request: `{ questionKey: string, rawValue: string }` (sempre string — o
formulário nunca envia tipos ricos, `src/modules/interview/schema.ts` converte e valida
conforme o tipo da pergunta). Response: o `InterviewState` completo (`session`, `answers`,
`nextQuestion`, `progress`, `readyToComplete`).

**Sem rota `/back` separada** (diferente do que a Sprint 1 havia especulado): "voltar e
editar" é só reenviar uma resposta para uma `questionKey` já respondida — o próprio
`submitAnswer` detecta que já existe uma resposta para aquela chave e invalida somente as
respostas que dependiam dela (ex.: mudar `event_type` descarta as perguntas do ramo antigo,
não a entrevista inteira). Uma rota dedicada seria um endpoint a mais fazendo a mesma coisa
com um nome diferente — simplicidade acima de complexidade.

Não há endpoint para "concluir": `completeInterviewAction` (Server Action) é a única forma,
porque a conclusão sempre precisa redirecionar para `/events/:eventId` no mesmo request —
um cliente HTTP externo que precise disso ganha uma rota própria quando esse caso de uso
existir de verdade.

## IA / Geração de documentos — Sprint 4 ✅ implementado

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/ai/generate/:eventId` | Dispara e aguarda a geração dos 9 documentos do evento |
| POST | `/api/documents/:documentId/regenerate` | Regenera um único documento (nova versão) |
| PATCH | `/api/documents/:documentId` | Edição manual do conteúdo (também cria versão) |

**Sem endpoint de status/polling** (diferente do que a Sprint 1 havia especulado):
`POST /generate/:eventId` (`src/modules/documents/orchestrator.ts`) roda os 9 geradores em
paralelo via `Promise.all` e só responde quando todos terminam — a UI (Server Action
`generateDocumentsAction`) fica com o botão em estado "pendente" durante a chamada, sem
precisar de um segundo endpoint só para consultar progresso. Justificativa: os 9 geradores
rodando em paralelo terminam em segundos, não minutos; um endpoint de polling faria sentido
se a geração virasse uma fila assíncrona de verdade (ver `docs/BACKLOG.md` #34, gatilho
para isso é volume real de uso, não uma preocupação teórica de MVP).

Cada resultado é individual: um documento pode falhar (ex.: `OPENAI_API_KEY` não
configurada) sem impedir os outros de serem gerados — a resposta sempre inclui os 9
resultados com `status: "READY" | "FAILED"` por tipo. `PATCH /documents/:documentId` valida
o `content` enviado contra o mesmo schema Zod usado para validar a resposta da IA
(`src/modules/documents/schemas.ts`) — edição manual e geração por IA nunca podem divergir
de forma (nunca gravam um formato que a UI não sabe renderizar).

Toda geração/regeneração bem-sucedida recalcula o `MemScore` do evento
(`recalculateMemScore`) — inclusive uma edição manual isolada, não só a geração em lote.

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
