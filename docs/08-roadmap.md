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
- **Sprint 5+:** renders conceituais, módulos de produção/cronograma/
  checklist, UI do produto.

Este sequenciamento é uma sugestão de trabalho, não uma regra da
Constituição — pode ser ajustado conforme prioridade de negócio.
