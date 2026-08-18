# Fluxo principal de aprovação de projetos — EVE OS

## Visão geral

O EVE OS agora organiza o projeto em cinco etapas visíveis no painel: **Briefing**, **Diagnóstico e proposta criativa**, **Proposta comercial**, **Revisão e aprovação** e **Produção**.

A produção permanece bloqueada até que a proposta criativa e a proposta comercial estejam aprovadas. A aprovação comercial é a decisão que libera a geração do plano operacional, da análise financeira e dos demais artefatos de produção.

## Estados comerciais

| Estado | Significado | Próxima ação |
|---|---|---|
| `DRAFT` | Composição comercial em montagem | Revisar espaço, fornecedores, escopo e valores |
| `READY` | Revisada internamente e pronta para envio | Registrar envio ao cliente |
| `SENT` | Enviada ao cliente ou aguardando decisão | Registrar aprovação ou devolver para revisão |
| `APPROVED` | Aprovada e liberada para produção | Gerar plano de produção |
| `REJECTED` | Devolvida para ajustes | Editar e marcar como pronta novamente |
| `EXPIRED` | Validade encerrada | Criar nova versão ou atualizar validade |

As transições aceitas são `DRAFT → READY → SENT → APPROVED`, `SENT → REJECTED`, `READY → REJECTED` e `REJECTED → READY`. Uma proposta aprovada não deve ser editada silenciosamente: salvar uma nova composição cria uma nova versão e retorna o status para `DRAFT`.

## Histórico de versões

Cada salvamento ou transição cria um registro em `commercial_proposal_versions`. O registro preserva a versão, ação, status, investimento total, snapshot da proposta, observação, autor e data.

A proposta comercial corrente possui `version`, `sentAt`, `sentBy`, `approvedAt`, `approvedBy` e `rejectionReason`. O snapshot impede que alterações futuras no cadastro de fornecedor ou espaço modifiquem silenciosamente o documento que foi apresentado.

## Regras de pendência

Itens com preço estimado, cotação pendente, contato não confirmado ou espaço que exige confirmação são marcados em `hasUnconfirmedData`. A assessora pode salvar e revisar a proposta normalmente, mas precisa reconhecer explicitamente essas pendências antes de registrar o envio ou a aprovação.

Essa confirmação não transforma estimativa em contratação. O PDF continua devendo ser conferido com cotações, disponibilidade, contrato, taxas, montagem, deslocamento e demais condições comerciais.

## Sincronização operacional

Quando a proposta comercial é aprovada, os fornecedores selecionados são sincronizados no projeto com status `BOOKED`. O sistema mantém a diferença entre fornecedor cadastrado no catálogo, fornecedor incluído na proposta e fornecedor efetivamente vinculado ao projeto.

A sincronização não reserva automaticamente o fornecedor nem substitui a assinatura do contrato. Ela registra apenas que o fornecedor foi incluído na composição aprovada e está pronto para a etapa operacional.

## Rotas principais

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/projects/:eventId/overview` | Painel único do projeto |
| `GET` | `/creative/proposals/:proposalId/commercial` | Consulta a proposta comercial corrente |
| `POST` | `/creative/proposals/:proposalId/commercial` | Salva nova composição e cria versão |
| `GET` | `/creative/proposals/:proposalId/commercial/versions` | Consulta o histórico |
| `POST` | `/creative/proposals/:proposalId/commercial/status` | Avança, envia, aprova ou rejeita |
| `POST` | `/production/proposals/:proposalId/plan` | Gera plano somente após aprovação |
| `POST` | `/production/proposals/:proposalId/budget-analysis` | Gera análise somente após aprovação |

## Sequência recomendada de uso

A assessora deve abrir o painel do projeto, seguir a próxima ação destacada, montar a proposta comercial, salvar a composição, revisar as pendências, marcar a versão como pronta e registrar o envio. Após a decisão do cliente, deve registrar aprovação ou rejeição. Somente no estado `APPROVED` a tela de Produção ficará liberada.

## Implantação segura

A implementação está isolada na branch de feature `feat/commercial-proposal-template`. Antes de qualquer promoção, é necessário aplicar as migrations `20260817210000_add_commercial_proposals` e `20260817220000_add_commercial_proposal_versions` no banco da API, executar o seed compatível, validar um projeto de teste e publicar apenas um Preview Deployment.

A `main` não foi alterada e nenhuma variável secreta foi modificada.

## Ativação operacional após a aprovação

Depois que a proposta criativa e a proposta comercial forem aprovadas, a tela de Produção oferece a ação **Ativar checklist operacional**. Essa ação é idempotente: pode ser repetida sem duplicar as tarefas automáticas.

A ativação cria ou reutiliza tarefas para confirmar o espaço, solicitar contratos, revisar pagamentos, confirmar logística, validar itens personalizados e revisar o plano operacional final. Também sincroniza os fornecedores da proposta aprovada com o vínculo do evento no status `BOOKED`.

A ativação não substitui a geração do plano de produção por IA. Ela cria a camada operacional editável do projeto; depois, a assessora pode gerar ou atualizar o plano de materiais, cronograma e checklist do Agente 4.

## Avaliação pós-evento de fornecedores

Na tela de Fornecedores do Projeto, cada fornecedor vinculado possui uma seção de avaliação pós-evento. A assessora pode registrar notas de 1 a 5 para qualidade, pontualidade, comunicação, cumprimento do escopo e avaliação geral, além de observações.

A avaliação é única por fornecedor e evento e pode ser atualizada. Ela não altera automaticamente a validação pública do fornecedor nem transforma uma recomendação em garantia. Em uma etapa futura, as avaliações poderão alimentar rankings internos por categoria, espaço e tipo de evento, sempre separando experiência histórica da disponibilidade atual.
