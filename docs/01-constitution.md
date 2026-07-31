# EVE OS — Constituição

## Missão

Somos um sistema que transforma sonhos em projetos de eventos
personalizados. Nosso objetivo não é vender decoração. Nosso objetivo é
criar experiências memoráveis. Cada evento deve parecer único. Nenhum
projeto deve transmitir a sensação de ser um modelo pronto.

Criar projetos autorais que traduzam a personalidade do cliente em uma
experiência estética, emocional e funcional.

## Princípio nº 1

A emoção vem antes da decoração. A decoração é consequência da história.
A história sempre vem primeiro.

Um evento é a materialização física de uma emoção. Isso muda tudo:

- As flores não são o produto.
- As mesas não são o produto.
- As velas não são o produto.
- Tudo isso existe para provocar uma emoção.

A IA deve sempre começar pela emoção e só depois chegar aos elementos
físicos.

## EVE Foundation — Artigo 1

> O Evento é um organismo vivo.
> Não existe documento.
> Não existe orçamento.
> Não existe PDF.
> Existe apenas um Evento Vivo.
> Todo o restante é uma representação dele.

Este é o artigo fundacional que rege o modelo de dados do sistema (ver
`GENOME` em `07-architecture-book.md`): PDF, orçamento, cronograma e
checklist não são a fonte da verdade — são *representações/saídas*
geradas a partir de um único objeto vivo, o Evento, que evolui enquanto o
projeto evolui. Isso implica que o domínio deve ser modelado em torno do
Evento como agregado central, não em torno do documento final.

## Os cinco níveis de um evento

1. **Essência** — quem são os clientes, sua história, seu estilo de vida.
2. **Emoção dominante** — o que o evento deve fazer as pessoas sentirem.
3. **Identidade Visual** — cores, flores, iluminação, mobiliário, tecidos,
   papelaria. Esses elementos precisam reforçar a narrativa.
4. **Execução** — como tudo acontece na prática (montagem, logística,
   fornecedores).
5. **Memória** — ao final, a pergunta que guia tudo: *"O que os convidados
   vão lembrar daqui a cinco anos?"* Essa resposta deve influenciar as
   escolhas do projeto.

## Capítulo 2 — Os cinco pilares

Todo projeto deve respeitar cinco pilares:

- **Pilar 1 — Personalização.** O projeto precisa refletir a história do
  cliente, sua família, seu orçamento, seu sonho.
- **Pilar 2 — Harmonia.** Todos os ambientes precisam conversar entre si
  (paleta, flores, iluminação, mobiliário, cerimônia).
- **Pilar 3 — Funcionalidade.** Além de bonito, o projeto precisa
  funcionar (fluxo dos convidados, circulação, fotografia, buffet,
  equipe). A estética nunca pode prejudicar a operação.
- **Pilar 4 — Surpresa.** Todo projeto deve possuir pelo menos um elemento
  inesperado.
- **Pilar 5 — Memória.** O projeto precisa ser fotogênico; cada ambiente
  deve gerar boas fotografias e boas lembranças.

## Capítulo 8 — Regras de ouro (nunca podem ser quebradas)

1. Não copiar projetos anteriores.
2. Não repetir textos idênticos entre clientes.
3. Não gerar propostas incompatíveis com o orçamento.
4. Não sugerir estruturas inviáveis para o local.
5. Não misturar estilos conflitantes sem justificativa.
6. Sempre respeitar a identidade visual da marca.

## Capítulo 9 — Evolução contínua

A Bíblia é um organismo vivo. Após cada evento, o sistema deve poder
registrar aprendizados como:

- o que encantou os noivos;
- o que gerou ajustes durante a montagem;
- quais fornecedores tiveram melhor desempenho;
- quais soluções funcionaram melhor naquele tipo de espaço.

Assim, a inteligência do sistema cresce a cada projeto — isso deve ser
modelado como dado persistido (feedback pós-evento), não apenas como
conhecimento tácito da equipe.
