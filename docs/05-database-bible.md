# EVE OS — Database Bible

> Convenções técnicas transversais (UUID, timestamps UTC, soft delete,
> audit trail, `tenant_id`/`organization_id`, `version`) já estão
> implementadas em `packages/types/src/tenant.ts`. Este documento descreve
> o **modelo de domínio** que ainda precisa ser modelado como tabelas e
> migrations no Postgres (com pgvector para as buscas semânticas do
> Knowledge Graph).

## Capítulo 2 — O Perfil do Cliente (8 dimensões)

O formulário/briefing deve capturar informações suficientes para montar
um retrato completo do casal/cliente, organizado em 8 dimensões:

1. **Identidade** — nomes, idade, profissão, cidade, religião (quando
   relevante), hobbies.
2. **História** — Como se conheceram? Qual foi o pedido? Existe alguma
   história marcante?
3. **Estilo de Vida** — O casal gosta de praia? Campo? Classificação:
   Extrovertido, Minimalista, Sofisticado, Contemporâneo, Natural,
   Boêmio. Essa classificação é usada em todas as decisões futuras do
   Motor de Interpretação.
4. **Restrições** — orçamento, restrições do local, clima, logística,
   preferências alimentares, acessibilidade.
5–8. **Decoração e logística** — capturadas a partir do formulário real da
   Bia ("Decoração de Casamento"): contato (e-mail, telefone — colunas
   próprias em `Client`, ver abaixo), como conheceu o trabalho, se
   cerimônia e festa são no mesmo local, estilo de decoração desejado
   (reaproveita `lifestyleTags`), paleta de cores, referências visuais
   (texto/link — as fotos em si viram `InspirationImage` de verdade, com
   análise de IA, não só um link salvo num campo), o que definitivamente
   não querem, preferência floral (mista/só natural), quais espaços
   querem decorados, cerimonialista contratada, fornecedores já
   fechados, confirmação da faixa de investimento e observações finais.
   Sem coluna própria para cada uma (evolui independente do domínio
   central) — guardadas em `Client.additionalDetails` (JSON), formato
   exato em `packages/types/src/client.ts` (`BriefingAdditionalDetails`).

## Capítulo — Cadastro de Espaços (Venues)

Cada local possui um "DNA" próprio que deve ser um cadastro **permanente**
e reaproveitável entre eventos diferentes no mesmo espaço:

- restrições estruturais;
- pé-direito;
- pontos de energia/tomadas;
- capacidade;
- mobiliário existente no local;
- clima típico;
- melhores fornecedores já testados naquele espaço;
- histórico de eventos realizados ali.

Exemplo de regra derivada de um cadastro de espaço:

```
Se local = Villa Massari

Sugerir:
- cerimônia externa
- aproveitar a arquitetura
- iluminação quente
- flores em tons suaves
```

## Knowledge Graph — Biblioteca de estilos, flores e materiais

Este é o principal ativo de propriedade intelectual do sistema (mais do
que a IA em si): o conhecimento acumulado da Bia, estruturado como dados
consultáveis em vez de texto solto.

### Exemplo — regra por estilo

```
Se estilo = Garden Fine Art

Sugestão de flores:
- peônias
- lisianthus
- rosas inglesas

Paleta:
- rosé
- verde sálvia
- champagne

Mobiliário:
- madeira clara
- ferro branco

Lounge:
- fibra natural
- linho
```

### Exemplo — ficha técnica de material (flor)

```
Peônia
- Emoção: Romance, Abundância, Delicadeza
- Estações: Primavera
- Compatível com: Garden, Boho, Italiano, Clássico
- Incompatível com: Futurista, Industrial
```

