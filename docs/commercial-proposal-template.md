# Modelo de proposta comercial integrada — EVE OS

## Objetivo

Este modelo transforma a proposta criativa em uma composição comercial apresentável ao casal. Ele reúne o espaço de evento, fornecedores regionais selecionados, escopo de cada contratação, itens opcionais, estimativas de preço, contingência, taxa de gestão, descontos, forma de pagamento, validade, condições e próximos passos.

O documento é deliberadamente transparente: um valor cadastrado como estimativa não é apresentado como preço confirmado. A proposta também sinaliza quando o contato do fornecedor, a disponibilidade do espaço ou o preço ainda precisam ser confirmados.

## Modalidades comerciais

A assessora pode escolher entre duas modalidades:

| Modalidade | O que contempla |
|---|---|
| `FULL_EVENT` — Evento completo | Espaço, buffet e gastronomia, decoração, flores, móveis, iluminação, foto/filme, música, DJ, estrutura, montagem e demais categorias selecionadas para o evento. |
| `DECORATION_ONLY` — Somente decoração | Ambientação decorativa com flores e folhagens, móveis e locações, iluminação decorativa, objetos, tecidos, mesa posta, estruturas decorativas, montagem e desmontagem. |

Na modalidade `DECORATION_ONLY`, o sistema não permite incluir buffet, bebidas, fotografia, filmagem, DJ ou sonorização técnica como fornecedores ou itens personalizados. O espaço continua sendo usado como referência de ambientação, logística e áreas de montagem, mas não significa que o aluguel do espaço esteja incluído no orçamento decorativo.

## Estrutura apresentada ao cliente

| Seção | Conteúdo integrado | Origem no EVE OS |
|---|---|---|
| Capa | Nomes do casal, modalidade, tipo do evento, data, convidados, espaço e validade | Client, Event, Venue e CommercialProposal |
| Espaço e premissas | Município, tipo, capacidade, hospedagem, serviços, notas e evidências | WeddingVenueResearch ou Venue |
| Equipe e fornecedores | Categoria, nome, contatos, área, escopo, status de contato e status do preço | Supplier e ProjectSupplier |
| Investimento | Itens, quantidade, valor unitário, subtotal, contingência, gestão, desconto e total | CommercialProposal.lineItems |
| Logística | Deslocamento, transporte de peças, pedágios, montagem, desmontagem, hospedagem e custos incluídos | CommercialProposal.logisticsItems |
| Cotações | Alternativas recebidas, fornecedor, fonte, validade, valor e status da decisão | CommercialQuote |
| Condições | Forma de pagamento, validade, ressalvas, cotações pendentes e próximos passos | CommercialProposal.paymentTerms, conditions e nextSteps |

## Categorias comerciais

O EVE OS converte as categorias internas do fornecedor em rótulos mais claros para o casal.

| Categoria interna | Rótulo comercial |
|---|---|
| CATERING | Buffet e gastronomia |
| OTHER | Decoração e serviços complementares |
| FURNITURE_RENTAL | Mobiliário e locação |
| PHOTOGRAPHY | Fotografia e filmagem |
| LIGHTING | Som, iluminação e estrutura |
| MUSIC | Música e DJ |
| ASSEMBLY_CREW | Montagem e desmontagem |

A categoria `OTHER` é exibida como decoração e serviços complementares porque os cadastros regionais de Babi Decor e Bel Festas foram classificados dessa forma no modelo interno. Os serviços detalhados continuam preservados no escopo e nas observações do fornecedor.

## Regras de composição e cálculo

A proposta começa pelos fornecedores marcados pela assessora. Na modalidade `FULL_EVENT`, todas as categorias comerciais podem ser selecionadas. Na modalidade `DECORATION_ONLY`, ficam disponíveis somente flores e folhagens, móveis e locações, iluminação decorativa, itens complementares e montagem/desmontagem.

Para cada fornecedor, o sistema cria um item de serviço com o escopo informado, quantidade padrão igual a 1 e valor unitário igual ao valor digitado pela assessora. Quando nenhum valor é digitado, o sistema usa `estimatedCost` se estiver preenchido no cadastro; caso contrário, o item permanece com valor zero e status `QUOTE_PENDING`.

O cálculo utilizado é:

```text
logística adicional = soma dos itens de logística com tratamento `ADDITIONAL`
subtotal = soma dos itens de serviço incluídos + logística adicional
contingência = subtotal × percentual de contingência ÷ 100
total = subtotal + contingência + taxa de gestão − desconto
```

