## 0.2.40 - perfil IBOV/Dow/USD/Brent e fallback visual completo

- Ativa `IBOV`, `DOW_JONES`, `USD/BRL` e `BRENT` nessa ordem, preservando o
  perfil anterior B3/BTC em configuração recuperável.
- Reutiliza o Worker privado para o IBOV, o adaptador AwesomeAPI para USD/BRL
  e a série diária EIA/FRED `DCOILBRENTEU` para Brent. O gráfico Brent é
  convertido para EOD real de 7 dias, sem interpolar fins de semana ou criar
  pontos.
- Mantém Dow Jones explicitamente indisponível até haver fonte pública,
  documentada e autorizada sem nova credencial; não usa ETF, WTI ou valor
  fixo.
- Adiciona badges locais `IB`, `DJ`, bandeira dos EUA e `BR`, garantindo que
  todos os ícones tenham renderização visível mesmo sem metadado remoto.
- Testes de contrato, regressão, prévia SVG/PNG e suíte completa passaram;
  iPhone nativo não testado.

## 0.2.39 - logos API inline e nomes uniformes

- Corrige o caminho dos logos API do perfil privado: materializa os SVGs
  retornados pelos metadados com validação de MIME e conteúdo seguro, renderiza
  via `SVG.code` e mantém o fallback de iniciais fora da máscara. O IBOV fica
  com iniciais quando não há logo fornecido, sem ETF ou URL inventada.
- Remove a bolinha visual de status e dá à identidade um único texto semibold
  de 5.5pt, uma linha, reticências e toda a coluna de 40pt; não há redução
  individual de nomes.
- Mantém dados, credenciais, Worker, ordem, gráficos, domínio por série e
  janela móvel de 7 dias. Prévia é fixture-only; iPhone nativo não testado.

## 0.2.38 - domínio horizontal por série nas curvas

- Normaliza cada curva visível entre o primeiro e o último timestamp real da
  própria série, fazendo os extremos ocuparem as mesmas bordas úteis em todas
  as linhas e tamanhos do widget.
- Mantém a proporção temporal dos pontos intermediários, a ordem cronológica,
  os valores, o filtro móvel de 7 dias e a ausência honesta de curva para
  séries de um ponto ou com observação nula; não cria pontos nem preenche fins
  de semana.
- Inclui comparação visual fixture-only em small `158×158` e medium `338×170`.
  Testes locais passaram; iPhone nativo não foi testado.

## 0.2.37 - fallback nativo para logos SVG da API

- Corrige o caminho visual do perfil B3/BTC: uma URL SVG da API não suprime
  mais o badge de iniciais quando o `SVG.url` não baixa ou não renderiza no
  snapshot do Scripting.
- Restringe a renderização remota ao host HTTPS efetivamente permitido
  `icons.brapi.dev`; o logo retornado continua sendo tentado sem proxy e o
  fallback é neutro e do próprio código, sem imagem inventada ou ativo errado.
- Preserva valores, gráficos, token, `range=1mo`, janela 7D, ordem, layout e
  tamanhos. Testes locais passaram; iPhone nativo não foi testado.

## 0.2.36 - código seguro da falha upstream

- A linha **Fonte privada:** passa a mostrar, quando o Worker fornecer, apenas
  `upstreamCode` de uma allow-list fixa (`BAD_REQUEST`, `VALIDATION_ERROR`,
  `QUOTES_PER_REQUEST_EXCEEDED`, `INVALID_RANGE`, `INVALID_INTERVAL`,
  `MISSING_TOKEN`, `INVALID_TOKEN`, `FEATURE_NOT_AVAILABLE`,
  `MODULES_NOT_AVAILABLE` ou `NOT_FOUND`). Mensagens, `details`, corpo HTTP e
  credenciais continuam descartados.
- Mantém token, endpoint, parâmetros, layout, perfil BBAS3/BBDC4/IBOV/BTC/USD,
  ordem, cache e janela de 7 dias. Não migra a API nem inventa cotações.
- Testes locais cobrem código permitido e código desconhecido filtrado; o
  Worker e o iPhone nativo não foram executados neste checkout.

