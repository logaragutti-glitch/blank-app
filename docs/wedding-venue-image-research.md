# Inventário visual de espaços de casamento

## Escopo

Este catálogo reúne referências de fotografias reais dos 20 espaços de casamento já cadastrados no EVE OS, pesquisadas em 17 de agosto de 2026. Foram priorizados sites oficiais e perfis oficiais; diretórios especializados foram usados apenas quando não havia imagem oficial verificável.

As imagens não foram baixadas, reempacotadas ou republicadas. O banco armazena URLs públicas, página-fonte, ambiente retratado, crédito, confiança e status de direitos. Todo registro entra como `usageScope = REFERENCE_ONLY` e `approvedForPublication = false` até existir autorização específica.

## Cobertura

A pesquisa encontrou 99 referências visuais para 20 espaços. Destas, 71 vêm de fontes oficiais sem licença de reutilização publicada e 28 vêm de diretórios especializados. Os registros de diretório não são autorização de uso; servem apenas para compreender o espaço e orientar uma eventual solicitação de autorização.

| Fonte | Registros | Tratamento |
|---|---:|---|
| Site ou perfil oficial | 71 | Referência visual; autorização não presumida |
| Diretório especializado | 28 | Referência de pesquisa; não usar em publicação |
| Total | 99 | Todos em `REFERENCE_ONLY` |

## Uso no renderizador

O renderizador pode consultar o endpoint autenticado `GET /knowledge-graph/wedding-knowledge` e selecionar as imagens por espaço e ambiente. A ordem prioriza `isPrimary = true` e depois o tipo de ambiente. A aplicação deve enviar imagens ao modelo apenas como referência contextual e manter o crédito/fonte associado.

Não é permitido tratar uma URL pública como licença de reprodução, material de marketing ou banco de imagens próprio. Para PDF comercial, site público ou anúncio, a equipe deve obter autorização do espaço, fotógrafo ou plataforma e atualizar `approvedForPublication` somente após a confirmação.

## Limitações

CDNs do Instagram, Facebook, Wix e outros provedores podem expirar, alterar parâmetros ou bloquear acesso. Por isso, cada registro também preserva `sourceUrl`, que deve ser usada para revalidar a referência. Ambientes classificados como `desconhecido` não devem ser descritos pela IA como fachada, salão, jardim ou cerimônia sem confirmação visual adicional.

A captura inclui URLs e metadados, não cópias binárias das imagens. Se o projeto obtiver autorização, o fluxo recomendado é fazer upload para o storage próprio, registrar a chave interna, preservar o crédito e trocar o `usageScope` para o escopo autorizado.
