## Atualização 0.2.31 - ícones de fallback e nomes completos no perfil de teste

Os quatro ativos do perfil publicado agora usam badges circulares neutros com
iniciais legíveis (`BB`, `BD`, `IB` e `BTC`) quando não há imagem de marca
aprovada. Isso remove o fallback genérico de documento sem inventar logos.
Banco do Brasil e Bradesco PN passam a usar a métrica compacta conservadora,
com piso de fonte reduzido e escala nativa limitada dentro da coluna de
identidade; o ponto de estado mantém sua reserva e não cobre o nome.

Dados, ordem, fontes, lista recuperável, janela de 7 dias, fallback
`7d indisponível`, refresh e layout 2×2/4×2 permanecem. A prévia
[widget-preview-0.2.31-local.svg](validation/widget-preview-0.2.31-local.svg) e
o PNG adjacente são fixture-only, sem preços, curvas ou dados pessoais.
O iPhone nativo não foi testado.

## Atualização 0.2.30 - perfil publicado de quatro ativos e janela de 7 dias

O entry publicado agora ativa, de forma reversível, o perfil de teste
`BBAS3`, `BBDC4`, `IBOV` e `BTC/USD`, exatamente nessa ordem, em pequeno e
grande. A lista fixa anterior de oito indicadores continua preservada em
`FIXED_INDICATOR_CODES` para recuperação; não é usada pelo perfil ativo.

BBAS3, BBDC4 e IBOV permanecem explicitamente sem cotação, variação ou curva
até existir uma fonte autorizada e validada. `BTC/USD` consulta o adaptador
público Kraken para `XBT/USD`/`ZUSD` quando disponível; nenhum valor é fixado
ou fabricado, e indisponibilidade conserva a linha sem amostra. Gráficos usam
somente observações reais timestampadas numa janela móvel de 7 dias; a
variação do BTC continua sendo móvel de 24 horas, separada do domínio gráfico.

A prévia [widget-preview-0.2.30-local.svg](validation/widget-preview-0.2.30-local.svg)
e o PNG adjacente são demonstrativos/fixture-only, sem preços, curvas ou
dados pessoais. A consulta ao vivo da Kraken falhou por DNS neste executor
(`EAI_AGAIN`), sem contorno; os testes usam payloads determinísticos. iPhone
nativo não foi testado.

## Atualização 0.2.29 - folga explícita entre nome e status

A identidade de cada linha reserva 27 pt para o nome, 8 pt de espaçamento, 3
pt para a bolinha e 2 pt de folga final dentro da coluna de 40 pt. O texto
nativo é comprimido nessa reserva; a bolinha continua depois do nome, sem
cobrir a última letra nem entrar no gráfico. A prévia usa a mesma geometria e
foi conferida em recortes ampliados para os oito ativos nas duas dimensões.

Valor, variação, unidades, ícones, dados, fontes, ordem, janela de 7 dias, refresh e
demais colunas permanecem iguais. A prévia é fixture-only e o iPhone nativo
não foi testado.

## Atualização 0.2.28 - blocos internos compactos e texto contido

Cada linha preserva quatro colunas: ícone circular de 26 pt, identidade de 40
pt, gráfico de 46 pt e cotação de 26 pt, com 2 pt entre colunas. Nome/status e
`código | data` agora ficam agrupados e centralizados verticalmente com o
ícone. Valor e variação também ficam como um par compacto; a unidade curta
fica entre eles, sem uma linha colada ao divisor.

Nomes longos são medidos e reduzidos dentro da coluna antes da bolinha de
status, que não cobre letras nem entra no gráfico. A ordem, dados, fontes,
janela real de 24 horas, fallback `24h indisponível`, refresh por linha,
hitboxes, cores e tamanhos 2×2/4×2 permanecem. A prévia 0.2.28 é fixture-only;
o iPhone nativo não foi testado.

## Atualização 0.2.27 - quatro colunas por linha

Cada linha do widget agora tem quatro colunas medidas: ícone circular de 26 pt;
nome/status com `código | data` do último fechamento ou observação; sparkline;
e valor acima da variação alinhados à direita. As duas primeiras colunas têm a
mesma largura, os textos são reduzidos dentro da própria reserva e não entram
no gráfico ou na cotação. A linha externa continua com 36 pt nos widgets 2×2 e
4×2.