## 0.2.35 - diagnóstico seguro da fonte privada

- O app em primeiro plano mostra uma categoria segura para a fonte privada:
  token ausente/inválido, Keychain indisponível, resposta válida, cache,
  401/403/429, outros HTTP 4xx, indisponibilidade do Worker, erro de rede ou
  bundle inválido. Quando o Worker fornecer o diagnóstico novo, a tela também
  pode mostrar somente o status upstream e o ativo permitido, sem corpo HTTP.
  Nenhum token, corpo de resposta ou dado sensível é exibido ou persistido.
- O widget mantém exatamente o mesmo layout, perfil BBAS3/BBDC4/IBOV/BTC/USD,
  janela de 7 dias, ordem e fallback sem cotação. O diagnóstico é somente na
  tela do app para permitir distinguir configuração, transporte, fonte e cache.
- A investigação do Worker encontrou requisições autenticadas chegando à
  brapi, mas todas as subconsultas observadas retornando 4xx. O código exato
  não foi exposto; o Worker preparado ainda usa `/api/quote/{ticker}`. A
  documentação atual recomenda `/api/v2/stocks/*` para integrações novas,
  mas mantém a rota v1 ativa. A correção do upstream permanece no executor do
  Worker; esta versão não altera o Worker nem inventa valores.
- Testes locais cobrem token ausente, 401, 503, resposta inválida, resposta
  válida e cache após falha. iPhone nativo e consulta ponta a ponta continuam
  sem validação neste executor.

## 0.2.34 - entrada segura nativa do Scripting

- Substitui a API de alerta específica do Scriptable por `Dialog.prompt` do
  Scripting com entrada obscurecida.
- A recarga só ocorre quando a gravação do token no Keychain retorna sucesso;
  falha de armazenamento permanece explícita e não envia credencial.
- Preserva o perfil B3/BTC, BTC/USD, layout, ordem, janela de 7 dias e fallback
  sem dados. Testes locais passaram; iPhone nativo e Worker ao vivo continuam
  pendentes.

## 0.2.33 - cliente privado B3/BTC

- Publica o perfil `BBAS3`, `BBDC4`, `IBOV` e `BTC/USD` com janela de 7 dias,
  preservando a lista fixa anterior como recuperação.
- Troca a consulta pública direta dos três ativos B3 por um endpoint privado
  autenticado. O token é configurado por campo seguro no Scripting e lido
  somente do Keychain; nenhum segredo, payload real ou cache é versionado.
- Mantém o BTC/USD, o layout, logos/fallbacks, ordem e ausência honesta quando
  a fonte privada não estiver disponível. Testes locais passaram; não houve
  teste nativo no iPhone nem validação ponta a ponta neste executor.

## 0.2.32 - versão identificável da integração DadosB3

- Bump coerente do pacote Scripting, modelo, bundle do motor e manifesto para
  permitir que instalações existentes obtenham e identifiquem o cliente
  DadosB3 publicado.
- Mantém BBAS3, BBDC4 e IBOV em consulta direta EOD, cache privado, ausência
  honesta quando a fonte falha e todos os ajustes de layout, ordem, BTC e
  janela de 7 dias. Nenhum payload real é empacotado; iPhone nativo não foi
  testado.
- O renderer aceita somente URL de imagem explicitamente presente nos
  metadados (`logoUrl`, `logoURL`, `imageUrl`, `imageURL`, `iconUrl`,
  `iconURL` e equivalentes); baixa/cacheia a imagem apenas localmente e usa
  as iniciais circulares quando o campo não existe ou falha. Os metadados B3
  verificados até aqui não fornecem logo.
- Para BBAS3/BBDC4, a lista pública da Brapi é consultada uma vez apenas para
  `stocks[].logo`; nenhuma cotação Brapi é usada. IBOV e BTC/USD continuam com
  fallback de iniciais, sem URL montada ou proxy de imagem.

## 0.2.31 - fallback visual dos quatro ativos

- Substitui o badge genérico de documento nos quatro ativos do perfil de teste
  por círculos neutros com iniciais vetoriais (`BB`, `BD`, `IB`, `BTC`), sem
  alegar marcas ou inventar imagens.
