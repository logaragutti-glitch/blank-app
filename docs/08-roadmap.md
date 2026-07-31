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
  e seus 18 `ProposalComponent`s ordenados num único JSON estruturado. O
  artefato binário real (PDF) foi implementado no item 7 do sequenciamento
  abaixo.
- **Auth/RBAC (concluído):** autenticação real via JWT (`POST
  /auth/register`, `POST /auth/login`, ver `07-architecture-book.md`) e um
  modelo `User` (papel via `UserRole`). Todos os controllers de negócio
  agora exigem um Bearer token e derivam `tenantId`/`organizationId` do
  usuário autenticado — os antigos query params `tenantId`/`organizationId`
  supridos livremente pelo chamador foram removidos.
- **Feedback pós-evento (concluído):** captura estruturada via `POST` /
  `GET /events/:eventId/feedback` (ver `05-database-bible.md`). A
  realimentação automática no Knowledge Graph (promover/despromover
  fornecedores a partir de `supplierPerformance`) foi implementada no
  item 5 do sequenciamento abaixo.
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
  Gate de aprovação formal e API de fornecedores/análise financeira: ver
  itens 1–3 do sequenciamento abaixo (todos concluídos).
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
2. **API de leitura de `Supplier` (concluído):**
   `GET /knowledge-graph/suppliers` e `.../suppliers/:id`
   (`apps/api/src/modules/knowledge-graph`) — mesmo padrão de
   `styles`/`materials`/`venues`. `Supplier.preferredVenueIds` achata a
   relação `VenuePreferredSupplier` (many-to-many) num array de ids, mesmo
   padrão de `Material.compatibleStyleIds`. Seed ganhou um exemplo
   concreto ("Flores da Serra", fornecedor preferencial da Villa Massari)
   para o endpoint não ficar vazio por padrão. Ainda não implementado:
   qualquer escrita/CRUD sobre fornecedores (só leitura por enquanto).
3. **Agente 4 completo — análise financeira (concluído):**
   `POST`/`GET /production/proposals/:proposalId/budget-analysis`
   (mesmo gate de aprovação do item 1, mesmo padrão de artefato 1:1 por
   Proposal do `ProductionPlan` — regenerar substitui por completo).
   Regra de ouro estendida: a IA (Agente 4) nunca inventa um **custo** —
   só estima uma **quantidade** realista por material, e só para materiais
   que já têm um custo real conhecido no catálogo (`Material.
   estimatedUnitCost`, adicionado nesta etapa). Todo o cálculo financeiro
   é determinístico em código, nunca no modelo: custo da linha (custo
   unitário × quantidade estimada), fornecedor mais barato por categoria
   (`Supplier.estimatedCost`, também novo, preferindo fornecedores já
   marcados como preferenciais no venue do evento, com fallback para
   qualquer fornecedor com custo conhecido), margem
   (`Proposal.investmentAmount − custo total estimado`) e "cabe no
   orçamento?" (`custo total estimado <= Event.budgetAmount`).
   `hasIncompleteData` sinaliza quando não há material ou fornecedor com
   custo conhecido suficiente para uma análise completa — a resposta
   nunca é forçada com dados fictícios nesse caso. Tela `apps/web` em
   `/projects/:eventId/producao` ganhou a seção "Análise financeira" com
   o mesmo padrão de geração/regeneração das outras seções. Ainda não
   implementado: custo de mão de obra de montagem/desmontagem (deixado de
   fora deliberadamente — não há nenhum dado real no catálogo hoje que
   permita estimar isso sem inventar números).
4. **Modo Produção (UI) (concluído):** o hub do projeto
   (`apps/web/src/app/projects/[eventId]/page.tsx`) muda de forma quando
   `Proposal.status === "APPROVED"` — não é uma tela nova, é uma transição
   de modo sobre os mesmos dados (`06-ui-bible.md`). Nesse modo aparecem
   horário da cerimônia, checklist operacional e cronograma de montagem
   (`ProductionPlan`) e fornecedores recomendados (`BudgetAnalysis.
   bestValueSuppliers`), com CTA para gerar cada um na tela `/producao`
   quando ainda não existem. "Equipes" não é implementado como entidade
   própria — não existe nenhum dado real de equipe/staff no schema hoje;
   o checklist já cobre a categoria "Equipe" como texto (mesmo padrão de
   `ChecklistItem.category`), mas uma entidade de equipe real (membros,
   atribuições) ficaria para um item futuro caso vire prioridade.
5. **Feedback → Knowledge Graph (concluído):** `supplierPerformance`
   (`{ supplierId, rating 1-5, notes? }`) é o único campo do feedback que
   é dado real e estruturado o bastante para realimentar o Knowledge
   Graph sem uma IA especular sobre texto livre — `POST
   /events/:eventId/feedback` agora aciona, para cada entrada com um
   `supplierId` real (`apps/api/src/modules/feedback/
   supplier-reconciliation.ts`, heurística pura, sem IA, mesmo padrão de
   `wow-score.ts`): nota 4-5 promove o fornecedor a preferencial no venue
   do evento (`VenuePreferredSupplier`), nota 1-2 remove essa preferência,
   nota 3 não altera nada, e sempre anexa uma linha datada a
   `Supplier.performanceNotes`. Um `supplierId` desconhecido é ignorado
   silenciosamente. Ainda não implementado (deliberadamente, ver item 3):
   ajustar "scores de compatibilidade de estilo" a partir de
   `whatDelighted`/`setupAdjustments`/`whatWorkedForSpaceType` — são
   campos de texto livre, e não existe hoje nenhum campo de score
   numérico por par material×estilo no schema; fazer isso exigiria uma
   IA interpretando texto livre, o que arriscaria inventar um sinal que
   o usuário nunca deu de fato.
