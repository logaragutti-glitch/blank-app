# EVE OS — Architecture Book

## Diagrama lógico (visão inicial)

```
          [ Front-end ] <---> [ API Gateway ]
                                    |
                        [ AI ORCHESTRATOR ]
                                    |
      +-----------------------------+-----------------------------+
      |                             |                             |
[ Briefing Engine ]        [ Creative Engine ]          [ Knowledge Graph ]
```

- **Briefing Engine** — recebe o formulário do cliente e as imagens de
  inspiração; produz o Diagnóstico Criativo (ver `04-ai-bible.md`).
- **Creative Engine** — a partir do Diagnóstico, consulta o Knowledge
  Graph e gera conceito, paleta, moodboard e seleção de componentes da
  proposta.
- **Knowledge Graph** — base de conhecimento estruturado (estilos,
  flores/materiais, espaços, fornecedores, compatibilidades e scores),
  descrita em detalhe em `05-database-bible.md`.

## As camadas do sistema (numeração oficial das camadas)

A documentação de produto refina o diagrama acima em camadas numeradas.
As camadas 2, 4, 5 e 6 ainda não foram detalhadas nas sessões de
planejamento registradas — permanecem como lacuna a preencher, não devem
ser inventadas.

```
EVE OS
Front-end  |  API
--------------------------------------
EVENT ENGINE
Briefing Engine | Creative Engine | Knowledge Platform
--------------------------------------
AI ORCHESTRATOR
```

> **Reconciliação de divergência:** este diagrama em blocos empilha
> Front-end/API acima e AI Orchestrator abaixo do Event Engine, enquanto
> o "Diagrama lógico" no topo deste documento desenha o AI Orchestrator
> **entre** a API e os três motores (ou seja, no meio, não embaixo).
> Tratamos isso como duas visualizações do mesmo grafo, não uma
> contradição de fluxo: o diagrama em blocos é uma listagem de camadas
> por responsabilidade (não codifica ordem de chamada), enquanto o
> diagrama lógico é a visão autoritativa de fluxo de chamada real —
> `Front-end → API Gateway → AI Orchestrator → {Briefing Engine,
> Creative Engine, Knowledge Platform}`. Ou seja: o AI Orchestrator
> recebe a requisição da API e é quem decide quais dos três serviços do
> Event Engine acionar — ele não fica "abaixo" deles em nenhum sentido de
> dependência. Esta é uma decisão editorial de reconciliação, não uma
> confirmação vinda da sessão original; se houver uma ordem diferente na
> intenção original, ela deve substituir esta nota.

- **Camada 1 — Front-end.** Responsável apenas pela experiência. Ela não
  "pensa", apenas apresenta. Funções: Dashboard, Projetos, Editor. Toda
  lógica de domínio fica fora desta camada (`apps/web`, `apps/admin`,
  `apps/mobile`).
- **Camada 3 — Event Engine.** O núcleo do sistema — tudo é modelado como
  evento (no sentido de "acontecimento", não confundir com o agregado
  `Event`/GENOME). Composta por três serviços: Briefing Engine, Creative
  Engine e Knowledge Platform (a camada de acesso ao Knowledge Graph).
  Exemplo de fluxo interno: `Novo Projeto → Imagem enviada → Briefing
  atualizado` — cada mudança de estado é um evento que outros
  componentes podem reagir a ele (ver uso do RabbitMQ abaixo).
- **Camada 7 — AI Orchestration.** Coordena os agentes de IA descritos em
  `04-ai-bible.md`, incluindo o Rule Engine e o Event Impact Engine.
  Provavelmente o componente mais importante do sistema — é aqui que o
  aprendizado incremental (ex.: padrão Tulipas→Lisianthus) é aplicado.

Este diagrama já corresponde ao scaffold do Sprint 0: `apps/api`
(NestJS) é o API Gateway/orquestrador da Camada 1; o Knowledge Graph vive
no Postgres (+ pgvector para busca semântica de referências visuais e
estilos); Briefing/Creative Engine (Camada 3) serão módulos de domínio
dentro de `apps/api` (ou serviços dedicados, se a carga de IA justificar
separá-los); a Camada 7 (AI Orchestration) é o candidato natural a um
serviço/módulo dedicado dado seu papel central.

## Bancos de dados (dois bancos com propósitos distintos)

- **Banco Operacional (PostgreSQL):** Clientes, Projetos, Agenda,
  Financeiro — dados transacionais/relacionais do negócio.
- **Banco Vetorial (pgvector, mesma instância Postgres):** Embeddings,
  Referências, Imagens, Semântica, Busca Inteligente — usado pelo Agente
  2 (Vision AI) e pelo Briefing Engine para interpretar inspirações
  visuais por similaridade semântica.

