# MEM Architect — Fluxos de Usuário

## Fluxo 1 — Onboarding e primeiro evento

```mermaid
flowchart TD
    A[Landing / Convite] --> B[Criar conta]
    B --> C[Criar Organização]
    C --> D[Dashboard vazio com CTA: Criar primeiro evento]
    D --> E[Formulário mínimo: nome do evento + cliente opcional]
    E --> F[Evento criado com status DRAFT]
    F --> G[Redireciona para Entrevista Inteligente]
```

## Fluxo 2 — Entrevista Inteligente (o coração do produto)

```mermaid
flowchart TD
    S[Início da entrevista] --> Q1[IA pergunta: tipo do evento?]
    Q1 --> Q2[IA pergunta: objetivo?]
    Q2 --> Q3{Tipo permite inferir próximas perguntas}
    Q3 -->|Casamento| QA[Perguntas sobre cerimônia, tradições, convidados]
    Q3 -->|Corporativo| QB[Perguntas sobre marca, objetivos de negócio, palco]
    QA --> QN[... perguntas subsequentes dependem das anteriores]
    QB --> QN
    QN --> R{Confiança suficiente para gerar documentos?}
    R -->|Não| QN
    R -->|Sim| CONFIRM[Tela de revisão: resumo das respostas]
    CONFIRM --> GEN[Usuário confirma: Gerar Projeto]
```

Regras de UX:
- Nunca mais de **uma pergunta por tela** (mobile first, sem formulário longo).
- Cada resposta é salva imediatamente (sem botão "salvar"); o usuário pode sair e voltar.
- Uma barra de progresso indica "estimativa", não porcentagem exata (o número de perguntas
  é dinâmico).
- O usuário pode sempre voltar e editar uma resposta anterior; isso invalida (não deleta)
  perguntas subsequentes que dependiam dela, e o motor re-pergunta o que for necessário.

## Fluxo 3 — Geração de documentos

```mermaid
flowchart TD
    G[Gerar Projeto] --> O[Orchestrator dispara N gerações em paralelo]
    O --> D1[DNA do Evento]
    O --> D2[Mapa da Emoção]
    O --> D3[Jornada Memorável]
    O --> D4[Linha do Tempo MEM]
    O --> D5[Plano Operacional + Checklist]
    O --> D6[Plano Financeiro]
    O --> D7[Plano B]
    D1 & D2 & D3 & D4 & D5 & D6 & D7 --> SCORE[Calcula MEM Score]
    SCORE --> SUM[Gera Resumo Executivo]
    SUM --> REVIEW[Tela de revisão: todos os documentos, status READY]
    REVIEW -->|Usuário edita qualquer documento| EDIT[Editor inline]
    EDIT --> RESCORE[Recalcula MEM Score]
    REVIEW -->|Exportar| PDF[Gera PDF executivo]
```

Enquanto os documentos são gerados, a UI mostra estado de progresso por documento
(pendente → gerando → pronto), nunca uma tela de loading bloqueante única — o usuário pode
começar a revisar o DNA do Evento enquanto o Plano Financeiro ainda está sendo gerado.

## Fluxo 4 — Uso recorrente (dashboard)

```mermaid
flowchart LR
    LOGIN[Login] --> DASH[Dashboard]
    DASH --> EV[Lista de eventos por status]
    DASH --> PEND[Pendências agregadas de todos os eventos]
    DASH --> SCORE[MEM Score médio da organização]
    DASH --> ACT[Atividades recentes da equipe]
    EV -->|clica evento| DETAIL[Página do evento: documentos, checklist, timeline]
```

## Fluxo 5 — Colaboração (multi-usuário)

```mermaid
flowchart TD
    OWNER[Owner] --> INVITE[Convida membro por e-mail]
    INVITE --> ROLE[Define papel: ADMIN ou MEMBER]
    ROLE --> MEMBER[Membro aceita convite]
    MEMBER --> ACCESS[Acessa eventos da organização conforme papel]
```
