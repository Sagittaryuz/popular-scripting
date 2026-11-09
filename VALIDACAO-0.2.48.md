# Popular Scripting 0.2.48 — relógio de recebimento

## Falha reproduzida e causa

A evidência real da 0.2.47 no aparelho mostrou Ibovespa e Brent futuro com valores/curvas, mas Dow Jones e dólar indisponíveis. Não havia validação dos quatro ativos no iPhone.

As capturas reais da rodada anterior permitem reproduzir exatamente o problema: consultas iniciadas aproximadamente às 16:25:17,7 UTC de 09/11/2026 terminaram às 16:25:26 UTC. Dow e dólar traziam `regularMarketTime=16:25:25`, posterior ao início, mas anterior ao recebimento. O motor comparava a cotação com o relógio congelado no início e descartava ambas como futuras. Ibovespa 16:10 e Brent 16:15, atrasados pela fonte, passavam.

O teste anterior carregava respostas já capturadas e só depois iniciava o modelo, eliminando a corrida temporal. Consulta HTTP 200, parsing posterior e imagem simulada não provavam essa condição de execução.

## Correção

- Motor `2026.11.09.98`: validação, cache, combinação do histórico e renderização intradiários usam o horário atual ao processar a resposta. O relógio explícito `options.now` dos testes permanece determinístico.
- Cotação realmente posterior ao recebimento continua rejeitada. Não há tolerância arbitrária, ajuste do horário do provedor nem preço inventado.
- Os mesmos quatro símbolos, fonte, endpoints, cache por instrumento, cobertura de 24 horas cotadas e limites de rede foram preservados. Nenhuma mudança visual, credencial, permissão ou fonte nova.

## Verificações

- Regressão no modelo e host empacotados de produção, com relógio avançando durante a resposta: versão anterior reproduz Ibovespa/Brent válidos e Dow/dólar ausentes; correção aceita os quatro.
- Respostas futuras de fato, fallback do cache e preservação das datas cobertos pela regressão.
- Build/imports de 16 módulos, suíte completa, 26 casos intradiários com capturas reais, comparação de dados/identidade/cache, três tamanhos de prévia e manifesto conferidos.
- [Prévia simulada da .48](validation/market-profile-0.2.48-preview.png), [dados da prévia](validation/market-profile-0.2.48-preview.json). São replay das respostas reais de 16:25 UTC, não novas cotações nem foto do iPhone.

Uma tentativa nova à fonte retornou HTTP 429. Não houve insistência, troca de rota ou contorno do limite. O teste desta correção reaproveita as capturas reais válidas e o avanço temporal que havia faltado.

## Limites e atualização

O iPhone físico ainda não executou esta correção de forma confirmada. Rede, cache inicial, limites do Yahoo e agenda do iOS continuam independentes desta falha temporal.

Atualize o vínculo remoto do Popular Scripting para **0.2.48 / motor 2026.11.09.98**. Abra o projeto e use **Atualizar** para preparar os dados/cache com o orçamento maior do app. O botão interno não instala código novo. Não apague o projeto nem seus caches.

A origem e o destino permanecem `Sagittaryuz/popular-scripting`, pasta `main/scripts/Popular Scripting`. A publicação deve respeitar as proteções e confirmações do GitHub.
