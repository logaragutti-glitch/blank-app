# Mineirart — Catálogo da Região dos Lagos

**Fornecedor:** Mineirart — Região dos Lagos  
**Categoria:** `FURNITURE_RENTAL`  
**Fonte principal:** [Loja Região dos Lagos](https://mineirart.com.br/regiao-dos-lagos/)  
**Data da captura:** 17 de agosto de 2026

## Escopo

Este inventário foi construído exclusivamente a partir das categorias publicadas na loja Região dos Lagos da Mineirart. O catálogo não mistura produtos das lojas Rio ou de outras regiões. Cada categoria guarda a URL correspondente, o número de produtos anunciado pela loja, os nomes de produtos legíveis na página e o estado de extração.

O site usa categorias amplas e possui sobreposição entre elas. Um mesmo item pode aparecer, por exemplo, em Bancos, Puffs e Poltronas. Por isso, os nomes foram consolidados quando a página indicava claramente a mesma família, mas os códigos e as variações de tamanho/cor permanecem como referência da fonte quando estavam legíveis.

## Categorias encontradas

| Categoria | Tipo no EVE OS | Produtos anunciados | Estado |
|---|---|---:|---|
| Almofadas | TEXTILE | 20 | Nomes completos |
| Aparadores | FURNITURE | 27 | Nomes completos |
| Arcos, Gazebos e Portas/Cerimônia | STRUCTURE | 19 | Nomes completos |
| Artigos Decorativos | DECOR | 41 | Categoria, nomes pendentes |
| Bancos | FURNITURE | 42 | Nomes completos, com sobreposição |
| Banquetas | FURNITURE | 18 | Nomes completos, com itens relacionados |
| Barcos e Artigos Térmicos | ACCESSORY | 2 | Categoria, nomes pendentes |
| Bares | FURNITURE | 19 | Código parcial, nomes pendentes |
| Biombos | STRUCTURE | 4 | Nomes completos |
| Bistrôs | FURNITURE | 27 | Nomes completos |
| Cadeiras | FURNITURE | 50 | Modelos consolidados por família |
| Carrinhos | FURNITURE | 3 | Nomes completos |
| Decks | STRUCTURE | 1 | Nome completo |
| Diversos | OTHER | 3 | Página sem extração |
| Estantes | FURNITURE | 14 | Nomes completos |
| Luminárias | LIGHTING | 59 | Códigos e descrições parciais |
| Mesas de Centro/Lateral | FURNITURE | 61 | Nomes parciais |
| Mesas para Bolo | FURNITURE | 34 | Códigos parciais |
| Mesas para Convidados | FURNITURE | 88 | Nomes completos |
| Ombrelones | STRUCTURE | 1 | Nome completo |
| Poltronas | FURNITURE | 24 | Nomes completos, com sobreposição |
| Puffs | FURNITURE | 23 | Nomes completos, com sobreposição |
| Sofás | FURNITURE | 37 | Sofá Serena confirmado; demais pendentes |
| Sousplats | ACCESSORY | 1 | Nome completo |
| Tapetes | TEXTILE | 40 | Nomes completos |

A soma dos números exibidos nas 25 categorias é **658 anúncios**, mas não deve ser interpretada como 658 SKUs únicos, pois a própria loja reapresenta famílias, conjuntos, cores, medidas e itens relacionados em mais de uma categoria.

## Qualidade e limites

As páginas de Sofás, Mesas de Centro/Lateral e Mesas para Bolo retornaram parte dos preços, códigos ou medidas sem o nome completo do produto. Artigos Decorativos, Barcos e Artigos Térmicos e Diversos também não expuseram nomes suficientes na extração. Esses itens foram preservados como pendentes, sem nomenclatura inventada.

A categoria Luminárias informa repetidamente que a Mineirart não realiza instalação. Esse dado foi mantido nas notas do catálogo. Luminárias, tapetes, almofadas, sousplats, ombrelones, decks e artigos decorativos não devem ser tratados como móveis convencionais, embora pertençam ao inventário geral do fornecedor.

## Integração no EVE OS

A migration `20260817170000_add_supplier_catalog_categories` cria a tabela `supplier_catalog_categories` e o enum `SupplierCatalogCategoryType`. O seed cria ou atualiza o fornecedor regional de forma idempotente e insere as 25 categorias com fonte, contagem, nomes e estado de extração.

A API expõe o inventário por:

```text
GET /knowledge-graph/suppliers/:id/catalog
```

A rota mantém isolamento por `organizationId` e devolve o fornecedor e suas categorias em ordem por tipo e nome. O seed também registra os contatos publicados na loja: `(21) 2516-3734` e `(22) 2648-7045`.

## Referência

[1]: https://mineirart.com.br/regiao-dos-lagos/ "Mineirart — Loja Região dos Lagos"
