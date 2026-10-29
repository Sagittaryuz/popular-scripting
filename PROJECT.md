# Popular Scripting - Pro 0.2.27

## 0.2.27 - distribuição em quatro colunas

- Cada linha usa quatro colunas medidas: ícone circular de 26 pt; nome/status e `código | data` em uma coluna de 32 pt; sparkline de 50 pt; cotação acima da variação em uma coluna de 26 pt. Há 2 pt entre colunas e o conteúdo útil continua com 146 pt.
- A linha externa continua com 36 pt; ícone e centro do gráfico ficam no centro vertical, a cotação fica no topo e a unidade compacta na base. Observações sem duas amostras intraday reais continuam como `24h indisponível`.
- Preserva dados, fontes, ordem fixa, bandeira, status de sessão, cores, refresh por linha, acessibilidade, 2×2/4×2 e semântica de unidade. A prévia é fixture-only; iPhone nativo permanece não testado.

## 0.2.26 - código sob o ícone e altura útil do gráfico
## 0.2.26 - código sob o ícone e altura útil do gráfico

- O bloco esquerdo agora é nome/status acima, ícone menor de 20 pt no centro da faixa e código curto abaixo. Os códigos não substituem unidade, origem ou data: esses campos permanecem no bloco de cotação e não colidem com o preço.
- A faixa do gráfico aumentou para 20 pt, mantendo o seu centro e a variação alinhados ao centro do ícone, o valor no topo e unidade/data no fundo da linha. A largura útil de 82 pt e a linha externa de 36 pt permanecem iguais em small/medium/large.
- A fonte do Ibovespa não foi trocada sem contrato verificável. O Investidor10 público expõe seletores históricos sem intraday documentado; a [API oficial do Yahoo](https://developer.yahoo.com/api/) requer OAuth e a página Yahoo foi limitada a 429 no executor. O widget não usa `171.006`, `-2,68%`, ETF, proxy ou curva inventada.
- Validação: bundle, testes de geometria/ordem/refresh/janela de 24h, prévia raster com pixels inspecionados e arquivos de validação. Não houve teste em iPhone nativo.

## 0.2.25 - janela real de 24h e redistribuição visual

- O desenho agora usa uma janela móvel de exatamente 24 horas e aceita somente observações com timestamp real. O USD/BRL usa a série sequencial de 1 minuto já permitida pela AwesomeAPI; o endpoint `/USD-BRL/100` retorna no máximo 100 amostras, ou até 100 minutos, não uma cobertura intraday completa de 24 horas. Os demais indicadores mensais, semanais ou diários exibem `24h indisponível` sem interpolação, zero ou reaproveitamento visual de 90 dias.
- Ícones foram reduzidos para 20 pt, o nome/status fica acima do ícone, e o grupo de cotação mantém valor no topo, gráfico/variação no centro e unidade/data na base. A altura do gráfico subiu para 15 pt nos dois tamanhos.
- Curvas e valores usam vermelho/verde mais intensos e o preenchimento recebeu maior opacidade. Ordem fixa, bandeira circular dos EUA, indicadores de sessão, refresh por toque e fontes/dados permanecem.
- Fontes consultadas: [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) documenta tanto a série diária quanto cotações sequenciais de 1 minuto com timestamp; [BCB/SGS](https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic) e [B3](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/b3-for-developers/) não autorizam inventar uma série intraday para os indicadores sem essa granularidade.
- Limite: validação foi por bundle, testes e prévias raster; não houve teste em iPhone nativo.

A prévia raster desta entrega é gerada por `scripts/render-widget-preview.cjs`, usando
os PNGs rastreados e a geometria real dos badges Canvas. Ela mostra uma curva
somente para o fixture timestampado de USD/BRL; os demais slots mostram
`24h indisponível`, sem curva contraditória ou ícone placeholder. A prévia é
evidência de geometria e não simula um render nativo do iPhone.

## 0.2.24 - bandeira dos EUA no Dólar

O ícone de `USD/BRL` passa a ser somente a bandeira dos Estados Unidos em
recorte circular, desenhada no mesmo Canvas de 26 pt dos demais badges. O
emblema combinado anterior e qualquer símbolo monetário não participam mais da
renderização. A posição, diâmetro, alinhamento, espaçamento, nome, cotação,
bolinha de estado, curvas, ordem, refresh e os tamanhos pequeno/médio/grande
permanecem iguais. iPhone nativo não testado.

## 0.2.23 - ponto de sessão de mercado

A bolinha passa a indicar sessão regular prevista somente para o Ibovespa,
com horário e calendário oficial da B3 em 2026 e neutralidade fora da
cobertura. Para Selic, IPCA, CUB-GO, Diesel S10, Soja GO, USD/BRL e Brent, a
fonte atual não confirma uma sessão aplicável ao dado mostrado; seus pontos
permanecem neutros. Frescor, cache e resultado HTTP não alteram a cor. Isso
não afirma que uma cotação esteja atualizada. O horário usa
`America/Sao_Paulo`; grades posteriores a 31/10/2026 ficam desconhecidas até
confirmação oficial. iPhone nativo não testado.

Fontes oficiais consultadas em 28/10/2026: [grade de ações da B3](https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/para-participantes-e-traders/horario-de-negociacao/acoes/), [calendário de negociação 2026](https://www.b3.com.br/pt_br/noticias/calendario-de-negociacao-da-b3-confira-o-funcionamento-da-bolsa-em-2026.htm), [Quarta-feira de Cinzas 2026](https://www.b3.com.br/pt_br/noticias/confira-o-funcionamento-da-b3-no-carnaval.htm) e [grade a partir de 9 de março de 2026](https://borainvestir.b3.com.br/noticias/mercado/b3-a-bolsa-do-brasil-muda-horarios-de-negociacao-a-partir-de-9-de-marco-confira/). A grade de 10:00–18:00 BRT até 08/03/2026 foi anunciada na [mudança da B3 em novembro de 2025](https://www.b3.com.br/pt_br/noticias/comunicado-b3.htm). A fonte atual de USD/BRL é [documentada pela AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas); seu endpoint entrega `bid`/`ask`, horário da cotação e informa cache de um minuto para chamadas sem chave, mas não identifica na resposta um calendário de sessão verificável para o indicador deste widget.

## 0.2.21 — ponto após o nome

A bolinha de 3 pt sai da linha 3 e passa para o fim do nome na linha 1. Um
`HStack` nativo usa a medida intrínseca do `Text`, separa o círculo por 2 pt e
limita o conjunto à coluna de nome de 64 pt, preservando o valor e nomes longos
sem colisão. Cores, estado por consulta, frescor, acessibilidade, dados,
fontes, curvas, refresh, ordem e dimensões permanecem inalterados. iPhone
nativo não testado.

## 0.2.20 — evidência recente da fonte por ativo

A bolinha de 3 pt conserva a posição aprovada à esquerda da data, mas deixa de
representar sessão de mercado. A coleta anexa a cada linha o estado da própria
consulta: verde somente para payload válido com `fetchedAt` atual e sem cache ou
fallback histórico (snapshot Git verificado na consulta é aceito); cinza para
falha, indisponibilidade, payload inválido,
timeout ou evidência com mais de cinco minutos. O cache preparado de cinco
segundos pode reutilizar a mesma evidência sem nova consulta. Acessibilidade
explica esse significado e nega explicitamente que a cor indique bolsa aberta.
Dados, fontes, curvas, ordem fixa, layout, refresh, link e as dimensões externas
permanecem inalterados. iPhone nativo não testado.

## 0.2.19 — ponto neutro sem proxy de sessão

A bolinha de 3 pt permanece na posição aprovada à esquerda da última data,
mas todos os indicadores ficam `unknown`/neutros. A B3 descreve o cálculo do
Ibovespa com os preços dos ativos da carteira e publica dados do índice, porém
os documentos verificados não entregam um estado atual de publicação do índice.
O horário das ações e o after-market, portanto, não são usados como proxy para
IBOV. Também não se usa HTTP 200, data de coleta, preço ou calendário para
fabricar verde/cinza. iPhone nativo não testado.

## 0.2.18 — ponto de sessão com estado neutro

Cada linha acrescenta um ponto de 3 pt à esquerda da última data, dentro do
bloco existente. O ponto verde/cinza do Ibovespa representa exclusivamente a
sessão prevista do mercado de ações da B3: horário oficial atual, calendário de
feriados de 2026 e after-market documentado. O rótulo diz que isso não confirma
frescor da cotação ou conectividade da fonte. Os demais indicadores recebem
`unknown`/cinza neutro: Selic, IPCA, CUB-GO e Diesel S10 são referências
periódicas; Brent, Soja GO e Dólar não têm no contrato atual um estado de sessão
aplicável ao dado exibido. Ano fora do calendário revisado, slot sem cotação e
fases de pré-abertura/call também não viram verde.

Fontes de horário/calendário usadas na decisão: B3
`horario-de-negociacao/acoes/` e `calendario-de-negociacao-da-b3-confira-o-funcionamento-da-bolsa-em-2026.htm`.
Fontes econômicas continuam sem alteração. Nenhum estado é inferido de HTTP
200, timestamp de consulta, preço ou observação periódica. iPhone nativo não
testado.

## 0.2.17 — feedback nativo independente por linha

Cada linha visível agora é um `Button` plain independente: quatro alvos no pequeno e oito no médio/grande. O hitbox acompanha a coluna de conteúdo e a linha, inclui ícone, textos e gráfico, usa o intent `RefreshAssetsOnTap` e não navega para outro app. O estado de pressionamento/animação é o feedback nativo do Scripting/iOS; não foi criada uma transição manual. A URL do widget continua disponível fora das linhas, e a ação `RefreshAndOpenMarket` permanece preservada para seus consumidores.

O refresh por linha reutiliza o limite de 1.500 ms, deduplicação concorrente, preparação de 5 segundos e exclusão de resultado tardio da 0.2.16. Bloco centralizado no ícone, fontes, dados, ordem fixa, dimensões e status de mercado permanecem inalterados. Validação estrutural e sintética concluída; toque/animação nativos no iPhone não testados.

## 0.2.16 — refresh limitado e deduplicado no toque

`RefreshAndOpenMarket` compartilha toques concorrentes, dá até 1.500 ms à consulta e pede uma recarga do widget antes de abrir uma única vez o URI existente de `Meu Painel`/`Mercado`. Um resultado válido do modelo é considerado preparado por 5 segundos; rejeição/offline preserva o cache. Depois do timeout, o resultado tardio não substitui o modelo persistido nem pede outra recarga. O destino, o fallback inexistente e a abertura única permanecem iguais.

Não há indicador verde/cinza nesta versão: Selic/IPCA/CUB/ANP são observações periódicas, enquanto B3, câmbio e Brent exigiriam contratos de sessão diferentes que o coletor atual não fornece. Sem confirmação defensável, o estado fica desconhecido. O bloco de três linhas continua centralizado no ícone; ordem fixa, dados, fontes, tamanhos e alturas externas permanecem inalterados. Testes são desktop/sintéticos; iPhone nativo não testado.

## 0.2.15 — bloco interno agrupado

A disposição interna recupera os offsets da 0.2.13. Nome/valor, gráfico/variação e código/data ficam dentro de um único bloco de 36 pontos, cuja caixa total é centralizada no centro do ícone. A linha 2 não é recentralizada. Ícones, alturas externas, fontes, cores, divisórias, ordem fixa, dados, fontes API e a referência recuperável da 0.2.14 permanecem preservados; iPhone nativo não testado.

## 0.2.14 — alinhamento interno pela linha 2

Cada ativo mantém a caixa externa aprovada e o ícone no mesmo lugar. A
referência recuperável 0.2.13 foi posteriormente agrupada na caixa de 36 pt
da 0.2.15; na geometria atual o nome/status ocupa o topo, o gráfico/variação
fica no centro e código/data ficam na base. Nenhuma fonte, cor, API, dado,
ordem, diâmetro do ícone ou altura externa foi alterada. Testes desktop cobrem
small/medium/large, texto longo, valor negativo e ausência de data; iPhone
nativo não testado.

## 0.2.13 — ordem fixa do widget pequeno

O pequeno usa sempre os quatro primeiros resultados já ordenados pelo motor: `SELIC`, `IPCA`, `IBOV` e `USD/BRL`. `popular-small-codes`, páginas, exportações e preferências antigas não substituem mais essa ordem; os estados antigos são mantidos apenas como compatibilidade de dados, sem efeito visual. Médio e grande exibem os oito códigos fixos na sequência `SELIC`, `IPCA`, `IBOV`, `USD/BRL`, `SOJA_JATAI_GO`, `CUB_GO`, `DIESEL_S10`, `BRENT`. Slots de fonte indisponível permanecem reservados. O caminho remoto continua sendo `main/scripts/Popular Scripting`; atualizar o projeto existente é suficiente, sem criar cópia. iPhone nativo não testado.

## 0.2.12 — refresh limitado antes da navegação

`RefreshAndOpenMarket` aguarda até 1.800 ms pela consulta iniciada no toque. Quando a consulta termina, o modelo já persistido é seguido por `Widget.reloadAll()`/recarga dos controles e depois por uma única abertura de `Meu Painel`/`Mercado`. Rejeição ou offline conserva o cache e segue a mesma ordem. No timeout, o widget solicita a recarga do cache e abre o destino uma vez; a consulta pendente pode ser suspensa pelo iOS, portanto não há garantia de atualização de rede após a troca de app. O timer é limpo, não há retry/loop e o iOS ainda pode adiar o render da timeline. iPhone nativo não testado.

## 0.2.11 — ordem fixa e atualização no toque

Os oito indicadores do widget usam a sequência `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`. O motor produz uma reserva explícita para qualquer fonte ausente, sem criar cotação, e a superfície Scripting não oferece mais ordenação por variação. O toque em qualquer área é um `Button` de tela inteira ligado ao AppIntent `RefreshAndOpenMarket`: a coleta começa, `Safari.openURL` solicita o URI existente do Meu Painel sem esperar a rede, e `Widget.reloadAll()` é pedido ao final. Quando o AppIntent continua vivo, a recarga vem depois da persistência; a conclusão da coleta antes da troca para outro app não é garantida pelo iOS. Não há instalação, fallback ou repetição; offline conserva cache. iPhone nativo não foi testado.

## 0.2.10 — toque Mercado no Meu Painel

O toque na área de ativos agora usa `Script.createRunURLScheme("Meu Painel", { section: "market" })`, equivalente a `scripting://run/Meu%20Painel?section=market`, para abrir a Home independente com Mercado em foco. A ação implícita anterior `NextPopularPage` não é mais chamada pelo widget; o botão explícito `RefreshPopular` continua consultando dados. Não há tentativa de instalar, detectar ou repetir a abertura quando o painel não existe, pois a API não oferece essa detecção. O motor, dados, seleção, paginação compatível, correção CUB 0.2.9 e arquivos de `scripting-home` permanecem fora do escopo.

## 0.2.9 — variação CUB sem reticências

O retorno do usuário isolou truncagem por espaço, não ausência de dado: o CUB-GO conserva três casas na variação publicada (`+0,025%`) e usa uma reserva nativa de 34 pt. A vista reduz somente o piso desse rótulo longo para 6,5 pt, preservando a geometria, alinhamento, curvas, fontes, paginação, atualização, Pro e os demais ajustes posteriores. IPCA, Diesel e Brent mantêm sinais, unidades e textos completos. Nenhum dado econômico ou arquivo da interface Scriptable foi alterado. O iPhone nativo não foi testado.

Fonte: `Sagittaryuz/popular-scripting`, `main`, `scripts/Popular Scripting`.
Preservar motor gerado, fontes, unidades, datas, geometria e versões anteriores.
TSX nativo, cache local, fontes públicas e GitHub Actions para referências.

Camada Pro independente do motor: seleção de quatro entre oito, detalhes,
CSV, alertas por cruzamento, ferramentas do assistente, controles e painel Home.
Pequeno coleta oito para que a escolha de quaisquer quatro tenha dados reais.
APIs e código no iPhone não recebem dependências npm; as novas dependências são
somente para validação no desktop. Não há backend/credencial/serviço pago novo.
Critérios e limites em `PLANS.md` e `PRO.md`.

Padrão: `Sagittaryuz/development-standards`, commit
`722279eb8ec4bac318f8fa2ad50ac34b128e90dc`, GIT-FIRST 1.0.1, WEBAPP-WORKFLOW 1.2.3.
Git é origem; Drive recebe backup privado com histórico recuperável.
