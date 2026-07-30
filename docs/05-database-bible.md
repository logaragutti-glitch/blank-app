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
   preferências, acessibilidade.
5–8. *(dimensões adicionais a detalhar conforme o formulário evolui:
   visão de evento desejada, referências visuais, convidados/capacidade,
   preferências gastronômicas/musicais — ver formulário atual da Bia como
   ponto de partida.)*

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

### Dimensões de estilo (score numérico 0–10, por evento/estilo)

Usadas para calcular compatibilidade e o WOW Score:

```
Luxuoso: 8.0
Natural: 7.8
```
(mais de 100 estilos de eventos devem ser catalogados neste formato ao
longo do tempo, cada um com suas próprias características).

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

## Entidades de domínio a modelar (ponto de partida para migrations)

Client · Couple/Client Profile (8 dimensões acima) · Venue (DNA do
espaço) · Supplier (fornecedor + espaços/estilos com que teve bom
desempenho) · EventStyle (dimensões de estilo + score) · Material/Flower
(ficha técnica) · Project/Proposal (Diagnóstico Criativo + componentes
selecionados + WOW Score) · ProposalComponent (um dos componentes
reutilizáveis do Capítulo 7) · PostEventFeedback.