A janela visual continua limitada às últimas 24 horas reais. Séries sem duas
observações intraday timestampadas exibem `24h indisponível`, sem interpolação
ou valores fictícios. Ordem, fontes, unidades, bandeira dos EUA, bolinha de
status, refresh/feedback por linha e cores permanecem. A prévia versionada é
fixture-only e não substitui o render nativo; o iPhone nativo não foi testado.

## Atualização 0.2.25 - janela real de 24h e layout redistribuído

- Gráficos usam somente observações timestampadas nas últimas 24 horas. USD/BRL consulta a série sequencial de 1 minuto existente no provedor; o endpoint `/USD-BRL/100` limita a resposta a 100 amostras, ou no máximo 100 minutos, portanto a janela de 24 horas pode ter cobertura parcial. Fontes mensais, semanais e diárias sem duas amostras intraday exibem `24h indisponível`, preservando valor/data sem fabricar pontos.
- Ícones passam a 20 pt, com nome/status acima do ícone; valor fica no topo, gráfico/variação no centro e unidade/data na base. Curvas/valores têm vermelho e verde mais fortes e preenchimento mais visível em small e medium/large.
- Ordem fixa, bandeira circular, status da sessão, atualização ao toque e dados publicados permanecem.

O ativo `USD/BRL` usa somente a bandeira dos Estados Unidos em recorte
circular, sem símbolo monetário ou emblema sobreposto. A caixa de 20 pt, a
posição, o espaçamento, os dados, a bolinha de estado, as curvas e os demais
ícones permanecem iguais em pequeno, médio e grande. O iPhone nativo não foi
testado.

## Atualização 0.2.23 - ponto de sessão previsto

A bolinha representa a sessão regular de ações da B3 somente para o
Ibovespa. Horários efetivos em 2026, calendário oficial, feriados e Quarta-
feira de Cinzas são tratados no fuso `America/Sao_Paulo`; fora das grades
verificadas, o ponto fica neutro. Selic, IPCA, CUB-GO, Diesel S10, Soja GO,
USD/BRL e Brent permanecem neutros porque o contrato atual da fonte não
confirma uma sessão aplicável ao dado exibido. A cor não confirma atualização
de preço, conectividade ou sucesso de consulta. Widgets podem receber novas
linhas depois do horário solicitado pelo iOS. A posição do ponto, nomes
alinhados ao gráfico, valores, curvas, fontes e toque de refresh permanecem
preservados; iPhone nativo não testado.

## Atualização 0.2.22 - nome alinhado ao gráfico

O nome do ativo e o indicador da consulta ficam ancorados à esquerda na
mesma origem horizontal do gráfico, em pequeno, médio e grande. A coluna de
preço e as demais medidas permanecem preservadas. Testes estruturais passam;
renderização nativa no iPhone não foi testada.

## Atualização 0.2.21 - ponto após o nome

A bolinha de saúde da fonte permanece com 3 pt, mesmas cores e significado,
mas agora aparece imediatamente após o nome na primeira linha. O `HStack`
nativo usa a largura intrínseca do texto e mantém 2 pt de separação, limitado à
coluna de 64 pt para que nomes longos não invadam o valor. A linha 3, dados,
fontes, curvas, refresh e dimensões permanecem iguais. O iPhone nativo ainda
não foi testado.

## Atualização 0.2.20 — saúde recente da fonte

A bolinha de 3 pt continua na mesma posição, mas agora é verde apenas quando a
consulta que produziu aquela linha registrou um payload válido do provedor para
o ativo. Cache, arquivo histórico, falha, indisponibilidade, payload inválido,
timeout e evidência com mais de cinco minutos ficam cinza; um snapshot Git
verificado na consulta é tratado como resposta atual do provedor de dados. O
estado é por ativo e acompanha a mesma observação; o resultado preparado de
cinco segundos pode reutilizar a evidência da mesma consulta. O rótulo de
acessibilidade diz que o ponto representa saúde da fonte, não bolsa aberta.
Layout, dados, fontes, curvas, ordem e refresh permanecem inalterados.

## Atualização 0.2.19 — estado neutro até haver contrato do índice

