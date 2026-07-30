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
restrições próprias (ver Engineering Handbook para o contrato técnico):

- **Briefing Engine / Agente de Interpretação** — lê o formulário e as
  imagens de inspiração, produz o Diagnóstico Criativo.
- **Creative Engine / Agente de Conceito** — a partir do Diagnóstico,
  gera conceito nomeado, paleta, moodboard e seleção de componentes.
- **Agente de Produção / Diretor de Produção** — traduz o conceito em
  cronograma, lista de materiais e logística de montagem/desmontagem.
- **Agente de Budget** — analisa custos, margens e sustentabilidade
  econômica da proposta frente ao orçamento informado.
- **Agente de Projetos** — organiza o acompanhamento do projeto do
  fechamento até a execução (checklists, reuniões, aprovações).

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
