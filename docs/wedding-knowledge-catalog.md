# Catálogo de formatos e tendências de casamento

**Escopo:** pesquisa editorial e de mercado realizada em 17 de agosto de 2026 para alimentar o Knowledge Graph do EVE OS. O catálogo foi desenhado para apoiar briefing, diagnóstico criativo, moodboard e geração de propostas; ele não substitui validação jurídica, técnica, orçamentária ou cultural com o casal e os fornecedores.

## Síntese executiva

A pesquisa indica que o casamento contemporâneo está se afastando de uma celebração genérica e se aproximando de uma experiência autoral, intencional e centrada nos convidados. O The Knot Worldwide informa que 68% dos respondentes querem que seus convidados sintam que nunca participaram de um casamento igual ao deles; detalhes personalizados aparecem como o principal fator de memorabilidade, com 36%, seguidos por comida e bebidas, com 23%, e entretenimento, com 21% [1]. Pinterest e Zola reforçam a personalização, a experimentação visual, a sustentabilidade prática, os votos privados, a experiência de fim de semana e o uso de tecnologia/IA como sinais relevantes [2] [3] [4].

A pesquisa também mostra que “tipo de casamento” e “estilo” não são a mesma coisa. Elopement, minimony, micro-wedding, destination e wedding weekend descrevem escala, intenção, deslocamento ou duração. Garden party, artsy, naturalismo moderno, marrom chocolate, brilho etéreo e maximalismo descrevem linguagem visual ou experiência. O banco, por isso, mantém **WeddingFormat** e **WeddingTrend** separados e relaciona ambos por **WeddingFormatTrend**.

## Formatos incluídos

| Eixo | Formato | Faixa orientativa | Duração | Observação operacional |
|---|---|---:|---:|---|
| SCALE | Elopement | 0–2 convidados/testemunhas | 1 dia | Validar requisitos legais do local |
| SCALE | Minimony | Até 10 pessoas | 1 dia | Pode anteceder uma festa maior |
| SCALE | Micro-wedding | Até 50 convidados | 1 dia | Mantém experiência completa em menor escala |
| SCALE | Casamento íntimo/pequeno | 10–100 convidados | 1 dia | Prioriza convivência e seleção de convidados |
| SCALE | Casamento tradicional/grande | 80–300 convidados | 1 dia | Exige fluxos operacionais e personalização de rituais |
| TRAVEL | Destination doméstico | 10–200 convidados | 2–4 dias | Deslocamento e hospedagem dentro do país |
| TRAVEL | Destination internacional | 10–150 convidados | 2–5 dias | Documentação, fornecedores locais e logística internacional |
| DURATION | Wedding weekend | 20–200 convidados | 2–4 dias | Boas-vindas, cerimônia, recepção e atividades |
| SETTING | Casamento em casa | 2–120 convidados | 1–2 dias | Usa memória e arquitetura existente |
| SETTING | Casamento no campo/fazenda | 10–200 convidados | 1–3 dias | Exige plano de chuva, piso, energia e acessibilidade |
| SETTING | Casamento na praia | 10–200 convidados | 1–3 dias | Exige validação de vento, maré, sombra e licenças |

As faixas de convidados são convenções de planejamento e não definições legais universais. O The Knot descreve micro-wedding como uma celebração de até 50 convidados, minimony como cerimônia geralmente de até 10 pessoas e elopement como cerimônia muito íntima, normalmente sem grupo de convidados [5]. Para destination wedding, a fonte considera essencial o deslocamento para fora da cidade de origem e destaca que o formato pode ser doméstico, não apenas internacional ou tropical [6].

## Tendências incluídas