## Outras versões e verticais do produto

O EVE OS nasce para casamentos (Tia Bia Festas), mas a arquitetura de
domínio (GENOME, Knowledge Graph, agentes) é desenhada para se
especializar em verticais adicionais no futuro, cada uma reaproveitando
o mesmo núcleo (Camadas 1, 3 e 7) com um Knowledge Graph próprio:

- **EVE Kids** — festas infantis.
- **EVE Destination** — destination weddings.
- **EVE Venue** — para espaços de eventos.
- **EVE Hotel** — para hotéis e resorts.
- **EVE Convention** — para centros de convenções.
- **EVE Academy** — treinamento baseado na metodologia (Método Bia
  Azevedo®), ver `08-roadmap.md`.

Nenhuma dessas verticais está no escopo do MVP (ver `03-product-spec.md`)
— são registradas aqui para que o modelo de domínio (ex.: `EventStyle`,
`Venue`) não seja acidentalmente acoplado apenas ao caso de casamentos
onde isso puder ser evitado sem custo extra de complexidade.

## Stack técnico (já implementado no Sprint 0 — ver raiz do monorepo)

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js + React + TypeScript (`apps/web`, `apps/admin`) |
| Mobile | React Native (`apps/mobile`) |
| Backend | NestJS + TypeScript (`apps/api`) |
| Banco relacional | PostgreSQL |
| Banco vetorial | pgvector (extensão do Postgres, já habilitada em `infra/docker/postgres/init/00-extensions.sql`) |
| Cache | Redis |
| Busca | OpenSearch |
| Mensageria | RabbitMQ |
| Storage | Compatível com S3 (MinIO localmente, `apps/api/src/infrastructure/storage`) |
| Infra | Docker / Docker Compose / Kubernetes |
| Vision AI (Agente 2) | Anthropic Claude (vision), decisão tomada no Sprint 2 |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims), decisão tomada no Sprint 2 |

## Provedores de IA (decisão do Sprint 2)

A Anthropic não oferece API de embeddings própria (parceria oficial dela é
com a Voyage AI), então os dois provedores de IA do sistema são
distintos e desacoplados via portas próprias, cada um com uma única
responsabilidade:

- **Agente 2 / Vision AI** (`src/modules/briefing/ai/vision-analysis.port.ts`)
  — implementado por `AnthropicVisionAnalysisProvider`, usando a Messages
  API da Anthropic com tool-use forçado (`tool_choice`) para garantir saída
  estruturada, em vez de pedir "responda em JSON" em texto livre. O prompt
  vive em `src/modules/briefing/ai/prompts/vision-analysis.prompt.ts` com
  uma constante de versão (`VISION_ANALYSIS_PROMPT_VERSION`), nunca inline
  no código do provider — conforme a regra de IA do prompt mestre do
  projeto ("nenhum prompt pode ficar hardcoded, todos devem ser
  versionados").
- **Embeddings** (`src/infrastructure/ai/embedding.port.ts`) — implementado
  por `OpenAiEmbeddingProvider`, usando `text-embedding-3-small` com 1536
  dimensões (exatamente a largura das colunas `vector(1536)` em
  `InspirationImage.embedding` e `EventStyle.embedding`). Vive num módulo
  global (`AiModule`) em vez de dentro do Briefing, porque é consumido
  tanto pelo upload de imagens de inspiração quanto pela busca semântica de
  `EventStyle` no Knowledge Graph.

Ambos os clientes de SDK são inicializados de forma preguiçosa (lazy) —
não no construtor da classe, mas no primeiro uso real — porque o SDK da
OpenAI lança exceção imediatamente na construção se `OPENAI_API_KEY` não
estiver definida, o que derrubaria o boot inteiro do NestJS mesmo em
ambientes sem as chaves configuradas (ex.: rodando só a parte de
Knowledge Graph, sem nunca chamar o pipeline de briefing/imagens).

## Autenticação e RBAC (`apps/api/src/modules/auth`)

Preenche a lacuna citada acima: até este ponto, `tenantId`/`organizationId`
eram passados como query params sem qualquer validação — qualquer chamador
podia se declarar de qualquer organização. Isso foi substituído por
autenticação real:

- **Modelo `User`** (`schema.prisma`) — pessoa que opera o sistema (a Bia e
  sua equipe), nunca o casal/cliente (`Client` continua sem login).
  `role` é um enum simples (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`);
  `passwordHash` nunca faz parte do tipo de domínio `User` compartilhado em
  `@eve-os/types` — só existe na camada de repositório do módulo de auth.
- **`POST /auth/register`** — auto-registro numa Organization já existente
  (o provisionamento de Tenant/Organization em si continua sendo um fluxo
  administrativo não implementado); todo usuário auto-registrado recebe o
  papel padrão `MEMBER`. Senha com hash via bcrypt (10 rounds).
- **`POST /auth/login`** — retorna um JWT (`@nestjs/jwt`, `HS256`,
  `JWT_SECRET`, expiração de 24h) cujo payload (`sub`, `tenantId`,
  `organizationId`, `role`, `email`) é exatamente o que vira `req.user`
  depois de validado.
- **`JwtAuthGuard`** — registrado globalmente (`APP_GUARD`, `AuthModule`);
  toda rota exige um JWT válido por padrão. Use o decorator `@Public()`
  para isentar uma rota (hoje: `/auth/register`, `/auth/login`, `/health`).
- **`RolesGuard` + `@Roles(...)`** — também global; sem `@Roles()` numa
  rota, qualquer usuário autenticado tem acesso. Existe como infraestrutura
  pronta para restringir operações por papel assim que regras de negócio
  específicas por papel forem definidas (nenhuma foi documentada ainda).
- **`@CurrentUser()`** — decorator de parâmetro que lê `req.user`. Todos os
  controllers de negócio (`BriefingController`, `KnowledgeGraphController`,
  `CreativeController`) agora derivam `tenantId`/`organizationId` daqui, em
  vez de aceitá-los como query params supridos pelo chamador.

## Uso do pgvector no domínio

O banco vetorial existe especificamente para o Briefing Engine: embeddings
das imagens de inspiração e das descrições de estilo do Knowledge Graph
permitem buscar, por similaridade semântica, quais estilos/materiais
catalogados mais se aproximam do que o cliente enviou como referência —
essa é a ponte técnica entre "fotos soltas de inspiração" e "estilo
predominante" no Motor de Interpretação.

O campo `InspirationImage.embedding` é declarado como
`Unsupported("vector(1536)")` no schema Prisma — o Prisma Client não
consegue ler/escrever esse tipo de coluna pela API normal, então a escrita
é feita via `$executeRaw` (ver `PrismaInspirationImageRepository.setEmbedding`),
sempre parametrizado (nunca concatenação de string) para evitar SQL
injection. A busca semântica em si (consultas usando o operador `<=>` do
pgvector) ainda não foi implementada — é o próximo passo natural do
Briefing/Creative Engine.

## Uso do RabbitMQ

Geração de propostas (Briefing Engine → Creative Engine → renderização do
PDF/apresentação) é um fluxo assíncrono e potencialmente demorado
(chamadas a modelos de IA, geração de imagens/renders). Deve ser modelado
como mensageria orientada a eventos, não como uma chamada HTTP síncrona
bloqueante.

> **Nota de implementação (renderização do PDF):** por enquanto, `GET
> /creative/proposals/:proposalId/document/pdf`
> (`apps/api/src/modules/creative/proposal-pdf-builder.ts`) é uma chamada
> HTTP síncrona, não mensageria — o mesmo desvio pragmático já usado pelo
> resto da API (as chamadas de IA de Agente 1/3/4 e a geração de renders
> também são HTTP síncrono com 503 em caso de falha, não RabbitMQ).
> Diferente da geração de conteúdo via IA, montar o PDF a partir de
> componentes já gerados e renders já persistidos é rápido o bastante
> (layout de texto + poucas imagens) para não justificar a complexidade de
> uma fila agora. RabbitMQ continua provisionado no Docker Compose mas
> ainda não é usado por nenhum fluxo real do sistema — ver `08-roadmap.md`
> (infraestrutura de produção).

## Uso do OpenSearch

Busca textual/facetada sobre o Knowledge Graph (estilos, fornecedores,
projetos anteriores) e sobre o histórico de propostas já geradas.

## Relação com o monorepo do Sprint 0

Nenhuma mudança de stack é necessária a partir daqui — o que falta é
**domínio**, não infraestrutura:

- Módulos NestJS de domínio (`ClientProfile`, `Venue`, `Supplier`,
  `EventStyle`, `Material`, `Proposal`, `ProposalComponent`,
  `PostEventFeedback` — ver `05-database-bible.md`).
- Migrations reais no Postgres para essas entidades.
- Integração de um provedor de LLM para os agentes descritos em
  `04-ai-bible.md` (Briefing/Creative Engine, Agente de Budget etc.),
  desacoplada e com prompts versionados (nunca hardcoded), conforme
  exigido pela seção de IA do prompt mestre do projeto.
