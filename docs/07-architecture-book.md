# EVE OS — Architecture Book

## Diagrama lógico

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

Este diagrama já corresponde ao scaffold do Sprint 0: `apps/api`
(NestJS) é o API Gateway/orquestrador; o Knowledge Graph vive no
Postgres (+ pgvector para busca semântica de referências visuais e
estilos); Briefing/Creative Engine serão módulos de domínio dentro de
`apps/api` (ou serviços dedicados, se a carga de IA justificar
separá-los).

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