| Categoria | Tendências catalogadas |
|---|---|
| EXPERIENCE | Personalização autoral; Experiência do convidado; Pré-festa e boas-vindas íntimas |
| OPERATIONS | Sustentabilidade prática |
| AESTHETIC | Garden party; Artsy e surrealista; Maximalismo editorial; Naturalismo moderno; Speakeasy e ambientes de transição |
| PALETTE | Natureza romântica; Brilho etéreo; Marrom chocolate e terrosos; Cloud Dancer e monocromia etérea |
| FLORAL | Florais autorais e instalações |
| ARCHITECTURE | Arquitetura e altares escultóricos |
| GASTRONOMY | Banquete e gastronomia como experiência |
| CEREMONY | Votos privados |
| FASHION | Vintage e múltiplos looks |
| TECHNOLOGY | Conteúdo social autêntico; IA como ferramenta de concepção |

No relatório Pinterest 2026, os sinais de busca destacam natureza romântica — ameixa, oliva, figo, merlot, terracota e rosa queimado — e brilho etéreo — opalescente, iridescente, cromado e tons de joia [2]. O relatório Pinterest Brasil 2025 acrescenta marrom/chocolate, flores silvestres, casamento íntimo no campo, celebração em casa, vintage e múltiplos looks [7]. A fonte brasileira Constance Zahn acrescenta artsy/avant-garde, altares escultóricos, maximalismo, instalações florais, banquetes, mesas comunitárias, projeções, IA na decoração e naturalismo moderno [8].

## Dados armazenados

A tabela `wedding_formats` guarda eixo, faixa de convidados, duração, necessidade de deslocamento, se é apenas cerimônia, notas de planejamento, fontes e evidências. A tabela `wedding_trends` guarda categoria, descrição, aplicação, considerações de produção, paleta, materiais, fontes, data, geografia e evidência. A tabela de relação `wedding_format_trends` guarda uma compatibilidade inicial de 1 a 5 e uma justificativa editorial.

O seed é idempotente e alimenta a organização de demonstração `Tia Bia Festas`. As relações iniciais não são regras rígidas: o agente deve cruzá-las com briefing, orçamento, venue, clima, acessibilidade, disponibilidade de fornecedores e preferências explícitas do casal.

## Limitações e governança

Os relatórios de The Knot e Zola são pesquisas ou editoriais predominantemente norte-americanos; não devem ser usados para estimar custos ou prevalência do mercado brasileiro. Pinterest fornece sinais de busca e salvamento, úteis para detectar interesse, mas não equivalentes à adoção efetiva. A fonte Constance Zahn é editorial brasileira, adequada para repertório local de decoração, mas não é um levantamento probabilístico. Por isso, cada registro mantém `source_urls`, `source_notes`, `source_date`, `geography` e `evidence`.

O catálogo deve ser revisado pelo menos uma vez por ano e sempre que uma tendência estiver sendo convertida em recomendação de investimento. A IA pode usar as tendências para gerar opções, mas deve explicar premissas, evitar prometer execução e sinalizar quando uma imagem for conceitual.

## Referências

[1]: https://www.theknotww.com/press-releases/the-knot-worldwides-2025-global-wedding-report-reveals-bold-new-era-of-personalization-and-purpose "The Knot Worldwide — 2025 Global Wedding Report"
[2]: https://newsroom.pinterest.com/pt-br/news/wedding-trend-report-2026/ "Pinterest Newsroom — Relatório de Tendências de Casamento 2026"
[3]: https://www.zola.com/expert-advice/the-first-look-report-2025 "Zola — First Look Report 2025"
[4]: https://www.theknot.com/content/wedding-data-insights/real-weddings-study "The Knot — Real Weddings Study 2026"
[5]: https://www.theknot.com/content/what-is-a-microwedding "The Knot — What Is a Micro-Wedding?"
[6]: https://www.theknot.com/content/domestination-wedding-definition "The Knot — What Is a Destination Wedding?"
[7]: https://newsroom.pinterest.com/pt-br/news/the-annual-pinterest-wedding-trends-report/ "Pinterest Brasil — Relatório anual de tendências de casamento 2025"
[8]: https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/ "Constance Zahn — 30 tendências de decoração de casamento para 2026"
