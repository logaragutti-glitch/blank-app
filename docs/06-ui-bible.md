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

> Nota de implementação: os tokens atuais em `packages/ui/src/tokens.ts`
> (Sprint 0) usam uma paleta escura genérica de placeholder — precisam
> ser revisados para refletir "branco quente / grafite / champagne gold"
> antes de qualquer tela de produto real ser construída.

## Tom de voz da IA na interface

A tela inicial deve soar pessoal e específica do dia, nunca genérica:

```
Bom dia, Bia.
Você possui:
3 propostas em andamento
2 eventos esta semana
1 reunião hoje
```

## Módulos/telas principais (ver `03-product-spec.md` para o produto completo)

- **Criar Novo Projeto** — botão principal, abre uma conversa fluida
  (chat/formulário guiado), não um formulário tradicional de campos
  soltos.
- **O Momento Mágico** — tela/estado que representa a IA processando o
  briefing e as imagens de inspiração (é aqui que as mensagens
  contextuais de "carregando" citadas acima aparecem).
- **Canvas do Evento™** — quadro branco digital conectando cliente,
  espaço, flores, luz, música, gastronomia, mobiliário e experiência;
  provavelmente a superfície de edição mais complexa do produto.

## Jornada do usuário (para fluxo de navegação)

```
Descobrir → Criar → Inspirar → Refinar → Apresentar → Produzir
```