A bolinha de 3 pt continua à esquerda da última data, mas agora permanece
neutra em todas as linhas. O horário de negociação de ações da B3 não é usado
como proxy para o Ibovespa: o índice é calculado a partir dos ativos da
carteira, e as fontes verificadas não fornecem um estado atual de publicação do
próprio índice. Assim, não há verde/cinza falso para sessão, conectividade ou
frescor. O rótulo de acessibilidade explica essa incerteza. Layout, dados,
fontes, curvas, ordem e refresh permanecem inalterados.

## Atualização 0.2.18 — estado de sessão explícito

Cada linha agora tem uma bolinha de 3 pt à esquerda da última data. Ela é
verde/cinza apenas para o Ibovespa quando a sessão prevista da B3 está aberta
ou fechada segundo o horário oficial e o calendário de 2026. Essa bolinha não
afirma que a cotação da fonte está fresca ou que a rede está conectada. Selic,
IPCA, CUB-GO, Diesel S10, Brent, Soja GO e Dólar permanecem com ponto neutro,
pois os contratos usados pelo widget são periódicos, diários ou não informam
uma sessão de negociação aplicável. O significado completo também aparece no
rótulo de acessibilidade. Não há inferência baseada em HTTP 200.

## Atualização 0.2.17 — feedback de toque por linha

O pequeno tem quatro áreas de toque independentes e o médio/grande oito. Cada área acompanha uma linha inteira de conteúdo — ícone, nome, valor, gráfico, variação e data — sem sobreposição. O `Button` plain do Scripting fornece o feedback nativo de pressionamento e chama `RefreshAssetsOnTap`, que mantém o refresh limitado/deduplicado sem abrir outro app. A URL geral do widget permanece para áreas fora das linhas. Ícones, alinhamentos, curvas, dados, ordem fixa e status de mercado permanecem inalterados. O efeito nativo não foi testado fisicamente no iPhone.

## Atualização 0.2.16 — refresh limitado no toque

O toque do widget pequeno 2×2 e dos demais tamanhos compartilha consultas concorrentes, aguarda até 1,5 s antes de abrir o Mercado no Meu Painel e solicita uma recarga após sucesso, falha ou timeout. Um resultado preparado é reutilizado por 5 s; uma resposta tardia não substitui o modelo persistido nem dispara outra recarga. O destino de navegação, o bloco interno centralizado no ícone, a ordem fixa, os dados, as fontes e as dimensões permanecem inalterados.

A bolinha verde/cinza não foi adicionada: os contratos atuais não informam estado confiável de sessão para todos os indicadores. O produto mantém esse estado desconhecido, sem inferir mercado aberto por HTTP 200, relógio ou calendário incompleto. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.15 — bloco interno agrupado

O conteúdo interno de cada ativo volta à disposição da 0.2.13 e passa a ser um único bloco: nome/valor, gráfico/variação e código/data. A caixa total de 36 pontos é centralizada no ícone; as linhas internas não são redistribuídas. A 0.2.14 permanece no histórico Git como referência recuperável. Ícones, fontes, cores, divisórias, alturas externas, ordem fixa, dados e fontes permanecem inalterados. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.14 — alinhamento interno medido

Dentro de cada ativo, a caixa reservada da linha 2 é a referência: gráfico e variação têm o mesmo centro vertical do ícone; nome e valor compartilham o topo acima dela; código e última apuração compartilham a base abaixo dela. Ícones, alturas de linha, fontes, cores, divisórias, ordem fixa, dados e fontes permanecem inalterados. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.13 — ordem fixa também no widget pequeno

O widget pequeno agora ignora seleções e páginas persistidas de versões anteriores e mostra sempre `Selic, IPCA, Ibovespa, Dólar`. Médio e grande mantêm os oito na sequência `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`. Preferências antigas continuam importáveis sem alterar essa ordem; fontes ausentes conservam seu slot. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.12 — refresh limitado antes da navegação

O toque dá ao refresh uma oportunidade limitada de até 1,8 s antes de abrir o Mercado no Meu Painel. Em sucesso, o resultado é persistido, a recarga é solicitada e só então ocorre a navegação; em rejeição/offline, o cache é preservado, recarregado e a navegação ocorre uma vez. Se a rede exceder o limite, o widget recarrega o cache disponível e navega sem prometer que a coleta terminará depois da troca de app. O timer é limpo e não há loop. O iOS continua decidindo quando o widget renderiza a solicitação; isso não é uma promessa de atualização instantânea. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.11 — ordem fixa e toque com refresh

