# EVE OS — AI Bible

## O Modelo EVE

Todo projeto é organizado em três grandes dimensões (E-V-E):

- **E — Essência:** Quem são os clientes? Como eles vivem? O que
  valorizam? Qual é o estilo de vida? Quais lembranças querem criar?
- **V — Visão:** Como será o evento? Qual atmosfera queremos construir?
  Qual é o conceito criativo? Qual emoção será dominante?
- **E — Execução:** Como tudo acontecerá? Quem monta? Quem entrega?
  Quando? Qual fornecedor? Quais materiais?

## O Diagnóstico Criativo

Em vez de gerar um orçamento/proposta diretamente a partir do briefing, a
IA primeiro produz um documento **interno** chamado Diagnóstico Criativo.
Ele **não é mostrado ao cliente** — serve como base estruturada para
todas as decisões seguintes (conceito, paleta, moodboard, seleção de
componentes, texto da proposta).

Exemplo de saída do Diagnóstico Criativo:

```
Perfil do casal: Romântico contemporâneo.
Atmosfera desejada: Elegância leve e acolhedora.
```

E, de forma mais completa (combinando briefing + Knowledge Graph):

```
O casal demonstra preferência por um estilo Garden Fine Art, com
predominância de tons rosé, lavanda e verde sálvia, flores como peônias
e lisianthus, mobiliário em madeira clara e iluminação quente.
```

Esse resumo interno já serve como base estruturada (não texto livre) para
o restante do motor de geração.

> **Implementação (Sprint 3):** `POST /creative/:eventId/diagnostico-criativo`
> (`apps/api/src/modules/creative`) gera e persiste o Diagnóstico Criativo
> como o campo `Proposal.diagnosticoCriativo`. O provider
> (`AnthropicDiagnosticoCriativoProvider`) usa Claude com tool-use forçado
> para saída estruturada; o prompt vive em
> `ai/prompts/diagnostico-criativo.prompt.ts`, versionado
> (`DIAGNOSTICO_CRIATIVO_PROMPT_VERSION`). O modelo é grounded no catálogo
> real do Knowledge Graph — recebe a lista de `EventStyle`s candidatos e de
> `Material`s (com a flag `neverRecommend`) e é instruído a nunca escolher
> um estilo ou material fora dessas listas.

> **Implementação (Sprint 3):** a lista de `EventStyle`s candidatos não é
> mais sempre o catálogo completo. Quando o evento tem imagens de
> inspiração já analisadas (`InspirationImage.status = ANALYZED`), suas
> descrições (Agente 2 / Vision AI) são combinadas e reembedded, e
> `EventStyleRepository.findSimilarByEmbedding` faz uma busca real por
> similaridade de cosseno (operador pgvector `<=>`) contra os embeddings
> de estilo (`EventStyle.embedding`, backfilled via
> `POST /knowledge-graph/styles/:id/backfill-embedding`), retornando os 5
> estilos mais próximos. Sem imagens analisadas, sem estilos com embedding
> ainda, ou em caso de falha do provider de embeddings, o fluxo cai de
> volta para o catálogo completo (`findAll`) — a busca semântica é uma
> melhoria de qualidade, nunca um requisito para gerar o diagnóstico.

## O Motor de Interpretação

A IA nunca responde apenas com base em uma foto isolada. Ela combina:

- respostas do formulário/briefing;
- referências visuais enviadas pelo cliente;
- características do espaço/venue (cadastro permanente, ver
  `05-database-bible.md`);
- orçamento disponível;
- conhecimento acumulado da marca (Knowledge Graph).

Perguntas que o Motor de Interpretação deve responder para cada projeto:

- Qual é o estilo predominante?
- Qual emoção o casal deseja transmitir?
- Qual paleta traduz melhor essa emoção?
- Qual mobiliário reforça esse conceito?
- Qual iluminação valoriza o espaço?
- O projeto conversa com a arquitetura do local?

## O Índice WOW

Toda proposta gerada recebe um indicador interno, o **WOW Score** (0 a
100), que mede originalidade e coerência do projeto. É um score de
qualidade/diferenciação usado internamente (por ex., para sinalizar
propostas que precisam de revisão humana antes de serem enviadas), não um
número exposto ao cliente.

> **Implementação (Sprint 4):** `computeWowScore`
> (`apps/api/src/modules/creative/wow-score.ts`) é uma heurística v1,
> deliberadamente simples e documentada no próprio código-fonte — a
> Constituição não define uma fórmula exata, apenas o conceito e um
> exemplo de decomposição por dimensões emocionais. Combina duas partes:
> **coerência** (o quão próximo `Event.dnaScores` está do
> `EventStyle.dimensionScores` do estilo casado pelo Agente 1) e
> **originalidade** (o desvio-padrão das dimensões emocionais do evento,
> premiando uma assinatura emocional distintiva sobre um perfil plano e
> genérico). É calculado automaticamente ao gerar o Diagnóstico Criativo
> (`POST /creative/:eventId/diagnostico-criativo`) e persistido em
> `Proposal.wowScore` — retorna `null` quando o evento ainda não tem
> `dnaScores` capturados. Deve ser recalibrado com dados reais assim que
> houver propostas suficientes para validar a fórmula.

