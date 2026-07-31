# EVE OS — Roadmap

## Visão de longo prazo: três ativos integrados

1. **Método Bia Azevedo®** — a metodologia proprietária de design de
   eventos (o conteúdo humano/autoral por trás da Constituição e do
   Brand Bible).
2. **EVE OS (Plataforma)** — o software que opera o método em escala
   (este monorepo).
3. **Academia Bia Azevedo** — escola de formação que ensina o método a
   novos profissionais, usando a mesma lógica de trabalho documentada
   aqui (a Bíblia dobra como currículo).

O EVE OS deve, no futuro, também **treinar novos membros de equipe** com
a mesma lógica de decisão da Bia — ou seja, a documentação em `docs/` não
serve só à IA, serve como material didático da Academia.

## Evolução do produto além da proposta comercial

O sistema deve, com o tempo, gerar não apenas a proposta em PDF, mas:

- listas de materiais;
- cronogramas de montagem;
- checklists operacionais;
- instruções para fornecedores;
- renders/croquis conceituais dos ambientes (ver `04-ai-bible.md`).

## Expansão de mercado

O produto deixa de ser uma ferramenta interna da Tia Bia Festas e se torna
um produto comercial horizontal para:

- decoradores de casamento;
- eventos corporativos;
- festas infantis;
- destination weddings;
- hotéis que realizam eventos.

## Sequenciamento sugerido de sprints (a partir do Sprint 0 já entregue)

- **Sprint 0 (concluído):** monorepo, tooling, infra local (este
  repositório).
- **Sprint 1 (concluído):** modelagem de domínio no Postgres (entidades de
  `05-database-bible.md`), migrations, seed inicial do Knowledge Graph
  com os exemplos documentados (Garden Fine Art, Peônia, Villa Massari
  etc.), API de leitura do Knowledge Graph.
- **Sprint 2 (concluído):** Briefing Engine — captura de formulário/briefing
  (`POST /briefing`) + ingestão de imagens de inspiração com análise
  estruturada (Agente 2 / Vision AI via Anthropic Claude) e embeddings via
  pgvector (OpenAI `text-embedding-3-small`).
- **Sprint 3 (concluído):** geração do Diagnóstico Criativo (Agente 1 / Motor
  de Interpretação, via `POST /creative/:eventId/diagnostico-criativo`),
  persistido como `Proposal`. Combina briefing + imagens analisadas +
  estilos/materiais do Knowledge Graph, sempre grounded no catálogo real
  (nunca inventa materiais fora dele, nunca sugere itens marcados como
  "não recomendar"). Busca semântica real (pgvector `<=>`): `EventStyle.embedding`
  + `EventStyleRepository.findSimilarByEmbedding` narrowam os estilos
  candidatos a partir dos embeddings das imagens de inspiração analisadas,
  com fallback para o catálogo completo. Geração dos 18 componentes
  reutilizáveis do Capítulo 7 (Agente 3 / Creative Engine, via
  `POST /creative/proposals/:proposalId/components`, persistidos como
  `ProposalComponent`): 12 são narrativos (gerados por IA, tool-use forçado,
  seguindo as regras de ouro de `02-brand-bible.md`) e 6 são montados
  deterministicamente em código a partir de dados já conhecidos (Capa,
  História da Bia, Moodboard, Paleta, Cronograma, Investimento) — nunca
  requerem uma chamada de IA.
- **Sprint 4 (concluído):** WOW Score (heurística v1, ver `04-ai-bible.md`)
  computado automaticamente ao gerar o Diagnóstico Criativo e persistido em
  `Proposal.wowScore`. Documento final da proposta via
  `GET /creative/proposals/:proposalId/document`, que combina a `Proposal`
  e seus 18 `ProposalComponent`s ordenados num único JSON estruturado —
  deliberadamente não gera um arquivo binário (PDF), já que ainda não
  existe layout/UI de produto definido para renderizar contra; a
  responsabilidade de virar isso num PDF/apresentação fica com o frontend
  (ou com um Sprint futuro, quando o design existir).
- **Auth/RBAC (concluído):** autenticação real via JWT (`POST
  /auth/register`, `POST /auth/login`, ver `07-architecture-book.md`) e um
  modelo `User` (papel via `UserRole`). Todos os controllers de negócio
  agora exigem um Bearer token e derivam `tenantId`/`organizationId` do
  usuário autenticado — os antigos query params `tenantId`/`organizationId`
  supridos livremente pelo chamador foram removidos.
- **Feedback pós-evento (concluído):** captura estruturada via `POST` /
  `GET /events/:eventId/feedback` (ver `05-database-bible.md`). Ainda não
  implementada: a realimentação automática desse feedback no Knowledge
  Graph (ajustar scores de compatibilidade, promover/despromover
  fornecedores) — é uma capacidade futura distinta, esta entrega só
  cobre a captura do dado.
- **UI do produto (concluído — MVP):** as 5 telas de `03-product-spec.md`
  implementadas em `apps/web`, consumindo a API real: Home (resumo do dia),
  Novo Projeto (briefing em formulário guiado por etapas), Diagnóstico
  Criativo, Editor do Projeto (os 18 `ProposalComponent`s) e Gerar Proposta
  (o documento montado). Autenticação (login/registro) e os tokens de
  design (`packages/ui/src/tokens.ts`, branco quente/grafite/champagne
  gold) também implementados. O "Editor" hoje é somente leitura + botão
  "gerar novamente" — não há edição manual campo a campo de um componente
  individual, já que o backend também não expõe isso ainda (só
  regeneração completa via IA).
