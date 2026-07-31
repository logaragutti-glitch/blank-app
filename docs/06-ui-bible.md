# EVE OS — UI Bible

## Regras de ouro da interface

- **Cantos:** 16px de raio em componentes.
- **Sombra:** extremamente discreta.
- **Cores da UI:** branco quente, grafite, destaques em champagne gold.
  Nada de azul, vermelho ou verde intenso em excesso — a paleta da UI do
  produto segue a mesma sofisticação discreta da marca (ver
  `02-brand-bible.md`), não uma paleta de SaaS genérica.
- **Sem mensagens genéricas de carregamento.** Nunca usar apenas
  "Carregando...". A IA deve mostrar pensamentos contextuais, por
  exemplo: *"Estou conectando as inspirações e procurando a essência
  deste evento..."*

> **Implementação:** `packages/ui/src/tokens.ts` reflete "branco quente /
> grafite / champagne gold" (era uma paleta escura genérica de placeholder
> do Sprint 0). Cantos de 16px (`radii.lg`) e sombra discreta (`shadows.sm`)
> usados em `Card`/`Button`.

## Tom de voz da IA na interface

A tela inicial deve soar pessoal e específica do dia, nunca genérica.
Observe que não há excesso de informação — o objetivo é ajudar a começar
o dia, não sobrecarregar:

```
Bom dia, Bia.
Você possui:
3 propostas em andamento
2 eventos esta semana
1 reunião hoje
```

Frases de referência para os dois estados básicos de qualquer feedback
da IA (nunca usar linguagem de erro/sucesso genérica de sistema):

- **Quando tudo está certo:** *"Sua proposta está pronta para encantar."*
- **Quando há um problema:** *"Encontrei um ponto que merece atenção
  antes de avançarmos."*

## Módulos/telas principais (ver `03-product-spec.md` para o produto completo)

- **Criar Novo Projeto** — botão principal, abre uma conversa fluida
  (chat/formulário guiado), não um formulário tradicional de campos
  soltos. A cada etapa a IA conduz a reunião como se fosse uma pessoa,
  não um wizard de formulário:

  > "Gostaria que vocês imaginassem o momento em que seus convidados
  > chegam..." *(a tela mostra a entrada)*
  >
  > "Agora vamos caminhar até a cerimônia..." *(a tela mostra a
  > cerimônia)*

- **O Momento Mágico / Momento Eureka** — a sessão original usou os dois
  nomes em momentos diferentes para descrever o mesmo estado de
  carregamento da IA; tratamos como sinônimos do mesmo componente
  (decisão editorial de reconciliação), não como duas telas distintas.
  Tela/estado que representa a IA processando o briefing e as imagens de
  inspiração. Nunca mostra
  "Carregando...". Mostra pensamentos contextuais em primeira pessoa, por
  exemplo:

  > "Estou identificando padrões..."

  Seguido de pequenas descobertas indicadas com ícones/emoji, reveladas
  progressivamente: 🌿 Garden, ✨ Fine Art, 🤍 Branco, 🕯️ Velas, 🌸 Flores
  delicadas, 🏛️ Arquitetura clássica — ou, em outra variação do mesmo
  padrão:

  > "Estou conectando as inspirações e procurando a essência deste
  > evento..." — mostrando junto ícones/nós de cerimônia, recepção, DJ,
  > banda, playlist, todos se conectando visualmente.

  Um exemplo de notificação/resumo gerado ao final desse processamento
  (formato cartão, não texto corrido):

  ```
  96%
  Emoções:
  ❤️ Romance
  🌿 Leveza
  ✨ Elegância
  Arquitetura: Villa Massari (Excelente compatibilidade)
  Paleta sugerida: Champagne, Rosé, Sálvia
  ```

- **Canvas do Evento™** — um grande quadro branco digital. No centro:
  **Evento**. Ao redor, conectados a ele: Clientes, Espaço, Flores, Luz,
  Música, Gastronomia, Mobiliário, Experiência. Provavelmente a
  superfície de edição mais complexa do produto.

## Interação Visual Adaptativa (Canvas do Evento)

Quando o usuário altera um elemento no Canvas, a interface nunca "pisca"
nem recarrega:

- As conexões entre nós se reorganizam lentamente (transição animada, não
  corte abrupto).
- As linhas de conexão mudam de forma suave.
- Os cartões "respiram" (micro-animação de estado vivo, reforçando a
  metáfora do "Evento Vivo" — ver `01-constitution.md`).
- Recomendações da IA aparecem discretamente, nunca como modal
  bloqueante.

Isso é a contraparte visual do Rule Engine / Event Impact Engine (ver
`04-ai-bible.md`): cada alteração no Canvas dispara um recálculo de
impacto que a UI deve refletir de forma fluida, não com um "recarregar
página".

## Modo Produção (após a aprovação do cliente)

A mesma informação do projeto muda de forma quando o projeto é aprovado —
não é uma tela nova do zero, é uma transição de modo sobre os mesmos
dados. Nesse modo aparecem: checklist, equipes, fornecedores, horários,
montagem, logística. Este é o modo usado pelo Agente 4 (Diretor de
Produção, ver `04-ai-bible.md`).

## Design de cards e componentes

- **Cantos:** 16px.
- **Sombra:** extremamente discreta.
- **Cards:** muito espaço interno, cantos arredondados, sombras suaves,
  bordas quase invisíveis. Nada agressivo/nada de contraste forte.

## Jornada do usuário (para fluxo de navegação)

```
Descobrir → Criar → Inspirar → Refinar → Apresentar → Produzir
```
