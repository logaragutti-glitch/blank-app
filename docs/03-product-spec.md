# EVE OS — Product Specification (Blueprint v1.0)

## Identidade do produto

- **Nome:** EVE OS — Event Intelligence Operating System.
- **Categoria:** Sistema Operacional Inteligente para Empresas de Eventos.
- **Propósito:** Permitir que empresas de eventos dediquem mais tempo à
  criatividade e ao relacionamento com seus clientes, automatizando
  processos repetitivos sem perder a identidade de cada marca.

## O problema

Hoje uma decoradora precisa utilizar diversas ferramentas dispersas
(WhatsApp, Pinterest, Canva, Excel etc.) para levantar o briefing e
entregar uma proposta. O processo depende inteiramente da experiência
pessoal da decoradora e não escala.

## A solução

O EVE OS centraliza todo o processo em um único ambiente. O sistema
recebe um briefing (formulário do cliente + fotos de inspiração) e
entrega:

- Diagnóstico criativo (interno, ver `04-ai-bible.md`);
- Conceito nomeado;
- Moodboard;
- Paleta;
- Projeto dos ambientes;
- Proposta comercial;
- Lista de materiais;
- Cronograma;
- Checklist.

## A jornada do usuário

```
Descobrir → Criar → Inspirar → Refinar → Apresentar → Produzir
```

## Módulos do sistema

- **Criar Novo Projeto** — botão principal que abre uma conversa fluida
  (chat/formulário guiado) para captar o briefing.
- **O Momento Mágico** — leitura do briefing, interpretação das imagens de
  inspiração, identificação de estilos, cálculo de compatibilidade com o
  Knowledge Graph.
- **Canvas do Evento™** — um quadro branco digital conectando cliente,
  espaço, flores, luz, música, gastronomia, mobiliário e experiência.

## Tela inicial (exemplo de tom)

```
Bom dia, Bia.
Você possui:
3 propostas em andamento
2 eventos esta semana
1 reunião hoje
```

## Escopo do MVP (5 telas para validar a ideia)

Antes de qualquer vertical adicional (ver `07-architecture-book.md`) ou
qualquer módulo avançado (Canvas do Evento completo, Modo Produção,
renders automáticos), o MVP a validar primeiro é deliberadamente restrito
a 5 telas:

1. **Home** — resumo do dia (ver tom de voz em `06-ui-bible.md`).
2. **Novo Projeto** — captura do briefing (conversa fluida).
3. **Diagnóstico Criativo** — saída do Agente 1/Motor de Interpretação,
   revisável internamente antes de virar proposta (ver `04-ai-bible.md`).
4. **Editor do Projeto** — ajustes manuais sobre o que a IA gerou.
5. **Gerar Proposta** — produção do artefato final (PDF/apresentação) a
   partir dos componentes do Capítulo 7.

Qualquer funcionalidade fora dessas 5 telas (Canvas do Evento interativo,
Modo Produção, verticais EVE Kids/Destination/etc.) é pós-MVP.

## Componentes reutilizáveis de um projeto (Capítulo 7 da Constituição)

Capa · História da Bia · História do casal (opcional) · Conceito criativo
· Moodboard · Paleta · Entrada · Cerimônia · Mesa do bolo · Lounge ·
Mesas dos convidados · Bar · Buffet · Pista · Iluminação · Florais ·
Cronograma · Investimento

Cada um destes é um componente independente e reaproveitável no motor de
geração de propostas — não um template monolítico de PDF.

## Evoluções identificadas na análise do orçamento manual (linha de base)

O processo manual atual (formulário → montagem manual no Canva → export
PDF) tem pontos fortes que o produto precisa preservar (construção
emocional, personalização, uso de imagens, linguagem leve, fluxo
narrativo) e lacunas que o EVE OS deve resolver estruturalmente:

- Falta de conceito nomeado por evento.
- Falta de moodboard dedicado.
- Falta de render/croqui do ambiente.
- Falta de mapa/planta do evento.
- Investimento sem contexto de valor.
- Falta de prova de autoridade (portfólio, depoimentos, números).
- Falta de cronograma visual.
- Falta de fechamento emocional e chamada à ação.

## Visão de expansão de mercado

O produto não se limita a casamentos: decoradores de casamento, eventos
corporativos, festas infantis, destination weddings e hotéis que realizam
eventos são todos clientes em potencial da plataforma. A versão detalhada
e sequenciada dessa expansão (ondas comerciais e verticais técnicas
correspondentes) está em `09-business-scale.md` — este parágrafo é a
visão resumida, aquele documento é a referência canônica de sequência.