Exemplo de decomposição de score por evento (dimensões emocionais
percentuais, usadas como insumo do WOW Score e da seleção de
componentes):

```
Romance...........94%
Elegância.........91%
Natureza..........88%
Luxo..............72%
Modernidade.......40%
Minimalismo.......28%
Alegria...........85%
Formalidade.......67%
```

## Agentes de IA do sistema (arquitetura multi-agente)

O sistema não deve ser um único prompt monolítico. É composto por agentes
especializados, cada um com missão, entrada, saída, ferramentas e
restrições próprias (ver Engineering Handbook para o contrato técnico).
A numeração abaixo é a numeração de referência usada na documentação do
produto — deve ser preservada em código/nomes de módulo para
rastreabilidade entre docs e implementação:

- **Agente 1 — Briefing Engine / Agente de Interpretação** — lê o
  formulário e as imagens de inspiração, produz o Diagnóstico Criativo.
- **Agente 2 — Vision AI** — interpreta as imagens de inspiração
  enviadas pelo cliente. Reconhece: flores, cadeiras, mesas, louças,
  arquitetura, iluminação, tecidos, cores, estilos, tendências. Transforma
  tudo isso em dados estruturados (não em texto livre) que alimentam o
  Diagnóstico Criativo do Agente 1 e a consulta ao Knowledge Graph.
- **Agente 3 — Creative Engine / Agente de Conceito** — a partir do
  Diagnóstico, gera conceito nomeado, paleta, moodboard e seleção de
  componentes.

  > **Implementação (Sprint 3):** `POST /creative/proposals/:proposalId/components`
  > (`apps/api/src/modules/creative`) gera e persiste os 18
  > `ProposalComponent`s do Capítulo 7. O provider
  > (`AnthropicProposalComponentsProvider`) usa Claude com tool-use forçado
  > para gerar, numa única chamada, os 12 componentes narrativos (Conceito,
  > História do casal, Entrada, Cerimônia, Mesa do bolo, Lounge, Mesas dos
  > convidados, Bar, Buffet, Pista, Iluminação, Florais); o prompt vive em
  > `ai/prompts/proposal-components.prompt.ts`, versionado
  > (`PROPOSAL_COMPONENTS_PROMPT_VERSION`). Os outros 6 (Capa, História da
  > Bia, Moodboard, Paleta, Cronograma, Investimento) são montados
  > deterministicamente em código (`proposal-component-builder.ts`) a
  > partir de dados já conhecidos — Bia_Story e o Cronograma/Investimento
  > seguem literalmente as regras de ouro de `02-brand-bible.md`, nunca
  > exigindo uma chamada de IA. O nome do conceito escolhido é gravado de
  > volta em `Proposal.conceptName`.
- **Agente 4 — Diretor de Produção** — recebe o projeto já aprovado pelo
  cliente e protege a lucratividade do evento. Responde perguntas como:
  - Esse projeto cabe no orçamento aprovado (ex.: R$ 30.000)?
  - Qual margem teremos?
  - Quanto gastar com flores?
  - Qual fornecedor oferece melhor custo-benefício?
  - Quanto custa montar? Quanto custa desmontar?

  Também mapeia, evento a evento, para aprendizado contínuo: tempo de
  montagem, quantidade de flores usadas, problemas, elogios, custos,
  lucro, clima do dia, tempo de cerimônia, fotografias geradas. Com o
  tempo, identifica padrões (ex.: qual fornecedor realmente entrega
  melhor custo-benefício para determinado tipo de espaço).
- **Agente 5 — Agente de Projetos** — organiza o acompanhamento do
  projeto do fechamento até a execução (checklists, reuniões,
  aprovações). *(Nota de reconciliação: a sessão original citou este
  agente sem numeração explícita; o número 5 foi atribuído aqui apenas
  para manter a sequência de referência consistente com os Agentes 1–4,
  que já são numerados — não representa uma ordem de execução ou
  prioridade declarada na sessão.)*

### Aprendizado incremental (exemplo de referência)

> A Bia sempre troca Tulipas por Lisianthus.

