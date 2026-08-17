# Modelo de proposta comercial integrada — EVE OS

## Objetivo

Este modelo transforma a proposta criativa em uma composição comercial apresentável ao casal. Ele reúne o espaço de evento, fornecedores regionais selecionados, escopo de cada contratação, itens opcionais, estimativas de preço, contingência, taxa de gestão, descontos, forma de pagamento, validade, condições e próximos passos.

O documento é deliberadamente transparente: um valor cadastrado como estimativa não é apresentado como preço confirmado. A proposta também sinaliza quando o contato do fornecedor, a disponibilidade do espaço ou o preço ainda precisam ser confirmados.

## Estrutura apresentada ao cliente

| Seção | Conteúdo integrado | Origem no EVE OS |
|---|---|---|
| Capa | Nomes do casal, tipo do evento, data, convidados, espaço e validade | Client, Event, Venue e CommercialProposal |
| Espaço e premissas | Município, tipo, capacidade, hospedagem, serviços, notas e evidências | WeddingVenueResearch ou Venue |
| Equipe e fornecedores | Categoria, nome, contatos, área, escopo, status de contato e status do preço | Supplier e ProjectSupplier |
| Investimento | Itens, quantidade, valor unitário, subtotal, contingência, gestão, desconto e total | CommercialProposal.lineItems |
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

A proposta começa pelos fornecedores marcados pela assessora. Para cada fornecedor, o sistema cria um item de serviço com o escopo informado, quantidade padrão igual a 1 e valor unitário igual ao valor digitado pela assessora. Quando nenhum valor é digitado, o sistema usa `estimatedCost` se estiver preenchido no cadastro; caso contrário, o item permanece com valor zero e status `QUOTE_PENDING`.

O cálculo utilizado é:

```text
subtotal = soma dos itens incluídos
contingência = subtotal × percentual de contingência ÷ 100
total = subtotal + contingência + taxa de gestão − desconto
```

Os valores monetários são armazenados em reais brasileiros, arredondados para duas casas decimais e sincronizados com `Proposal.investmentAmount` para manter compatibilidade com o fluxo de proposta existente.

## Status de preço e validação

| Status | Significado para a assessora | Tratamento no PDF |
|---|---|---|
| `ESTIMATE` | Existe uma estimativa de catálogo, mas ainda não há cotação final | Exibido como “Estimativa” |
| `QUOTE_PENDING` | É necessário solicitar orçamento ou confirmar o valor | Exibido como “Cotação pendente” |
| `CONFIRMED` | A assessora confirmou o preço ou recebeu uma cotação aplicável | Exibido como “Confirmado” |

A proposta fica marcada com `hasUnconfirmedData = true` quando houver fornecedor com contato não confirmado, preço não confirmado ou espaço pesquisado com status `REQUIRES_CONFIRMATION`. Isso não impede a geração do documento; apenas evita que uma prévia seja confundida com contrato.

## Fluxo de uso

Na tela de projeto, abra a proposta criativa e clique em **“Montar proposta comercial integrada”**. Em seguida, selecione um espaço do catálogo pesquisado ou mantenha o espaço interno do projeto. Marque os fornecedores desejados, revise o escopo, substitua estimativas por valores de cotações recebidas e escolha o status de preço correspondente.

Depois, informe contingência, taxa de gestão, desconto e validade. Salve a composição comercial. O sistema recalcula o investimento, grava um snapshot dos dados selecionados e disponibiliza o botão **“Baixar PDF comercial”**. Antes de enviar ao casal, confirme disponibilidade, escopo, deslocamento, montagem, taxas do espaço, impostos, direitos de imagem, gerador, licenças e demais condições contratuais.

## Endpoints

| Método | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/creative/proposals/:proposalId/commercial` | Cria ou atualiza a composição comercial |
| `GET` | `/creative/proposals/:proposalId/commercial` | Consulta o snapshot salvo |
| `GET` | `/creative/proposals/:proposalId/commercial/pdf` | Gera o PDF comercial para download |
| `GET` | `/knowledge-graph/wedding-knowledge` | Lista espaços pesquisados, formatos e tendências |
| `GET` | `/knowledge-graph/suppliers` | Lista fornecedores cadastrados |

## Exemplo de payload de salvamento

```json
{
  "venueResearchId": "id-do-espaco-pesquisado",
  "supplierSelections": [
    {
      "supplierId": "id-do-buffet",
      "scope": "Buffet completo para 120 convidados, bebidas e equipe de serviço.",
      "unitPrice": 28500,
      "pricingStatus": "QUOTE_PENDING"
    },
    {
      "supplierId": "id-da-decoracao",
      "scope": "Ambientação da cerimônia, recepção, mesa do bolo e lounges.",
      "unitPrice": 12000,
      "pricingStatus": "ESTIMATE"
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

O modelo não reserva automaticamente espaço ou fornecedor, não substitui contrato e não altera a `main`. A implementação foi isolada na branch `feat/commercial-proposal-template` e deve ser revisada em Preview antes de qualquer promoção.
