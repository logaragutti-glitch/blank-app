# MEM Architect — Wireframes em Texto

Convenção: `[ ]` é um componente do Design System (ver `DESIGN_SYSTEM.md`). Layout mobile
first — a versão desktop apenas adiciona colunas/sidebar, nunca reestrutura a hierarquia.

## Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ [Topbar: logo · CommandPalette (⌘K) · Avatar]            │
├───────────┬─────────────────────────────────────────────┤
│ [Sidebar] │  Olá, {nome} 👋                               │
│ Dashboard │  ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ Eventos   │  │ Eventos   │ │ MEM Score │ │ Pendências│   │
│ Clientes  │  │ ativos: 4 │ │ médio: 78 │ │ total: 9  │   │
│ Entrevista│  └───────────┘ └───────────┘ └───────────┘   │
│ Biblioteca│                                               │
│ Config.   │  Agenda da semana        Checklist prioritário│
│           │  [Timeline compacta]     [ ] item 1           │
│           │                          [ ] item 2           │
│           │  Atividades recentes                          │
│           │  · Maria gerou o Plano Financeiro do evento X │
│           │  · Novo evento criado: "Casamento Ana & Rui"  │
└───────────┴─────────────────────────────────────────────┘
```
Em mobile: Sidebar vira menu inferior (Tab Bar) com 4 ícones + "mais"; os 3 [Card]s de
métricas viram um carrossel horizontal.

## Lista de Eventos

```
┌─────────────────────────────────────────────┐
│ Eventos                          [+ Novo]     │
│ [Filtro: Todos | Rascunho | Em entrevista |   │
│           Gerando | Revisão | Pronto]         │
├───────────────────────────────────────────────┤
│ [Card] Casamento Ana & Rui        MEM 82  ●   │
│        12 mai · Revisão                        │
├───────────────────────────────────────────────┤
│ [Card] Congresso TechCorp         MEM —   ○   │
│        Em entrevista · 40% estimado            │
└───────────────────────────────────────────────┘
```

## Entrevista Inteligente (uma pergunta por tela)

```
┌─────────────────────────────────────┐
│ [Progress: ▓▓▓▓▓░░░░░ estimado]      │
│                                       │
│        Qual é o tipo do evento?      │
│                                       │
│   ( ) Casamento                      │
│   ( ) Corporativo                    │
│   ( ) Aniversário                    │
│   ( ) Outro...                       │
│                                       │
│              [Continuar →]           │
│         ← voltar e editar             │
└───────────────────────────────────────┘
```
Chat alternativo (para perguntas abertas): balão da IA acima, campo de texto/voz abaixo,
sempre com sugestões rápidas (chips) quando aplicável.

## Página do Evento — Documentos

```
┌───────────────────────────────────────────────────┐
│ Casamento Ana & Rui         MEM Score: 82  [Export]│
│ [Tabs: DNA · Jornada · Timeline · Checklist ·      │
│         Financeiro · Plano B · Resumo]              │
├───────────────────────────────────────────────────┤
│  DNA do Evento™                        [Editar]     │
│  Essência: intimista, natureza, luz dourada         │
│  Emoções-guia: pertencimento, surpresa, gratidão    │
│  ...                                                │
└───────────────────────────────────────────────────┘
```

## Command Palette (⌘K)

```
┌─────────────────────────────────────┐
│ 🔍  Buscar eventos, clientes, ações  │
├─────────────────────────────────────┤
│  → Criar novo evento                 │
│  → Ir para Casamento Ana & Rui       │
│  → Abrir Configurações               │
└─────────────────────────────────────┘
```