- Reduz de forma conservadora a tipografia de nomes longos e aplica escala
  nativa limitada dentro da coluna de identidade, mantendo o ponto de estado
  após o texto e fora do gráfico.
- Preserva dados, ordem, fontes, lista anterior recuperável, período 7D,
  `7d indisponível`, refresh e todas as dimensões. Prévia fixture-only;
  iPhone nativo não testado.
- Integra o cliente direto DadosB3 para BBAS3, BBDC4 e IBOV: fechamentos
  COTAHIST EOD, variação entre os dois últimos fechamentos, janela de sete
  dias sem preencher lacunas e cache somente privado. Nenhum dado real é
  empacotado ou redistribuído; a consulta exige uso pessoal conforme os termos
  do serviço. A validação ao vivo deste executor retornou HTTP 403.

## 0.2.30 - perfil publicado de quatro ativos e janela de 7 dias

- Ativa no entry publicado o teste reversível `BBAS3`, `BBDC4`, `IBOV` e
  `BTC/USD`, nessa ordem, em small/medium/large; o formato 4×2 não repete os
  quatro ativos na segunda coluna.
- Mantém a lista fixa anterior no código para recuperação. BBAS3, BBDC4 e IBOV
  são reservas B3 explicitamente sem fonte/cotação/curva até validação; nenhum
  preço ou variação é inventado.
- O `BTC/USD` usa o adaptador público Kraken com `XBT/USD`/`ZUSD`, ticker no
  horário de consulta, variação móvel de 24 h e OHLC horário fechado dentro da
  janela real de 7 dias (168 h). Falha de rede não vira cotação.
- O caminho publicado foi testado em `loadModel` → `collectRows`; cache antigo e
  catálogo adicional não substituem o perfil. A prévia é demonstrativa e
  fixture-only; iPhone nativo não testado.
