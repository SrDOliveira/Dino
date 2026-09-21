# Busca externa de concursos — notas de integração

## Situação observada

| Serviço | Constatação | Implicação para o Dino |
|---|---|---|
| Google Custom Search JSON API | Requer ID de mecanismo e chave de API; a página oficial informa que está fechada para novos clientes e que os clientes existentes devem migrar até 1º de janeiro de 2027. | Não é uma base recomendada para uma nova integração. |
| Serper | Apresenta uma API de resultados de busca, com objetos orgânicos que incluem título, link e trecho. | Pode alimentar a tela de confirmação, mantendo no app título, URL, fonte e resumo do resultado. |

## Contrato proposto

A pesquisa receberá o texto do candidato, acrescentará qualificadores de concurso policial quando apropriado e retornará apenas resultados normalizados com `title`, `url`, `snippet` e `source`. O candidato deverá confirmar manualmente órgão, cargo, UF e datas antes de salvar seu objetivo. A chave de acesso ficará somente no servidor, nunca no aplicativo.

## Referências

- https://developers.google.com/custom-search/v1/overview
- https://serper.dev/