- **Renders conceituais (concluído):** `POST
  /creative/proposals/:proposalId/render/:componentType` gera uma imagem
  hero conceitual via OpenAI `gpt-image-1` (ver `04-ai-bible.md`), guardada
  no storage S3-compatível e servida por URL assinada computada na hora.
  Cobre a Capa (imagem geral do evento) e os 10 ambientes narrativos
  (Entrada, Cerimônia, Mesa do bolo, Lounge, Mesas dos convidados, Bar,
  Buffet, Pista, Iluminação, Florais) — `componentType` é validado contra
  essa lista (`RENDERABLE_COMPONENT_TYPES`), 400 para qualquer outro tipo
  (Paleta, Cronograma, Investimento etc. não têm uma cena física para
  renderizar). Para os ambientes, o prompt usa o título/descrição
  narrativos já gerados pelo Agente 3 para aquele ambiente específico, em
  vez do conceito geral do evento.
- **Módulos de produção (concluído):** Agente 4 / Diretor de Produção
  (`04-ai-bible.md`) via `POST`/`GET /production/proposals/:proposalId/plan`
  (`apps/api/src/modules/production`) — transforma uma proposta já
  diagnosticada em três artefatos operacionais: lista de materiais
  (grounded no catálogo real, nunca inventa materiais fora dele nem sugere
  itens marcados "não recomendar", narrowed aos materiais compatíveis com
  o estilo predominante quando há um, com fallback para o catálogo
  utilizável completo), cronograma de montagem/desmontagem do dia (distinto
  do Cronograma comercial já existente no componente `TIMELINE`), e
  checklist operacional (fornecedores, equipe, logística, materiais). Um
  `ProductionPlan` por Proposal (regenerar substitui por completo, mesmo
  padrão do `ProposalComponent`/render). Tela `apps/web` em
  `/projects/:eventId/producao`, acessível a partir do hub do projeto.
  Ainda não implementado: integração com o cadastro real de fornecedores
  (`Supplier`/`VenuePreferredSupplier` já existem no schema mas sem API de
  leitura própria ainda) e o gate de aprovação formal da proposta (o
  `ProposalStatus.APPROVED` existe no enum mas nenhuma rota ainda transiciona
  o status — gerar o plano de produção hoje não exige uma proposta aprovada).
- **Sprint 5+ (sequenciamento detalhado abaixo):** fecha o loop comercial e
  de aprendizado, depois avança para os módulos de produto maiores.

### Sprint 5+ — sequenciamento detalhado

Ordenado por dependência real (o que destrava o quê), não só por
prioridade de negócio:

1. **Fluxo de aprovação formal da proposta (concluído):**
   `POST /creative/proposals/:proposalId/approve` e `.../reject`
   transicionam `Proposal.status` para `APPROVED`/`REJECTED`.
   `POST /production/proposals/:proposalId/plan` agora exige
   `status === "APPROVED"` (400 com mensagem clara apontando para o
   endpoint de aprovação, caso contrário) — antes gerava o plano de
   produção sem nenhum gate. Tela `apps/web` em `/projects/:eventId/proposta`
   ganhou os botões "Aprovar proposta"/"Rejeitar", mostrando o status
   atual; `/producao` mostra uma mensagem específica (com link de volta
   para a proposta) em vez de um erro genérico quando a proposta ainda
   não foi aprovada.
2. **API de leitura de `Supplier`** — repository/endpoint básico de leitura
   sobre a entidade que já existe no schema (`Supplier`,
   `VenuePreferredSupplier`). Pré-requisito direto para o Agente 4
   responder custo/margem e para o Modo Produção listar fornecedores.
3. **Agente 4 completo** — com `Supplier` disponível, responder as
   perguntas de orçamento/margem/custo-benefício de fornecedor descritas
   em `04-ai-bible.md` (hoje o Agente 4 só gera materiais/cronograma/
   checklist, não essas perguntas).
4. **Modo Produção (UI)** — transição de modo sobre os dados do projeto já
   aprovado (checklist, equipes, fornecedores, horários — ver
   `06-ui-bible.md`), depende dos itens 1 e 2.
5. **Feedback → Knowledge Graph** — a captura já existe
   (`PostEventFeedback`); liga automaticamente ao ajuste de scores de
   compatibilidade de estilo e ao status de fornecedores.
6. **Edição manual campo a campo** no Editor do Projeto (hoje só
   regeneração completa via IA).
7. **PDF/apresentação real** da proposta (hoje `GET
   /creative/proposals/:proposalId/document` é só um JSON estruturado).
8. **Canvas do Evento** completo (quadro interativo conectando espaço,
   flores, luz, música, gastronomia, mobiliário e experiência).
9. **`apps/admin`** e **`apps/mobile`** — hoje são só scaffolds Next.js/Expo,
   sem telas de produto reais.

Independente dessa sequência (não bloqueia nem é bloqueado por nenhum
item acima, pode entrar em paralelo a qualquer momento): infraestrutura de
produção — deploy real de `apps/api` (hoje só roda localmente via Docker
Compose), observabilidade além de logs, recuperação de senha e convite de
membros de equipe.

Este sequenciamento é uma sugestão de trabalho, não uma regra da
Constituição — pode ser ajustado conforme prioridade de negócio.
