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
| Storage | Compatível com S3 |
| Infra | Docker / Docker Compose / Kubernetes |

## Uso do pgvector no domínio

O banco vetorial existe especificamente para o Briefing Engine: embeddings
das imagens de inspiração e das descrições de estilo do Knowledge Graph
permitem buscar, por similaridade semântica, quais estilos/materiais
catalogados mais se aproximam do que o cliente enviou como referência —
essa é a ponte técnica entre "fotos soltas de inspiração" e "estilo
predominante" no Motor de Interpretação.

## Uso do RabbitMQ

Geração de propostas (Briefing Engine → Creative Engine → renderização do
PDF/apresentação) é um fluxo assíncrono e potencialmente demorado
(chamadas a modelos de IA, geração de imagens/renders). Deve ser modelado
como mensageria orientada a eventos, não como uma chamada HTTP síncrona
bloqueante.

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