Itens de logística com tratamento `INCLUDED` ou `NOT_APPLICABLE` são exibidos para transparência, mas têm valor zero no cálculo. A assessora deve evitar duplicidade quando o fornecedor já tiver incluído transporte ou montagem na cotação principal.

Os valores monetários são armazenados em reais brasileiros, arredondados para duas casas decimais e sincronizados com `Proposal.investmentAmount` para manter compatibilidade com o fluxo de proposta existente.

## Status de preço e validação

| Status | Significado para a assessora | Tratamento no PDF |
|---|---|---|
| `ESTIMATE` | Existe uma estimativa de catálogo, mas ainda não há cotação final | Exibido como “Estimativa” |
| `QUOTE_PENDING` | É necessário solicitar orçamento ou confirmar o valor | Exibido como “Cotação pendente” |
| `CONFIRMED` | A assessora confirmou o preço ou recebeu uma cotação aplicável | Exibido como “Confirmado” |

A proposta fica marcada com `hasUnconfirmedData = true` quando houver fornecedor com contato não confirmado, preço não confirmado ou espaço pesquisado com status `REQUIRES_CONFIRMATION`. Isso não impede a geração do documento; apenas evita que uma prévia seja confundida com contrato.

## Fluxo de uso

Na tela de projeto, abra a proposta criativa e clique em **“Montar proposta comercial integrada”**. Primeiro escolha **“Evento completo”** ou **“Somente decoração”**. Em seguida, selecione um espaço do catálogo pesquisado ou mantenha o espaço interno do projeto. Marque os fornecedores disponíveis para a modalidade, revise o escopo, substitua estimativas por valores de cotações recebidas e escolha o status de preço correspondente.

Depois, adicione itens personalizados quando necessário, registre os custos de logística por fornecedor e espaço e cadastre as cotações recebidas. As cotações permanecem no histórico mesmo quando uma alternativa é marcada como selecionada, rejeitada ou expirada. Em seguida, informe contingência, taxa de gestão, desconto e validade. Salve a composição comercial. O sistema recalcula o investimento, grava um snapshot dos dados selecionados e disponibiliza o botão **“Baixar PDF comercial”**. Antes de enviar ao casal, confirme disponibilidade, escopo, deslocamento, montagem, taxas do espaço, impostos, direitos de imagem, gerador, licenças e demais condições contratuais.

## Endpoints