Os oito indicadores aparecem em ordem fixa: Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10 e Brent. Uma fonte ausente conserva sua posição com a reserva sem cotação; não há ordenação por variação. Tocar qualquer área do widget solicita uma nova coleta e uma recarga pelo AppIntent e, sem esperar a rede, abre `Meu Painel` na seção `Mercado`. A coleta concluída persiste os dados antes de pedir a recarga; como a abertura é imediata, o iOS pode suspender o AppIntent depois da troca de app, portanto a conclusão antes da navegação não é garantida. Cache e navegação permanecem disponíveis offline. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.10 — toque para Meu Painel

Tocar na área de ativos abre `Meu Painel` diretamente na seção `Mercado`, usando o esquema oficial do Scripting (`scripting://run/Meu%20Painel?section=market`). O painel precisa estar instalado; o widget não tenta instalar, detectar ou reabrir em loop. O botão explícito **Consultar indicadores** continua sendo o caminho para coleta/refresh, e a seleção de ativos e os dados compartilhados permanecem intactos. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.9 — variação CUB completa

A variação M/M do CUB-GO (`+0,025%`) continua sendo o valor publicado, mas sua reserva nativa de 34 pt pode exceder a métrica de algumas UIFonts. O rótulo mantém a mesma caixa, posição, alinhamento e formatação; somente o piso de redução desse texto longo passa de 7,5 para 6,5 pt. IPCA (`+1,14 pp`), Diesel (`-0,14%`) e Brent (`-3,03%`) permanecem inalterados. Dados, curvas, fontes, paginação, toque, atualização, Pro e demais ajustes da 0.2.8 foram preservados. Teste físico no iPhone continua pendente.

## Atualização 0.2.8

Remove o trapézio e horário da área visível. O conteúdo usa a altura completa com margem vertical externa de 8pt, preserva o ajuste horizontal original e redistribui verticalmente as linhas. Tocar qualquer parte do widget força uma coleta atual, avalia alertas e avança para a próxima página; falha na fonte conserva os dados anteriores e permite avançar. A execução de apresentação seguinte usa o cache recém-coletado para não duplicar a consulta. Widget.reloadAll solicita também as outras timelines do Scripting.

Testes locais: fontes, páginas distintas/retorno, coleta forçada no intent, falha/cache, alvo único de toque, margens e novas posições. O módulo antigo de footer fica sem importação na view, apenas como histórico e regressão isolada. Aparência, toques e agenda de execução no aparelho ainda não confirmados. Reversão: scripting-v0.2.7.

## Atualização 0.2.7 — revisão de desempenho e homepage separada

O transporte une requisições simultâneas iguais dentro da mesma execução, preservando status, allowlist e orçamentos. Depois de concluídas, as requisições saem da memória de deduplicação: não criamos outro cache nem renovamos a data das cotações. Teste: duas chamadas sobrepostas viram uma requisição; consulta posterior continua indo à fonte. Cache com horário futuro deixa de ser válido.

A avaliação dos alertas habilitados agora termina antes de Widget.present, pois a apresentação pode encerrar o contexto. Mantidos pipeline de validação, dados numéricos brutos, paginação sem rede e PNG/OCR com fallback nativo. Não houve troca de linguagem, dependência de produção ou alteração visual.

A homepage embutida foi removida. Meu Painel é distribuído separadamente pelo repositório privado Sagittaryuz/scripting-home. O Popular só escreve um resumo local em Storage shared: até 16 ativos e até 24 pontos por série; não importa outra UI/motor. Outros scripts instalados no Scripting podem ler esse domínio compartilhado. Não contém credenciais. A homepage não executa consultas financeiras, OCR ou gráficos completos do motor.

Testes locais de fontes, observações antigas/futuras, alertas, cache, transporte, allowlist, paginação, footer e refresh aprovados. Compilação/visual/toques e entrega de notificações nesta versão no iPhone ainda pendentes. Atualize o projeto existente pelo mesmo Git; instale o painel separadamente.

# Popular Scripting

**Atual: 0.2.31 - Scripting Pro.** Perfil publicado de quatro ativos
(`BBAS3`, `BBDC4`, `IBOV`, `BTC/USD`) em janela móvel de 7 dias, com detalhes,
CSV, alertas, assistente, Central de Controle e painel Início. [Ativação,
testes e limites](PRO.md).

Widget econômico para o aplicativo Scripting, com acesso público e sem token de GitHub no aplicativo.