6. **Edição manual campo a campo (concluído):**
   `PATCH /creative/proposals/:proposalId/components/:componentType`
   (`apps/api/src/modules/creative`) mescla superficialmente os campos
   enviados no `content` já existente do componente — uma edição parcial
   (ex.: só `title`) nunca apaga campos irmãos (ex.: `renderStorageKey`
   de um render já gerado). 404 se a proposta ou o componente daquele
   tipo ainda não existirem (edição manual pressupõe que o componente já
   foi gerado ao menos uma vez). Tela `apps/web` em `/projects/:eventId/editor`
   ganhou um botão "Editar" por card (`ProposalComponentCard`), com um
   formulário específico por formato de `content` — espelhando
   exatamente o switch já usado para exibição: Capa (nome do conceito/
   nomes do casal/espaço), Paleta e Moodboard (listas separadas por
   vírgula), Cronograma (título/descrição por etapa já existente, sem
   adicionar/remover etapas nesta primeira versão), Investimento (itens
   incluídos, valor, moeda), e o par título/descrição (ou nome/texto,
   conforme o que já existir) para os demais componentes narrativos.
7. **PDF/apresentação real (concluído):**
   `GET /creative/proposals/:proposalId/document/pdf`
   (`apps/api/src/modules/creative/proposal-pdf-builder.ts`, via `pdfkit`)
   gera o arquivo binário de verdade, um componente por página, na mesma
   ordem já usada pelo JSON (`ProposalComponent.order`, que já codifica as
   regras de ouro de `02-brand-bible.md` — nunca abrir com preço, conceito
   nomeado antes de tudo, moodboard incluso, investimento por último).
   Recebe só os componentes (nunca a `Proposal` inteira) — o WOW Score é
   interno e nunca deve chegar a um artefato client-facing
   (`04-ai-bible.md`: "Nunca exposto ao cliente"). Cada render conceitual
   já gerado é buscado por bytes reais (`StoragePort.download`, novo — só
   existia `getSignedDownloadUrl`, que serve para um `<img src>` no
   navegador mas não para embutir a imagem dentro de um PDF) e embutido na
   página do componente; um render ausente/expirado/corrompido é
   simplesmente pulado (nunca derruba o documento inteiro). A Paleta
   renderiza os nomes das cores como texto — nunca inventa um valor hex
   para pintar um swatch visual que não existe nos dados reais. Gerado
   síncrono via HTTP (não RabbitMQ, apesar de `07-architecture-book.md`
   cogitar mensageria para esse fluxo) — layout de texto + poucas imagens
   já geradas não é lento o bastante para justificar essa complexidade
   agora, mesmo padrão pragmático já usado pelo resto da API. Tela
   `apps/web` em `/projects/:eventId/proposta` ganhou um botão "Baixar
   PDF".
8. **Canvas do Evento (escopo reduzido, concluído):**
   `GET /projects/:eventId/canvas` (`apps/api/src/modules/projects`) monta
   um retrato real e somente-leitura de tudo que já está conectado a este
   Evento no Knowledge Graph — Cliente, Espaço, Flores, Mobiliário, Luz,
   Música, Gastronomia, Experiência — narrowed pelo Diagnóstico Criativo
   quando um existe (mesmo padrão de "grounded no catálogo real" do resto
   do sistema), com fallback pro catálogo completo quando não. Cada nó
   traz `hasData: false` quando nada foi cadastrado ainda (ex.: nenhum
   `Supplier` de categoria `MUSIC`/`CATERING` foi seedado) — um sinal
   honesto, não um bug. **Deliberadamente não implementa** o Rule Engine /
   Event Impact Engine com recálculo de impacto em cascata descrito em
   `04-ai-bible.md`/`06-ui-bible.md` (ex.: "mudar o horário da cerimônia
   recomenda reforçar a iluminação") — isso exigiria regras de negócio
   reais que não existem em nenhum lugar do sistema hoje, e inventá-las
   quebraria a mesma regra de ouro seguida no resto do código (nunca
   fabricar dado/comportamento sem uma fonte real). Tela `apps/web` em
   `/projects/:eventId/canvas`: um quadro radial (Evento no centro, os 8
   nós ao redor, conectados por linhas), com uma micro-animação de entrada
   e uma leve "respiração" contínua nos cartões (06-ui-bible.md: "reforça
   a metáfora do Evento Vivo") — sem edição/drag-and-drop dos nós, sem
   reorganização em tempo real, ainda.
9. **`apps/admin`** e **`apps/mobile`** — hoje são só scaffolds Next.js/Expo,
   sem telas de produto reais.

Independente dessa sequência (não bloqueia nem é bloqueado por nenhum
item acima, pode entrar em paralelo a qualquer momento): infraestrutura de
produção — deploy real de `apps/api` (hoje só roda localmente via Docker
Compose), observabilidade além de logs, recuperação de senha e convite de
membros de equipe.

Este sequenciamento é uma sugestão de trabalho, não uma regra da
Constituição — pode ser ajustado conforme prioridade de negócio.