| Método | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/creative/proposals/:proposalId/commercial` | Cria ou atualiza a composição comercial |
| `GET` | `/creative/proposals/:proposalId/commercial` | Consulta o snapshot salvo |
| `GET` | `/creative/proposals/:proposalId/commercial/pdf` | Gera o PDF comercial para download |
| `GET` | `/creative/proposals/:proposalId/commercial/quotes` | Lista o histórico de cotações |
| `POST` | `/creative/proposals/:proposalId/commercial/quotes` | Registra uma cotação recebida |
| `PATCH` | `/creative/proposals/:proposalId/commercial/quotes/:quoteId/status` | Atualiza o status da cotação |
| `GET` | `/knowledge-graph/wedding-knowledge` | Lista espaços pesquisados, formatos e tendências |
| `GET` | `/knowledge-graph/suppliers` | Lista fornecedores cadastrados |

## Exemplo de payload de salvamento

```json
{
  "scope": "DECORATION_ONLY",
  "venueResearchId": "id-do-espaco-pesquisado",
  "supplierSelections": [
    {
      "supplierId": "id-da-decoracao",
      "scope": "Flores, móveis, iluminação decorativa, mesa posta, objetos, montagem e desmontagem.",
      "unitPrice": 12000,
      "pricingStatus": "ESTIMATE"
    }
  ],
  "logisticsItems": [
    {
      "supplierId": "id-da-decoracao",
      "label": "Transporte de peças e montagem",
      "treatment": "ADDITIONAL",
      "quantity": 1,
      "unit": "serviço",
      "unitPrice": 1800,
      "pricingStatus": "QUOTE_PENDING"
    }
  ],
  "contingencyPercent": 5,
  "managementFee": 3500,
  "discount": 0,
  "validityDays": 10,
  "commercialNotes": "Valores sujeitos à confirmação de disponibilidade e escopo final."
}
```

## Proteções comerciais

O modelo não inventa contato, disponibilidade ou preço de fornecedor. Os dados regionais que não têm telefone ou e-mail confirmados continuam exibindo “Contato a confirmar”. O snapshot também preserva o que foi apresentado no momento da proposta, de modo que uma alteração futura no cadastro do fornecedor não reescreva silenciosamente um documento já enviado.

O modelo não reserva automaticamente espaço ou fornecedor, não substitui contrato e não altera a `main`. A implementação operacional atual está isolada na branch `feat/eve-commercial-operations-v1` e deve ser revisada em Preview antes de qualquer promoção.

## Pacotes comerciais

A assessora pode cadastrar até três alternativas: `ESSENTIAL`, `RECOMMENDED` e `COMPLETE`. O EVE OS preserva nome, descrição, investimento, status de preço e indicação de pacote recomendado. Os valores devem ser informados pela assessora a partir de composição ou cotação real; o sistema não aplica descontos fictícios nem cria diferenças automáticas entre os pacotes.

O pacote marcado como recomendado aparece destacado no editor e no PDF. Um pacote com valor ainda não confirmado permanece identificado como `Estimativa` ou `Cotação pendente`.

## Custo interno e margem

O campo de custo interno é opcional e deve ser preenchido somente com custo real ou estimado conhecido pela assessora. Quando informado, o sistema calcula:

```text
margem = investimento total − custo interno
margem percentual = margem ÷ investimento total × 100
```

Se o custo interno não for informado, a margem permanece vazia. Isso evita que o EVE OS apresente uma margem inventada.

## Agenda financeira

A agenda financeira registra parcelas comerciais sem substituir contrato, cobrança ou conciliação bancária. Cada parcela possui descrição, valor, vencimento, status, forma de pagamento e data de recebimento.

| Status | Uso |
|---|---|
| `PENDING` | Parcela prevista, ainda sem agendamento final |
| `SCHEDULED` | Parcela com vencimento organizado |
| `PAID` | Recebimento registrado |
| `OVERDUE` | Vencimento ultrapassado sem registro de recebimento |
| `CANCELLED` | Parcela cancelada ou substituída |

As parcelas aprovadas podem aparecer na agenda do PDF comercial. O cadastro de pagamento não confirma automaticamente uma transação bancária; ele registra a informação operacional fornecida pela assessora.

## Endpoints adicionais

| Método | Endpoint | Finalidade |
|---|---|---|
| `GET` | `/creative/proposals/:proposalId/commercial/payments` | Lista parcelas da proposta |
| `POST` | `/creative/proposals/:proposalId/commercial/payments` | Cria uma parcela |
| `PATCH` | `/creative/proposals/:proposalId/commercial/payments/:paymentId` | Atualiza status ou recebimento |

Os endpoints de pagamentos, cotações e propostas exigem autenticação e validam a organização do usuário antes de acessar os dados.

## Nota de release

A primeira release operacional foi registrada na branch `feat/eve-commercial-operations-v1`. As migrations devem ser aplicadas na API com `npx prisma migrate deploy` antes de testar os novos campos em outro ambiente.

O lint do frontend ainda apresenta dois avisos preexistentes sobre uso de `<img>` em `apps/web/src/app/fornecedores/page.tsx`; typecheck, builds, Prisma e testes permanecem aprovados.

## Proteções comerciais

O modelo não inventa contato, disponibilidade ou preço de fornecedor. Os dados regionais que não têm telefone ou e-mail confirmados continuam exibindo “Contato a confirmar”. O snapshot também preserva o que foi apresentado no momento da proposta, de modo que uma alteração futura no cadastro do fornecedor não reescreva silenciosamente um documento já enviado.

O modelo não reserva automaticamente espaço ou fornecedor, não substitui contrato e não altera a `main`. A implementação operacional atual está isolada na branch `feat/eve-commercial-operations-v1` e deve ser revisada em Preview antes de qualquer promoção.

## Portal público de aprovação

A assessora pode gerar um link para o casal quando a proposta estiver nos estados `READY` ou `SENT`. O link usa um token aleatório, mas a API armazena apenas o hash SHA-256 do token. O link expira conforme a validade informada e gerar um novo link revoga os links pendentes anteriores.

O casal visualiza somente os dados necessários para decisão: espaço, modalidade, fornecedores selecionados, itens, logística, pacotes, investimento, condições e alertas de confirmação. O custo interno e a margem não são expostos no portal público.

A decisão pode ser `APPROVED` ou `REJECTED`. Aprovar atualiza a proposta comercial, cria uma versão de auditoria e sincroniza os fornecedores selecionados como `BOOKED`. Solicitar ajustes devolve a proposta para revisão e registra o comentário informado.

O link não substitui assinatura eletrônica, contrato ou confirmação de pagamento. Para uma contratação juridicamente formal, o EVE OS deverá ser integrado posteriormente a um provedor de assinatura e a um mecanismo de confirmação de identidade.
