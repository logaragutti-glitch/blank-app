# MEM Architect — Design System

Referência de estilo: mais perto de Notion, Linear, Stripe, Vercel e Apple do que de um
ERP tradicional. Isso se traduz em regras concretas, não em vibe:

## Tokens

- **Espaçamento**: escala de 4px (Tailwind padrão: `1 = 4px`), nunca valores mágicos.
- **Tipografia**: uma única família sans-serif (system font stack), pesos 400/500/600/700
  apenas. Tamanhos: `xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30`.
- **Cor**: paleta neutra (grafite/branco) como base de 90% da UI; uma cor de acento única
  (`--accent`) para ações primárias e estados de destaque (MEM Score, CTA). Sem gradientes
  decorativos, sem sombras pesadas — sombras sutis de 1–2 níveis apenas.
- **Raio de borda**: `--radius: 10px` como padrão de cards/botões/inputs — suave, não
  totalmente arredondado (evita "app de criança").
- **Modo escuro**: suportado desde o primeiro componente via CSS variables (`:root` /
  `.dark`), nunca cor hardcoded em componente.

Tokens vivem em `src/app/globals.css` como CSS variables e são consumidos pelo
`tailwind.config.ts` — trocar a marca é trocar variáveis, não reescrever componentes.

## Princípios de interação

1. **Uma decisão por tela** na entrevista — nunca formulário longo.
2. **Feedback imediato**: toda ação assíncrona (salvar resposta, gerar documento) mostra
   estado inline (spinner pequeno no próprio componente), nunca um loading de página inteira.
3. **Comandos antes de menus**: Command Palette (⌘K) é cidadão de primeira classe, não um
   extra — usuários avançados nunca deveriam precisar do mouse para navegar.
3. **Densidade progressiva**: dashboard mobile é enxuto (poucas métricas, prioridade
   máxima); desktop adiciona densidade, não funcionalidades novas.

## Inventário de componentes (Sprint 1)

| Componente | Papel | Base |
|---|---|---|
| `Button` | Ações primárias/secundárias/destrutivas/ghost | Radix Slot + CVA |
| `Card` | Contêiner padrão de conteúdo (dashboard, listas) | div estilizado |
| `Badge` | Status (DRAFT, READY, MEM Score faixa) | span estilizado |
| `Input` | Campos de texto/número | Radix-free, nativo estilizado |
| `Avatar` | Identidade de usuário/organização | Radix Avatar |
| `Progress` | Barra de progresso (entrevista, geração) | Radix Progress |
| `Sidebar` | Navegação principal (desktop) / tab bar (mobile) | layout próprio |
| `Topbar` | Busca, command palette trigger, avatar | layout próprio |

## Inventário de componentes (Sprint 2)

Adicionados sob demanda dos formulários de criação de Evento/Cliente e do detalhe do
evento — não construídos especulativamente na Sprint 1 porque não havia caso de uso real
ainda (ver princípio "Simplicidade acima de complexidade").

| Componente | Papel | Base |
|---|---|---|
| `Dialog` | Modal de criação (Novo evento, Novo cliente, Convidar membro) | Radix Dialog |
| `Tabs` | Navegação dentro da página de evento (DNA, Jornada, Checklist…) | Radix Tabs |
| `Label` | Rótulo acessível de campo de formulário | Radix Label |
| `Select` | Seleção simples (cliente do evento, papel do convite) | nativo estilizado |
| `Textarea` | Campos de texto longo (notas do cliente) | nativo estilizado |

## Inventário futuro (Sprint 3+)

`Timeline`, `Wizard` (motor da entrevista), `CommandPalette` (funcional, hoje é só
visual/atalho reservado), `Drawer`, `AI Chat`, `Kanban`, `Calendar` — desenhados quando os
módulos correspondentes (`/interview`, `/documents`) forem implementados, para evitar
componentes genéricos demais que não encaixam no caso de uso real.

## Onde ver funcionando

`src/app/(app)/design-system/page.tsx` é o style guide vivo — renderiza todos os
componentes do inventário atual com suas variantes. Qualquer novo componente do design
system deve ser adicionado a essa página antes de ser usado em uma tela de produto.