Depois de algumas ocorrências desse padrão em projetos aprovados, a IA
deve entender que isso faz parte da identidade criativa da empresa (não
uma coincidência) e passar a **priorizar essa escolha** proativamente em
novos diagnósticos com perfil compatível — isto é, o sistema de
aprendizado observa decisões humanas recorrentes e as promove a regras do
Knowledge Graph (ver `05-database-bible.md`), fechando o ciclo descrito no
Capítulo 9 da Constituição.

## Rule Engine e Event Impact Engine

Diferente de um gerador de texto que só produz a proposta uma vez, o EVE
OS mantém o Evento como um objeto vivo (ver `EVE Foundation — Artigo 1`
em `01-constitution.md`) e recalcula impactos em tempo real sempre que
algo muda. Isso é responsabilidade de dois componentes do AI Orchestrator:

- **Rule Engine** — aplica as regras de compatibilidade do Knowledge
  Graph (estilo × material, espaço × estrutura, orçamento × escopo) a
  cada alteração no projeto.
- **Event Impact Engine** — a partir das regras aplicadas, calcula e
  apresenta ao usuário as consequências em cascata de uma mudança,
  instantaneamente.

**Exemplo 1 — mudança de horário da cerimônia** (de 16h30 para 17h30):

- ☀️ A luz natural será menor.
- 📷 O fotógrafo precisará antecipar o making of.
- 🍸 O coquetel deverá começar mais tarde.
- 💡 Recomendação automática: reforçar a iluminação decorativa.

**Exemplo 2 — troca de flor** (ex.: substituição por Lisianthus):

- ✅ Economia estimada de R$ 8.500.
- ✅ Disponibilidade aumenta para 100%.
- ✅ Conceito Fine Art preservado.
- ✅ Nenhuma alteração na narrativa.

Essas duas saídas devem aparecer em menos de um segundo/instantaneamente
do ponto de vista do usuário — ou seja, tecnicamente isso exige que as
regras de compatibilidade estejam pré-computadas/indexadas (Knowledge
Graph + pgvector/OpenSearch), não recalculadas via chamada de LLM síncrona
a cada interação.

## Regras de ouro específicas da IA

Herdadas da Constituição (`01-constitution.md`, Capítulo 8) e aplicadas
diretamente ao comportamento dos agentes:

- Nunca copiar projetos anteriores literalmente — cada saída deve ser
  gerada a partir do Diagnóstico Criativo daquele cliente específico.
- Nunca repetir textos idênticos entre clientes.
- Nunca gerar propostas incompatíveis com o orçamento informado.
- Nunca sugerir estruturas/elementos inviáveis para o espaço cadastrado.
- Nunca misturar estilos conflitantes sem justificativa explícita no
  Diagnóstico.
- Sempre respeitar a identidade visual da marca (ver `02-brand-bible.md`).

## Renders automáticos (visão de produto, não escopo do Sprint 0/1)

Além de mostrar fotos de inspiração enviadas pelo cliente, a IA deve
eventualmente gerar imagens conceituais dos ambientes com base nas
referências e no conceito do projeto — o casal veria uma representação
visual exclusiva da proposta, não apenas referências genéricas.

> **Implementação:** `POST /creative/proposals/:proposalId/render/:componentType`
> (`apps/api/src/modules/creative`) gera uma imagem hero conceitual para a
> Capa (imagem geral do evento) ou para um dos 10 ambientes narrativos
> individuais (Entrada, Cerimônia, Mesa do bolo, Lounge, Mesas dos
> convidados, Bar, Buffet, Pista, Iluminação, Florais) — `componentType` é
> validado contra `RENDERABLE_COMPONENT_TYPES`
> (`renderable-component-types.ts`), 400 para qualquer outro tipo de
> componente (Paleta, Cronograma, Investimento etc. não têm uma cena
> física para renderizar). `OpenAiConceptualRenderProvider` usa o modelo
> `gpt-image-1` da OpenAI (a Anthropic não tem API de geração de imagens);
> o prompt é montado a partir do conceito nomeado, da atmosfera desejada,
> do estilo predominante, da paleta sugerida e do nome do espaço — para um
> ambiente específico, o prompt também inclui o título/descrição
> narrativos daquele ambiente (já gerados pelo Agente 3), focando a cena
> nele em vez do evento como um todo. Sempre fotografia editorial estilo
> Fine Art, sem pessoas/rostos/texto na imagem. Versionado em
> `ai/prompts/conceptual-render.prompt.ts`
> (`CONCEPTUAL_RENDER_PROMPT_VERSION`). A imagem gerada é salva no storage
> S3-compatível (chave `renders/:proposalId/:componentType-:uuid.png`,
> minúsculo) e referenciada no componente correspondente via
> `content.renderStorageKey`; uma URL assinada
> (`StoragePort.getSignedDownloadUrl`) é computada na hora em toda leitura
> dos componentes/documento, nunca persistida — evita guardar uma URL que
> expira.