## Importação remota

Na tela **Importar Scripts Remotos** do Scripting, cole:

```text
https://github.com/Sagittaryuz/popular-scripting/tree/main/scripts/Popular%20Scripting
```

Importe **Popular Scripting**, confirme a versão **0.2.31**, abra o projeto e toque em **Atualizar**. Adicione o widget do Scripting à Tela de Início e selecione esse projeto.

Para receber melhorias de código, use a atualização do script remoto no Scripting. Essa importação vincula o projeto à pasta `main/scripts/Popular Scripting`; não use um endereço de commit ou tag para acompanhar as próximas versões. O botão **Atualizar** dentro da tela do Popular consulta somente os indicadores e solicita recarregar o widget.

## Tamanhos e dados

- Pequeno, médio e grande: o perfil publicado mostra os quatro ativos de teste na mesma ordem; o médio/grande não repete linhas na segunda coluna.
- Os três slots B3 permanecem reservados sem cotação até fonte validada; o BTC/USD usa somente o adaptador público Kraken quando a resposta for válida.
- O domínio de gráfico ativo é 7D por timestamp real; sem amostras válidas aparece `7d indisponível`, sem interpolação, weekend fill ou valor fictício.
- A lista anterior de oito, fontes e ícones continua preservada no histórico/código para recuperação; não é a configuração ativa desta versão.
- Fontes anteriores incluem BCB, AgroLink, Investidor10, AwesomeAPI e FRED; a documentação da Kraken para o perfil ativo está registrada no changelog.
- Dados econômicos de referência são consultados diretamente deste Git, sem autenticação. Rede indisponível ou resposta inválida preserva o cache validado ou a reserva versionada, com suas datas originais.
- O workflow `economic-data.yml` é programado a cada hora útil, 11h17–23h17 UTC, sujeito a atrasos do GitHub. Falha de uma fonte mantém a série anterior e é registrada no workflow; dados antigos não recebem data de observação nova.
- Política de atualização do widget: a partir de um minuto, configurável em 1/5/15, sujeita ao iOS.

Não são solicitadas permissões de Calendário, Lembretes ou Localização. O projeto não lê credenciais; ao executar a tela principal, tenta remover somente a credencial legada que uma edição anterior do próprio projeto tenha salvo. Não altera o GitHub configurado nas preferências gerais do Scripting nem revoga credenciais da conta GitHub.

## Validação e recuperação

A versão 0.2.21 mantém os meses nos extremos da curva, a composição nativa Text, Canvas transparente para ícones/curvas, as dimensões originais e a disposição interna recuperada da 0.2.13. O refresh por toque usa uma janela de 1.500 ms, deduplicação concorrente e um resultado preparado por 5 segundos; cada linha tem seu próprio feedback nativo sem navegação; a bolinha registra apenas a evidência recente da consulta daquele ativo, agora após o nome, nunca bolsa aberta.

A leitura dos preços AgroLink tem alternativa zlib em JavaScript, independente da descompressão nativa. A atualização manual permite até 20 segundos totais e 6 segundos por consulta AgroLink; o widget mantém 8 e 3 segundos. Falhas das fontes aparecem na tela após Atualizar, e o cache anterior é preservado com suas datas. O IPCA trata o cabeçalho da resposta SIDRA; o CUB trata letras separadas na extração de PDFs, mantendo a conferência de mês/padrão.

Testes locais cobrem os oito indicadores por HTTP, coletores de referência, descompressão com a ponte nativa desativada, entradas inválidas, cache, ordem fixa com fonte ausente, seleção persistida legada ignorada, bloco interno agrupado com nomes longos/valores negativos/datas ausentes, toque com refresh em sucesso/timeout/rejeição, deduplicação, cache preparado/expirado, marcadores inválidos, resposta tardia, quatro/oito hitboxes independentes, payload válido/HTTP-200 inválido, falha parcial, cache/arquivo, timeout e expiração da bolinha por ativo, colocação após o nome por HStack intrínseco, separação do valor e ausência de sobreposição, contrato de navegação e prévias simuladas. Esses testes não confirmam o comportamento da rede, do pressionamento nativo, dos intents e das fontes no iPhone; a versão 0.2.21 ainda exige essa conferência na Tela de Início.