- Documentação primária do contrato: [OHLC](https://docs.kraken.com/api-reference/market-data/get-ohlc-data),
  [Ticker](https://docs.kraken.com/api-reference/market-data/get-ticker-information)
  e [AssetPairs](https://docs.kraken.com/api-reference/market-data/get-tradable-asset-pairs).

## 0.2.29 - folga explícita entre nome e status

- Corrige a colisão residual observada em pixels no fim de `IPCA`, `Ibovespa`
  e `Diesel S10`: a coluna de identidade reserva 27 pt para o nome, 8 pt de
  espaço, 3 pt para a bolinha e 2 pt de folga final dentro dos 40 pt.
- Runtime e prévia usam a mesma reserva e a mesma compressão nominal; o
  `Text` nativo continua limitado à sua caixa, e o ponto permanece depois do
  texto sem sair da coluna. O restante da geometria, dados, fontes, ordem,
  curvas, refresh e unidades permanece inalterado.
- A prévia `validation/widget-preview-0.2.29.png` inclui recortes ampliados
  verificados dos nomes curtos e longos. É fixture-only; iPhone nativo não
  testado.

## 0.2.28 - correção de agrupamento vertical e ajuste de texto

- Corrige a causa visual da 0.2.27: nome/data e valor/variação deixavam de ser
  pares compactos e alguns pontos eram desenhados sobre nomes longos. A linha
  agora usa colunas medidas de 28/40/46/26 pt, com ícone de 26 pt, os dois
  blocos centrados no meio da linha e a unidade compacta entre valor e
  variação, longe do divisor.
- A coluna de identidade mede o nome antes de posicionar a bolinha de 3 pt e
  aplica redução real de fonte dentro da reserva de 40 pt. O código/data fica
  na segunda linha do mesmo bloco; nenhum texto entra no gráfico ou na
  cotação.
- Preserva dados, fontes, ordem fixa, janela real de 24 h, fallback honesto,
  bandeira, status, refresh, hitboxes, quatro/oito indicadores e os tamanhos
  2×2/4×2. A prévia `validation/widget-preview-0.2.28.png` é fixture-only;
  iPhone nativo não testado.

## 0.2.27 - distribuição em quatro colunas

- Reorganiza cada linha em quatro colunas reais e estáveis: ícone circular de 26 pt, nome/status com `código | data` abaixo, sparkline e cotação/variação à direita. As colunas do ícone e da identidade têm 32 pt; gráfico e cotação têm 50/26 pt, com 2 pt entre elas.
- Recoloca o ícone no diâmetro anterior à 0.2.25 e centraliza-o verticalmente na linha de 36 pt. O gráfico mantém altura de 20 pt, janela real de 24 h e `24h indisponível` para séries sem observações intraday válidas; nenhuma série ou preço foi inventado.
- Preserva bandeira circular dos EUA, bolinha/status e semântica de sessão, ordem fixa, unidades compactadas, cores, refresh/feedback por linha, hitboxes e tamanhos 2×2/4×2. Nomes longos e metadados ficam limitados à coluna de identidade, sem entrar no gráfico ou na cotação.
- Testes de bundle, ordem, dados, status, refresh, 24 h, geometria e desempenho passam. A prévia `validation/widget-preview-0.2.27.png` é fixture-only; a referência visual externa não foi materializada neste executor. iPhone nativo não testado.

## 0.2.25 - janela real de 24h e layout redistribuído

- Renderiza somente observações com timestamp real dentro das últimas 24 horas. USD/BRL usa a série sequencial de 1 minuto documentada pela AwesomeAPI; o endpoint `/USD-BRL/100` limita a resposta a 100 amostras, no máximo 100 minutos, e não garante cobertura completa de 24 horas. CUB/IPCA, Diesel, Brent, Selic e soja sem duas observações intraday exibem `24h indisponível`, preservando valor/data sem interpolação ou zero.
- Reduz os ícones para 20 pt e coloca nome/status acima do ícone; valor fica no topo, gráfico/variação no meio e unidade/data na base. A faixa do gráfico vai a 15 pt, com verde `#00E676`, vermelho `#FF1744` e preenchimento mais intenso.
- Preserva ordem fixa, bandeira circular dos EUA, status de sessão, dados, refresh por toque e tamanhos 2×2/4×2. Prévia raster e testes cobrem a mudança; iPhone nativo não testado.
- A requisição direta ao endpoint de minuto recebeu HTTP 403 da política do executor; não houve contorno nem alegação de cotação ao vivo.
- Corrige a prévia raster: cada bandeira fica no slot Dólar, os ícones usam os PNGs/badges rastreados, e somente o fixture timestampado de USD/BRL recebe curva; os demais exibem `24h indisponível`. Não houve bump de versão porque a falha era exclusiva da evidência.

## 0.2.24 - bandeira dos EUA no Dólar

- Substitui somente o ícone de `USD/BRL` pela bandeira dos Estados Unidos em recorte circular de 26 pt; não há símbolo `$` nem outro emblema sobreposto.
- Preserva diâmetro, posição, espaçamento, nome, cotação, bolinha de estado, curvas, ordem fixa, refresh e os demais ícones nos widgets 2×2 e 4×2.
- Testes de compilação, árvore nativa e operações de desenho cobrem a bandeira, o recorte circular, as 13 faixas/50 estrelas e a caixa de 26 pt; iPhone nativo não testado.

## 0.2.23 - sessao prevista do mercado

- A bolinha passa a representar horario de sessao regular somente para o Ibovespa, usando a grade efetiva da B3, o calendario de feriados de 2026 e a sessao especial da Quarta-feira de Cinzas no fuso `America/Sao_Paulo`.
- A grade de 10:00–18:00 BRT vale no periodo verificado de 02/01 a 08/03; de 09/03 a 31/10, 10:00–17:00 BRT. Apos 31/10, dias de semana ficam neutros ate haver horario oficial confirmado. Fim de semana e feriados oficiais conhecidos ficam fechados.
- Selic, IPCA, CUB-GO, Diesel S10, Soja GO, USD/BRL e Brent ficam neutros: os dados atuais nao estabelecem sessao aplicavel por instrumento. Cache, HTTP, timestamp de coleta e saude da fonte nao controlam o ponto.
- Preserva posicao apos o nome, alinhamento com o grafico, dimensoes, valores, curvas, coleta, cotacao e refresh. Testes de desktop cobrem limites de horario, feriados, fuso, mudanca de horario, series sem pregao e independencia do estado da fonte; iPhone nativo nao testado.

## 0.2.21 — ponto após o nome

- Move a bolinha de saúde da fonte, sem duplicá-la, para o fim do nome na primeira linha. O `HStack` nativo mede o texto intrínseco, mantém espaçamento de 2 pt e comprime/limita nomes longos dentro da coluna de 64 pt antes do valor.
- Preserva diâmetro de 3 pt, cores, semântica de consulta/frescor, acessibilidade, alinhamento do título/valor, linha 3, dados, fontes, curvas, refresh e dimensões. iPhone nativo continua não testado.

## 0.2.20 — saúde recente da consulta por ativo

- A bolinha de 3 pt agora fica verde somente quando a coleta atual registra um payload válido do provedor para aquele ativo, com `fetchedAt` válido e sem cache/fallback histórico (um snapshot Git verificado na consulta é aceito); falha, indisponibilidade, resposta inválida, fallback ou evidência expirada ficam cinza.
- O estado é persistido por linha junto da mesma observação, expira após cinco minutos e um timeout/falha global rebaixa o cache preservado. O resultado preparado de cinco segundos pode reutilizar a mesma evidência recente.
- Acessibilidade explica que o ponto representa evidência da fonte, não bolsa aberta. Refresh por linha, layout, fontes, dados, curvas, ordem e link do Meu Painel permanecem iguais. iPhone nativo continua não testado.

## 0.2.19 — neutralidade do estado do Ibovespa

- Mantém a bolinha de 3 pt na mesma posição, mas deixa todos os indicadores neutros até existir um contrato de sessão/publicação por ativo.
- O Ibovespa não usa mais o horário de ações ou o after-market como proxy: a B3 define o índice a partir dos ativos da carteira, mas as fontes verificadas não informam o estado atual de divulgação do próprio índice.
- Preserva refresh por linha, fontes, dados, curvas, ordem fixa, tamanhos e link do Meu Painel. Testes nativos no iPhone continuam pendentes.

## 0.2.18 — indicador de sessão honesto

- Adiciona uma bolinha de 3 pt imediatamente à esquerda da última data de cada linha, sem alterar a caixa, o ícone, o bloco de três linhas ou as alturas externas.
- Para o Ibovespa, verde/cinza representam somente a sessão prevista da B3 conforme o horário oficial e o calendário de 2026; o rótulo acessível deixa claro que isso não confirma o frescor da cotação nem a conectividade da fonte.
- Para Selic, IPCA, CUB-GO, Diesel S10, Brent, Soja GO e Dólar, o ponto é neutro: as fontes atuais são periódicas ou não publicam uma sessão aplicável ao ativo exibido. Não há verde/cinza inferido de HTTP 200, data de coleta ou preço.
- Preserva refresh por linha, fontes, dados, curvas, ordem fixa, tamanhos e link do Meu Painel. Testes nativos no iPhone continuam pendentes.

## 0.2.17 — feedback nativo por linha

- O widget pequeno expõe quatro botões independentes e os widgets médio/grande expõem oito, cada um cobrindo sua coluna/linha inteira de conteúdo sem sobreposição.
- Cada linha usa `Button` plain com `RefreshAssetsOnTap`: o Scripting/iOS fornece o estado nativo de pressionamento e o mesmo refresh limitado/deduplicado de 0.2.16, sem abrir outro app. A URL do widget e `RefreshAndOpenMarket` permanecem fora dessas áreas.
- Ícones, bloco de três linhas, gráficos, dados, ordem fixa, fontes, dimensões e indicador de mercado não foram alterados. O feedback de pressionamento nativo não foi testado fisicamente no iPhone.

## 0.2.16 — refresh limitado e deduplicado no toque

- O toque do widget mantém o destino existente `Meu Painel`/`Mercado`, mas agora compartilha consultas concorrentes, aguarda até 1.500 ms antes de navegar e solicita uma única recarga depois do resultado ou do cache preservado.
- Um resultado preparado é reutilizado por 5 segundos; falha/offline preserva o cache. Respostas que chegam depois do timeout não podem substituir o modelo persistido nem iniciar uma segunda recarga.
- Não foi adicionada bolinha de estado: as fontes atuais expõem observações periódicas/diárias, não um contrato confiável de sessão aberta por ativo. O estado permanece desconhecido, sem fabricar verde/cinza. Layout, bloco centralizado no ícone, ordem fixa, dados e tamanhos permanecem inalterados; iPhone nativo ainda não testado.

## 0.2.15 — bloco interno centralizado

- Recupera a disposição interna da 0.2.13 e agrupa nome/valor, gráfico/variação e código/data em um único bloco de 36 pontos.
- Centraliza somente a caixa total do bloco no centro do ícone; a linha 2 não é recentralizada e os dados, fontes, ordem, ícones, cores, divisórias e alturas externas permanecem iguais.
- Mantém a 0.2.14 no histórico como referência recuperável; iPhone nativo ainda não testado.

## 0.2.14 — 2026-10-27

- Alinha internamente cada ativo pela caixa da linha 2: gráfico e variação compartilham o centro do ícone; nome/valor usam o topo e código/data usam a base.
- Preserva ícones, alturas externas, fontes, cores, divisórias, dados, fontes API e ordem dos quatro/oito indicadores.
- Adiciona teste medido para small/medium/large, nomes longos, valores negativos e data ausente; iPhone nativo ainda não testado.

## 0.2.13 — 2026-10-27

- Corrige a entrega do widget pequeno: estado legado de `popular-small-codes` não pode substituir `Selic, IPCA, Ibovespa, Dólar`.
- Médio e grande preservam os oito indicadores em ordem fixa, com reservas para fontes ausentes; a tela de detalhes deixa de oferecer uma seleção conflitante.
- Atualização incremental pelo mesmo caminho `main/scripts/Popular Scripting`; iPhone nativo ainda não testado.

## 0.2.12 — 2026-10-27

- O toque no widget aguarda o refresh por até 1,8 s antes de abrir o Mercado no Meu Painel.
- Em sucesso, persiste o resultado e solicita a recarga antes da navegação; em rejeição/offline, preserva e recarrega o cache; em timeout, recarrega o cache sem prometer conclusão da rede após a troca de app.
- Garante uma navegação, limpa o timer e preserva a ordem fixa, dados, layout, fontes e correção CUB; iPhone nativo ainda não testado.

## 0.2.11 — 2026-10-27

- Fixa os oito indicadores em `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`; fontes ausentes mantêm seus slots sem valor inventado e os modos de ordenação por variação deixam de ser oferecidos.
- Todo toque no widget inicia a coleta via AppIntent, solicita `Widget.reloadAll()` ao terminar e abre `Meu Painel`/`Mercado` sem aguardar a rede; falhas offline preservam o cache e não criam loop.
- Preserva coletor, dados reais, seleção, layout, curvas, link de Mercado e correção CUB; iPhone nativo ainda não testado.

## 0.2.10 — 2026-10-26

- O toque na área de ativos abre `Meu Painel` na seção `Mercado` pelo helper oficial `Script.createRunURLScheme`.
- Remove a coleta/avanço implícitos desse toque; o `RefreshPopular` explícito, seleção, dados compartilhados e correção CUB permanecem.
- Sem instalação automática, detecção fictícia ou loop quando Meu Painel não está instalado; iPhone nativo ainda não testado.

## 0.2.9 — 2026-10-25

- Corrige a truncagem nativa da variação M/M do CUB-GO (`+0,025%`) ajustando apenas o piso de redução da fonte dentro da mesma reserva de 34 pt.
- Preserva IPCA (`+1,14 pp`), Diesel (`-0,14%`), Brent (`-3,03%`), sinais, unidades, preços, curvas, margens, fontes, paginação, toque e dados.
- Testes de sintaxe/contratos e prévias continuam simulações; iPhone nativo ainda não foi testado.

## 0.2.6 — 2026-10-24

- Toque no conteúdo avança páginas; rodapé continua atualizando.
- Até oito ativos adicionais do catálogo, com preço e data, além dos oito indicadores.
- Paginação usa cache e não altera datas de observação.
- Consulta desktop real e testes locais aprovados; toque nativo pendente.

## 0.2.5 — 2026-10-24

- Centraliza texto no rodapé estendido; fonte 9,5 sem mudar o trapézio.
- Equilibra margens superior/inferior do conteúdo.
- No tamanho grande, o título e a nota de rodapé participam dos limites usados na centralização.
- Recarga global preservada; testes locais aprovados, visual/toque nativos pendentes.

## 0.2.4 — 2026-10-24

- Pinta a base abaixo do trapézio com o gradiente contínuo até a borda.
- Devolve 13 pontos ao conteúdo (reserva de 23 pontos).
- Botão solicita recarga de todos os widgets Scripting via Widget.reloadAll().
- Testes locais aprovados; execução/visual globais no aparelho pendentes.

## 0.2.3 — 2026-10-24

- Rodapé com metade da altura, gradiente vermelho discreto e quatro cantos curvos.
- Validação de data/hora local e atualização com preservação do cache em falhas.
- Testes locais aprovados; renderização e toque no dispositivo pendentes.

## 0.2.2 — 2026-10-24

- Substitui botão circular por trapézio vermelho centralizado com data/hora e texto cinza-claro.
- Reserva inferior ampliada; mantém atualização por AppIntent e cache.
- Testes locais aprovados; visual nativo pendente.

## Popular Scripting 0.2.1 — 2026-10-24

- Botão de atualização por AppIntent no canto inferior direito, com cache preservado.
- O botão força nova consulta às fontes disponíveis, mantendo a periodicidade real dos indicadores. Os dados mantêm suas datas de observação; consultar não cria uma nova cotação.
- Testes locais aprovados; validação do toque nativo pendente.

# Histórico

## 0.2.0 — 23/10/2026

- Detalhes, curva maior, fontes, seleção de quatro indicadores e CSV.
- Alertas por cruzamento, assistente, controles, painel Início e preferências.
- Solicitação ao iOS em 1 minuto, opções 1/5/15, links diretos para fontes.
- Referências consultadas a cada hora útil; periodicidade das observações preservada.
- Fixture EIA isolada do snapshot vivo para testes reproduzíveis.
- Testes locais aprovados; rede, UI e notificações no iPhone não confirmadas.

Versões anteriores: README e tags `v0.1.1` a `v0.1.3`.
## 0.2.22 - alinhamento do nome com o gráfico

- Alinha pela esquerda o nome do ativo e seu indicador de consulta com a borda esquerda do gráfico em todos os tamanhos.
- Preserva largura da coluna, reserva de preço, fontes, dados, curvas e posições verticais.
- Teste estrutural mede a mesma borda esquerda em pequeno, médio e grande; renderização nativa no iPhone não foi testada.
## 0.2.26 - código sob o ícone e geometria intraday do Ibovespa

- Move o código curto de cada ativo para abaixo do respectivo ícone, mantendo o nome/status acima e centralizando esse conjunto na faixa esquerda. `IBOV`, `USD/BRL`, `SOJAGO`, `CUB-GO`, `DIESEL` e `BRENT` permanecem códigos curtos; unidade, origem e data continuam no bloco de cotação.
- Usa a altura liberada no lado do gráfico: a faixa do Canvas passa a 20 pt, com gráfico e variação ainda centrados verticalmente no ícone, enquanto valor fica no topo e unidade/data na base. A largura útil do gráfico e o tamanho externo das linhas permanecem iguais em 2×2 e 4×2.
- Mantém ordem, dados, fontes, cores intensas, bandeira circular, status, refresh e acessibilidade; nomes longos continuam limitados antes da coluna de preço. A prévia raster é fixture-only e não simula render nativo do iPhone.
- A investigação do `^BVSP` não publicou uma nova fonte: a página pública do Investidor10 só documenta intervalos históricos, e o [portal oficial de APIs do Yahoo](https://developer.yahoo.com/api/) exige acesso OAuth; o acesso direto à página Yahoo retornou 429 no executor. Não foram fixados os valores da captura, usado ETF/proxy, nem contornado 403/429.
