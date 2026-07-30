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
  pgvector (OpenAI `text-embedding-3-small`). Ainda faltam: geração do
  Diagnóstico Criativo em si (Agente 1) e busca semântica por similaridade
  sobre os embeddings armazenados — ambos ficam para o Sprint 3.
- **Sprint 3:** Creative Engine — geração do Diagnóstico Criativo e da
  seleção de componentes a partir do Knowledge Graph.
- **Sprint 4:** geração da proposta comercial (componentes reutilizáveis
  do Capítulo 7, aplicando as regras de ouro de `02-brand-bible.md`).
- **Sprint 5+:** WOW Score, feedback pós-evento, renders conceituais,
  módulos de produção/cronograma/checklist.

Este sequenciamento é uma sugestão de trabalho, não uma regra da
Constituição — pode ser ajustado conforme prioridade de negócio.
