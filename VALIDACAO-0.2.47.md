# Popular Scripting 0.2.47 — validação

## Critério e resultado

Quatro valores e curvas reais para Ibovespa (`^BVSP`), Dow Jones (`^DJI`), dólar (`BRL=X`) e Brent futuro (`BZ=F`). Janela de aproximadamente 24 horas de intervalos observados de até 5 minutos, atravessando fechamentos/fins de semana. Lacunas não somam horas e interrompem curva/preenchimento. O eixo distribui barras observadas, não horas corridas; início/fim reais são mostrados. Percentual permanece diário, sobre fechamento anterior, não retorno da janela inteira.

Em 09/11/2026 às 16:25 UTC, os quatro endpoints 5d/5m responderam HTTP 200, em 8,46–8,56 s. Captura: Ibovespa 170.474,77 pts(+1,17%), Dow 52.178,19 pts(+1,74%), USD/BRL 5,5194(+0,43%), Brent 94,28 USD/bbl(-4,11%). Horários da fonte diferem: Ibovespa 16:10 UTC, Dow/dólar 16:25 UTC, Brent 16:15 UTC. Dados públicos podem ser atrasados; consulta não renova cotação.

## Testes executados

- `npm run check`: sintaxe/imports dos 16 módulos; tipos nativos Scripting não disponíveis neste executor.
- `npm test`: suíte completa, incluindo regressões privadas/legadas B3/BTC/econômicas, transporte, cache, navegação, alertas, renderização e novos testes intradiários. Testes legados 24H/7D continuam separados do novo contrato de tempo cotado.
- `INTRADAY_FIXTURES=validation/live-capture node scripts/test-trading-intraday.cjs`:26 casos com quatro capturas reais, identidade/moeda/tipo/sessões/intervalo, cotação futura/antiga, cache/instrumento, lacunas e ausência de substituição por spot. Barras contíguas com sessões diferentes contam quando não há lacuna real.
- `TRADING_CAPTURE_DIR=validation/live-capture node scripts/test-published-market-profile.cjs`: modelo com motor/host reais e transporte capturado, quatro ativos e cobertura completa, cache separado e nenhum token no provedor público.
- `test-trading-host.cjs`: GET limitado aos quatro símbolos e dois ranges; destinos/querystrings/intervalos inválidos, credenciais e redirects indevidos bloqueados antes do transporte. Orçamentos 30/8 s totais e 20/7 s por consulta Yahoo; limites antigos 6/3 s dos demais serviços preservados.
- `render-trading-preview.cjs`: executa modelo, host, JSX e callbacks Canvas de produção. Skia/Linux e aproximação de Text nativo geram pequeno/médio/grande. Os pixels, quatro preços, curvas, rótulos e datas foram conferidos. Gate decodifica PNG e valida separação de linha/preenchimento nas lacunas.
- `git diff --check` e manifesto de distribuição conferidos. Scripts de testes não fazem pagamentos nem usam tokens reais.

## Evidências

- [Prévia simulada](validation/market-profile-0.2.47-preview.png), [pequeno](validation/market-profile-0.2.47-small.png), [grande](validation/market-profile-0.2.47-large.png).
- [Modelo e renderização](validation/market-profile-0.2.47-preview.json), [transporte real](validation/intraday-0.2.47-transport.json).
- As respostas brutas completas usadas nos testes ficaram locais; testes permanentes têm fixtures sintéticas. Repetir captura é opcional, não condição para rodar a suíte.

## Limitações e atualização

**Não foi executado no iPhone.** Importador, UIFont/SwiftUI/Canvas nativos, toque, memória e agendamento WidgetKit permanecem não confirmados. Prévia simulada não substitui essa validação.

Use a atualização do script remoto no Scripting para obter 0.2.47, depois abra Popular e toque Atualizar. A consulta no app tem mais tempo para preparar cache; chamadas reais desta rodada excederam o limite de 7 s do widget, por isso não prometemos carga inicial a frio na Tela de Início. O cache conserva a cotação/data recebidas. Sem cache válido, mostra indisponível em vez de usar dados incompatíveis. O iOS decide a frequência real.

Yahoo funcionou sem conta/chave, mas esta interface pública não oferece SLA/API oficial validado aqui. Pode atrasar, limitar ou falhar. BZ=F é futuro financeiro NYMEX do provedor, sujeito a rolagem e diferenças de preço; não representa spot ou contrato ICE fixo. Nenhuma credencial privada foi criada, removida ou compartilhada; o perfil B3/BTC legado permanece recuperável.

Publicação no vínculo `main/scripts/Popular Scripting`, sem mudar permissões ou distribuição Scriptable. Este repositório possui workflow de dados econômicos programado/manual, não gate de PR para o app. A publicação deve respeitar proteções do GitHub; não há bypass de CI ou de acesso.