Cada flor/material do catálogo deve ter esse mesmo formato de ficha:
emoção associada, sazonalidade, estilos compatíveis e estilos
incompatíveis (usado pelo Motor de Interpretação para nunca "misturar
estilos conflitantes sem justificativa" — Regra de Ouro nº 5).

### Exemplo — ficha técnica de tecidos/mobiliário (com lista negativa)

Além do que **é** recomendado, a ficha técnica de cada categoria de
material também registra o que **nunca** deve ser sugerido — essa lista
negativa é tão importante quanto a positiva para o Motor de Interpretação:

```
Tecidos:
- Gaze
- Organza

Mobiliário:
- Madeira clara
- Ferro branco
- Fibra natural

Não utilizar:
- Neon
- Acrílico colorido
- LED RGB
```

### Mapeamento de ambientes (Environment/Location dentro de um evento)

Cada evento se decompõe em ambientes físicos padronizados, que servem de
chave para: (a) os componentes reutilizáveis da proposta (Capítulo 7 da
Constituição), (b) o Canvas do Evento, e (c) as regras de compatibilidade
espaço × estilo:

```
Entrada, Cerimônia, Altar, Mesa do bolo, Mesa de doces, Buffet, Bar, ...
```

### Dimensões de estilo (score numérico 0–10, por evento/estilo)

Usadas para calcular compatibilidade e o WOW Score:

```
Luxuoso: 8.0
Natural: 7.8
```
(mais de 100 estilos de eventos devem ser catalogados neste formato ao
longo do tempo, cada um com suas próprias características). Essas notas
nunca são categorias binárias — são sempre intensidades contínuas, e
compõem o "DNA emocional" de cada evento, por exemplo:

```
Evento ID
Romance ........... 94%
Elegância ......... 91%
Natureza .......... 88%
Luxo .............. 72%
Modernidade ....... 40%
Minimalismo ....... 28%
Alegria ........... 85%
Formalidade ....... 67%
```

Esse "DNA" percentual acompanha o projeto do início ao fim — é recalculado
pelo Event Impact Engine (ver `04-ai-bible.md`) sempre que um elemento do
projeto muda, não é calculado apenas uma vez no diagnóstico inicial.

## Feedback pós-evento (Capítulo 9 da Constituição)

Depois de cada evento, deve ser possível registrar, como dado
estruturado e consultável pelo sistema (não apenas conhecimento tácito da
equipe):

- o que encantou os noivos;
- o que gerou ajustes durante a montagem;
- desempenho de cada fornecedor envolvido;
- quais soluções funcionaram melhor naquele tipo de espaço/estilo.

Esse feedback deve realimentar o Knowledge Graph (por exemplo, ajustando
scores de compatibilidade ou promovendo/despromovendo fornecedores para
determinado tipo de espaço).

> **Implementação:** `POST /events/:eventId/feedback` (upsert — captura
> incremental, cada chamada só sobrescreve os campos enviados, os demais
> ficam como estavam) e `GET /events/:eventId/feedback`
> (`apps/api/src/modules/feedback`). `supplierPerformance` é uma lista de
> `{ supplierId, rating (1-5), notes? }` guardada como Json.
>
> **Realimentação automática (concluída):** `supplierPerformance` é o
> único campo de feedback que é dado real e estruturado o suficiente para
> alimentar o Knowledge Graph sem uma IA especular sobre texto livre — os
> outros três campos (`whatDelighted`, `setupAdjustments`,
> `whatWorkedForSpaceType`) continuam sendo apenas captura estruturada,
> sem realimentação automática. A cada `POST` que inclui
> `supplierPerformance`, `FeedbackController` (via
> `supplier-reconciliation.ts`, uma heurística determinística pura, sem
> chamada de IA, mesmo padrão de `wow-score.ts`) para cada entrada com um
> `supplierId` que existe de fato no Knowledge Graph da organização:
> nota 4-5 promove o fornecedor a preferencial no venue deste evento
> (`VenuePreferredSupplier`), nota 1-2 remove essa preferência, nota 3 não
> altera nada (não force um sinal que a nota não carrega), e sempre
> anexa uma linha datada a `Supplier.performanceNotes` com a nota e as
> notas do chamador (nunca inventa comentário). Um `supplierId`
> desconhecido é ignorado silenciosamente — não há nada real para
> reconciliar contra.

## O GENOME — modelo canônico do agregado Evento

Conforme o `EVE Foundation — Artigo 1` (`01-constitution.md`), o Evento é
o objeto vivo central do sistema; tudo mais (PDF, orçamento, cronograma)
é uma representação derivada dele. O **GENOME** é a estrutura de dados
canônica desse agregado — as 13 dimensões que todo evento carrega:

```
GENOME
Cliente
Espaço
Arquitetura
Luz
Paisagem
Estação
Convidados
Experiência
Orçamento
Fotografia
Gastronomia
Música
Operação
```

Isto mapeia diretamente para o agregado raiz `Event` no banco operacional
(Postgres): cada dimensão do GENOME é uma seção/relacionamento desse
agregado, não uma tabela solta e desconectada.

### Exemplo de serialização (YAML, para specs/fixtures/seed)

```yaml
event:
  id: EVT-2030-001
  type: wedding
venue:
  name: Villa Massari
guests:
  expected: 180
timeline:
  ceremony: 16:30
```

Esse é o formato de referência para fixtures de teste e para o contrato
de API que representa um Evento — a API Bible deve detalhar o schema
completo (todas as 13 dimensões do GENOME), este é apenas o esqueleto
mínimo já mostrado na documentação de produto.

## Entidades de domínio a modelar (ponto de partida para migrations)

**Event** (agregado raiz — GENOME completo) · Client · Couple/Client
Profile (8 dimensões acima) · Venue (DNA do espaço) · Supplier
(fornecedor + espaços/estilos com que teve bom desempenho) · EventStyle
(dimensões de estilo + score) · Material/Flower (ficha técnica,
incluindo lista de exclusão) · Environment (ambiente/localização dentro
de um evento, ver mapeamento acima) · Project/Proposal (Diagnóstico
Criativo + componentes selecionados + WOW Score) · ProposalComponent (um
dos componentes reutilizáveis do Capítulo 7) · ProductionPlan (lista de
materiais + cronograma de montagem + checklist gerados pelo Agente 4, um
por Proposal) · PostEventFeedback · ProjectTask (checklist manual do
projeto — título, responsável, prazo, status; independente do checklist
gerado pelo Agente 4 em ProductionPlan, que é regenerado por inteiro a
cada Proposal em vez de editado item a item) · ClientInteraction (timeline
de contato real com o casal — ligação, reunião, e-mail, marco; separado
do additionalDetails do Client, que é uma foto do questionário, não um
log ao longo do tempo) · ProjectTeamMember (associação leve entre um User
da equipe da Bia e um Event, com papel em texto livre — ex.: "Decoradora",
"Fotógrafa" — mesmo estilo de VenuePreferredSupplier, sem trilha de
auditoria própria).
