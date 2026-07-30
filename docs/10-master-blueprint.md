# EVE OS — Master Blueprint (estrutura da documentação do sistema)

Este documento registra a estrutura oficial em que a documentação
completa do EVE OS (o "EVE OS Product Specification") foi organizada nas
sessões de planejamento, incluindo os nomes de volume e de componentes
citados nominalmente. Onde a sessão registrou nomes/termos sem detalhar
o conteúdo, isso é sinalizado explicitamente como lacuna — nada abaixo
foi inventado para preencher esses vazios.

## Estrutura em seis volumes

- **Volume I — Visão do Produto e Negócio.** Ver `03-product-spec.md` e
  `09-business-scale.md`.
- **Volume II — Os Cinco Mundos** (especificação funcional detalhada).
  Ver nota abaixo — o conteúdo detalhado dos "Cinco Mundos" em si (para
  além do Modelo EVE de 3 letras em `04-ai-bible.md`) não foi transcrito
  nas sessões registradas e é uma lacuna a preencher.
- **Volume III — AI Platform** (agentes, orquestração, memória e
  regras). Ver `04-ai-bible.md`.
- **Volume IV — Data & APIs** (modelo de dados, integrações e contratos
  de API). Ver `05-database-bible.md` — a API Bible propriamente dita
  (contratos OpenAPI) ainda não foi escrita.
- **Volume V — UX & Interface** (telas, componentes, estados e fluxos).
  Ver `06-ui-bible.md`.
- **Volume VI — Business Rules & QA** (regras de negócio, casos de uso e
  critérios de aceite). Ver as Regras de Ouro em `01-constitution.md` e
  `04-ai-bible.md` — critérios de aceite formais (QA) ainda não foram
  escritos.

## Nomenclatura alternativa de status observada na mesma sessão

Em outro momento da mesma sessão de planejamento, o progresso da
documentação foi reportado com uma nomenclatura diferente de volumes —
provavelmente uma renomeação em progresso dos mesmos volumes, e não uma
estrutura paralela:

```
Volume I – Inspirar: ✅
Volume II – Criar (Cinco Mundos): ✅
Volume III – Refinar: ✅
Volume IV – Encantar: ✅
Volume V – Realizar: ✅
Digital Event Twin™: ✅
Rule Engine: ✅
Event Impact Engine: ✅
```

Esta tabela é preservada verbatim por fidelidade à sessão original, mas
**diverge** do "Estrutura em seis volumes" acima (nomes e contagem
diferentes — 5 volumes "Inspirar/Criar/Refinar/Encantar/Realizar" vs. 6
volumes "Visão do Produto/Cinco Mundos/AI Platform/Data & APIs/UX/Business
Rules"). Antes de tratar qualquer uma das duas como definitiva, isso
precisa ser reconciliado com quem conduziu a sessão original — não
escolha uma arbitrariamente ao planejar trabalho futuro.

## Componentes nomeados sem especificação detalhada (lacunas conhecidas)

Os três itens abaixo são citados nominalmente como componentes do sistema
("✅" = documentados, segundo a sessão), mas o conteúdo/especificação
deles não está registrado nas transcrições recebidas até agora:

- **Digital Event Twin™** — pelo nome, provavelmente a representação
  digital "gêmea" e sincronizada de um evento físico (consistente com o
  `EVE Foundation — Artigo 1` e o GENOME em `01-constitution.md` /
  `07-architecture-book.md`, que já tratam o Evento como um objeto vivo
  único). Precisa de especificação própria antes de virar código.
- **Rule Engine** — parcialmente especificado em `04-ai-bible.md` a
  partir dos exemplos práticos (troca de horário, troca de flor), mas sem
  uma definição formal e completa de todas as regras.
- **Event Impact Engine** — idem, parcialmente especificado em
  `04-ai-bible.md`.

## Instrução final de inicialização (Sprint 0 / "EVE Factory")

A sessão de planejamento nomeia o processo de desenvolvimento derivado
desta documentação de **EVE Factory** e encerra com a seguinte conclusão,
preservada verbatim por ser a definição de propósito do processo de
engenharia em si (e não apenas do produto):

> "Assim, EVE Factory deixa de ser apenas um conjunto de instruções e
> passa a ser um framework operacional de desenvolvimento, capaz de
> produzir software de forma consistente, auditável e alinhada com toda
> a documentação que construímos para o EVE OS."

O "Prompt de Inicialização / Sprint 0" citado na sessão (criar o
monorepo, configurar Turborepo etc.) é exatamente o escopo que este
repositório já implementou — ver `README.md` na raiz e o histórico de
commits da branch `claude/eve-os-monorepo-setup-vxfg96`.