O histórico Git e as releases preservam versões anteriores para recuperação. Antes de atualizar uma edição personalizada, preserve suas alterações locais. Os dados e preferências do projeto ficam no aparelho; não apague o projeto para atualizar.

## Manutenção

O código do widget fica em `scripts/Popular Scripting`. Cada melhoria deve atualizar `script.json` e `model.ts`, passar pelas verificações e ser publicada em `main`. Alterar apenas `data/economic-series.json` atualiza dados, sem mudar código ou versão do widget.

O script de coleta usa somente fontes públicas. Para verificar dados em Node 22: `node scripts/validate-data.cjs`. As dependências Python da coleta estão em `scripts/economic-requirements.txt`. Nenhuma dependência de teste é necessária no iPhone.

Canvas, Scripting e as fontes do sistema podem apresentar diferenças de métricas em relação ao Scriptable; não há alegação de fidelidade pixel a pixel. [Documentação do Scripting](https://scriptingapp.github.io/guide/Script/Script).
## Atualização 0.2.26 - código abaixo do ícone e gráfico mais alto

Cada ativo agora mostra o nome/status acima do ícone e o código curto abaixo dele, com o conjunto centrado na faixa esquerda. A cotação continua no topo do lado direito; gráfico e variação ocupam a altura útil ampliada; unidade e data permanecem alinhadas à base. A largura do gráfico, a ordem fixa, dados, fontes, cores, status e refresh não mudam em small, medium e large.

A fonte intraday do Ibovespa não foi substituída por valores da captura. A página pública usada antes não documenta intraday, o [portal oficial de APIs do Yahoo](https://developer.yahoo.com/api/) requer OAuth e o executor recebeu 429 ao abrir a página Yahoo; portanto a versão mantém o contrato Investidor10/cache até haver uma fonte pública autorizada e testável. O iPhone nativo não foi testado.
## Perfil publicado 0.2.30 - quatro ativos e janela de 7 dias

O entry publicado usa BBAS3 (Banco do Brasil), BBDC4 (Bradesco PN), IBOV
(Ibovespa) e BTC/USD (Bitcoin), nessa ordem, sem repetir ativos no formato
4x2. A lista fixa de produção anterior permanece recuperável e inalterada.

O perfil `PUBLISHED_TEST_ASSETS` passa essa seleção pelo caminho real de
`loadModel`/`collectRows`: reserva explicitamente os três slots B3 como
indisponíveis e chama `loadBTCUSD` para o quarto. Cache antigo e
`collectAdditionalRows` não substituem o perfil ativo; alterar essa constante
restitui a lista anterior sem apagar sua definição.

O domínio visual agora é uma janela móvel de 7 dias corridos (168 horas) por
timestamp. Só observações reais timestampadas entram na curva; fins de
semana, lacunas e fontes mensais/semanais não são preenchidos. A fixture local
não exibe preços, variações ou curvas para BBAS3/BBDC4/IBOV. O adaptador local
de BTC/USD agora usa somente a API pública da Kraken, com o par confirmado
`XBT/USD`/`ZUSD`, sem chave e sem USDT: o ticker fornece o último negócio no
horário da consulta, enquanto a curva usa candles horários fechados em 7 dias
e exclui o candle atual. A variação é uma referência móvel de 24 horas contra
a última observação fechada disponível, separada do domínio gráfico de 7 dias;
não há valor hardcoded. O adaptador existente do Ibovespa/Investidor10 e o
Yahoo Finance não foram substituídos nem contornados; BBAS3/BBDC4 continuam
sem fonte autorizada neste checkout. A resolução DNS deste executor falhou com
`EAI_AGAIN api.kraken.com` durante a tentativa ao vivo; os testes usam payloads
determinísticos e não afirmam cotação atual. B3 e Bitcoin não têm estado de
sessão inferido da captura. O contrato foi conferido na documentação oficial
de [OHLC](https://docs.kraken.com/api-reference/market-data/get-ohlc-data),
[Ticker](https://docs.kraken.com/api-reference/market-data/get-ticker-information)
e [AssetPairs](https://docs.kraken.com/api-reference/market-data/get-tradable-asset-pairs).

Os arquivos `validation/widget-preview-0.2.30-local.svg`,
`validation/widget-preview-0.2.30-local.png` e o JSON adjacente são evidência
fixture-only e demonstrativa, não uma cotação ao vivo. O iPhone nativo não
foi testado.
