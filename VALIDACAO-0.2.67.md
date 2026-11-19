# 0.2.67 — preservar a última janela confiável

Correção do relato de Marcos de 19/11/2026, 03:46 UTC: dólar ainda cinza apesar da atualização0.2.66. Reproduzido, não atribuído a instalação antiga.

## Causa reproduzida
Yahoo query1/query2, ranges5d/1mo, resolução5m: metadados às03:33:43UTC, mas curva USD/BRL com último ponto18/11 20:40UTC. A referência aproximadamente24h antes da cotação nova estava em lacuna de mais de3h, fora da tolerância5min. A0.2.66 apagava retorno e mostrava — mesmo havendo janela anterior válida. Expandir histórico pela comparação coveredMs não resolvia o empate entre respostas.

## Correção e contrato
- Após unir histórico e cache, tenta primeiro a cotação atual com janela íntegra. Se insuficiente, busca regressivamente a última janela histórica completa, inclusive em cache frio. Preserva cache validado mais novo que a recuperação histórica ou que um snapshot de feed regredido.
- Preserva o conjunto preço/horário/gráfico/percentual; não combina preço novo com retorno antigo. Retorno permanece24h negociadas com a mesma tolerância máxima5min. Não usa fechamento diário, não inventa zero e não aumenta tolerância.
- Data e hora da janela preservada ficam visíveis, com informação de recuperação na acessibilidade e saúde da fonte. Cotação bruta mais recente permanece separada em latestQuote para auditoria.
- Expansão de histórico une dados, em vez de descartá-los por coveredMs empatado.
- README diferencia atualizar código remoto de consultar dados. Sem apagar projeto/widget/cache.

## Validação
Suíte completa npm test; nova regressão fria/quente/offline, histórico parcial, cache válido mais recente, feed regredido, fonte errada, expansão completa com coveredMs menor, falta total de base; todos passaram. Compilação18módulos. Model, host, widget view e Canvas reais renderizados no Linux com captura Yahoo atual; inspeção visual small/medium/large. Retorno recuperado frio+1,337591%: 5,7715997696 em17/11 20:35UTC →5,8488001823 em18/11 20:40UTC,24h04m de sessão. Mostra+1,34%verde e18/11 17:40Brasília. Cache íntegro anterior de20:43UTC é preservado se mais recente. Payloads reais não redistribuídos.

Limites: não houve execução no iPhone. Sem qualquer janela válida, mantém — (nunca zero inventado); dependência do calendário do fornecedor e resolução5m continuam. A correção usa o mesmo provedor/destino, sem credenciais/fontes novas.
