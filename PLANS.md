# Melhorias Scripting Pro — 23/10/2026

## 0.2.45 — contrato EOD do gráfico USD/BRL

- [x] Emitir `eod-civil-day` somente para séries diárias com pontos date-only;
  preservar `trade-timestamp` em séries timestampadas como IBOV.
- [x] Validar a cadeia completa de histórico USD, perfil de 7 dias, filtro do
  renderer e coordenadas da linha sem preencher fins de semana.
- [x] Publicar a correção residual e gerar preview fixture-only; iPhone nativo
  continua não testado.

## 0.2.44 — migração do cache diário USD/BRL

- [x] Impedir que o snapshot v13 da série curta intraday faça bypass da fonte
  diária restaurada.
- [x] Usar chave v14 diária, preservar fallback de preço sem reutilizar curva
  incompatível e cobrir schema real/itens sem `code`/`codein` após o primeiro.
- [x] Validar pregões esparsos, fim de semana sem preenchimento, versão,
  manifest e publicação. iPhone nativo continua não testado.
- [x] Remover a unidade visual sob a cotação, ampliar a fonte com fitting nativo
  e testar `169,2K`, `5,38`, textos longos e `—` em pequeno/médio.

## 0.2.43 — fontes diárias e recorte semanal

- [x] Restaurar a fonte histórica diária de 90 dias do USD/BRL e recortar
  observações reais para 7D.
- [x] Aceitar a série EOD fechada do Worker do IBOV sem impor densidade
  intraday, preservando lacunas e pontos reais.
- [x] Manter Brent Jan-2027 separado do spot EIA/FRED e Dow sem proxy; atualizar
  testes, preview, documentação, versão e publicar no main. iPhone nativo não
  testado.

## 0.2.42 — Brent futuro e cobertura intradiária

- [x] Identificar o contrato de referência como ICE Brent Crude Futures, `BRN`,
  símbolo `B`, Jan-2027; não misturar com EIA/FRED spot.
- [x] Recusar curvas que não provem intraday real em várias sessões da janela
  de sete dias; manter cotação/variação diária separadas e sem preencher
  observações.
- [x] Verificar limites documentados de brapi Free e AwesomeAPI; não criar
  credenciais, plano, proxy ou custo. Atualizar teste, manifest e preview.
- [ ] Obter, sob autorização/licença apropriada, um feed que forneça intraday
  real de 7 dias para BRN Jan-2027, IBOV, Dow e USD/BRL antes de desenhar as
  curvas no perfil. iPhone nativo continua não testado.

## 0.2.41 — pictogramas locais sem fonte licenciada indevida

- [x] Trocar as iniciais do perfil ativo por pictogramas vetoriais locais:
  índice, mercado, bandeira circular dos EUA e barril/gota de petróleo.
- [x] Verificar FRED/DJIA: a série tem proveniência S&P DJI, mas a própria
  página exige permissão prévia para reprodução; manter Dow indisponível sem
  ETF, proxy, conta, token ou custo.
- [x] Preservar fontes, datas efetivas, layout 2×2/4×2, gráficos e perfil
  anterior recuperável; gerar preview PNG/SVG/JSON e validar pixels. iPhone
  nativo não testado.

## 0.2.40 — perfil IBOV/Dow/USD/Brent

- [x] Substituir o perfil ativo por `IBOV`, `DOW_JONES`, `USD/BRL` e `BRENT`,
  mantendo o perfil B3/BTC recuperável e sem compartilhar cache.
- [x] Reutilizar o Worker privado para IBOV, AwesomeAPI para USD/BRL e a série
  diária EIA/FRED para Brent; filtrar Brent para observações reais em 7 dias.
- [x] Dar a cada slot um ícone circular visível: `IB`, `DJ`, bandeira dos EUA e
  `BR`; preservar nome uniforme, reticências, gráficos e ausência de ponto.
- [x] Registrar Dow sem cotação até fonte autorizada/documentada; não usar ETF,
  WTI, valor fixo, nova credencial, custo ou proxy.
- [x] Executar testes, gerar prévia PNG/SVG/JSON e publicar no main. iPhone
  nativo permanece não testado.

## 0.2.39 — logos API visíveis e identidade uniforme

- [x] Materializar SVGs de BBAS3/BBDC4 a partir das URLs retornadas pelo
  backend, validar MIME/conteúdo seguro, renderizar com `SVG.code` e manter
  fallback de iniciais fora da máscara; manter IBOV sem logo inventado.
- [x] Remover a bolinha de status, usar fonte semibold uniforme de 5.5pt e
  deixar o nome ocupar a coluna de 40pt com reticências nativas, sem reduzir
  por ativo.
- [x] Validar árvore small/medium/large, MIME/markup inválido, ordem, dados,
  gráficos 7D e prévia fixture-only. Logo vivo no iPhone ainda pendente.

## 0.2.38 — domínio horizontal comum das curvas

- [x] Normalizar o eixo X pelo primeiro/último timestamp real elegível de cada
  série, mantendo os intervalos relativos entre observações e sem alterar
  valores, pontos ou o filtro 7D.
- [x] Cobrir séries diárias/esparsas, EOD com fins de semana, pontos nulos e
  séries de um ponto; gerar comparação fixture-only nos tamanhos reais
  `158×158` e `338×170`.
- [x] Preservar densidade/cobertura distinta por mercado, registrar que o
  preview não substitui Scripting nativo e manter iPhone não testado.

## 0.2.37 — logos SVG com fallback de carregamento

- [x] Restringir URLs SVG ao host de logos retornado/allowlisted pela API.
- [x] Manter o badge circular neutro sob a tentativa nativa de `SVG.url`, para
  que falhas de download/renderização não deixem BBAS3, BBDC4 ou IBOV em branco.
- [x] Validar a ordem dos nós, o círculo de 26 pt e os quatro códigos; preservar
  dados, gráficos, `range=1mo`, janela 7D e registrar que o iPhone nativo não
  foi testado.

## 0.2.29 — folga medida do nome/status

- [x] Reservar explicitamente 27/8/3/2 pt para nome, espaçamento, bolinha e
  folga final dentro da coluna de identidade, mantendo a bolinha após o texto.
- [x] Usar a mesma reserva no `Text` nativo e no renderer fixture-only, com
  compressão do nome e sem alterar as outras colunas ou dados.
- [x] Inspecionar recortes ampliados de IPCA, Ibovespa, Diesel S10 e demais
  nomes em small e medium/large; iPhone nativo permanece não testado.

## 0.2.28 — correção visual dos blocos internos

- [x] Agrupar nome + `código | data` e valor + variação no centro vertical de
  cada linha, mantendo o ícone de 26 pt no mesmo centro e evitando linhas
  encostadas nos divisores.
- [x] Medir/reduzir nomes dentro da coluna de identidade de 40 pt e posicionar
  a bolinha de 3 pt depois da largura efetiva do nome, sem colisão; preservar
  o gráfico de 46 pt e a cotação de 26 pt.
- [x] Comparar os oito nomes em small e medium/large na prévia fixture-only,
  executar os testes estruturais e registrar que o iPhone nativo permanece
  não testado.

## 0.2.27 — quatro colunas do widget

- [x] Dividir small e medium/large em quatro colunas: ícone 26 pt centralizado, identidade com nome/status e `código | data`, gráfico de 24 h e cotação/variação alinhadas à direita.
- [x] Manter colunas do ícone/identidade iguais, limitar fontes e textos longos antes do gráfico/valor, preservar unidades compactas, ordem, fontes, status, bandeira e refresh.
- [x] Validar quatro/oito linhas, dados indisponíveis, data ausente, valores negativos, hitboxes, pixels da prévia fixture-only e o limite de não teste no iPhone.
- [ ] Integrar uma fonte intraday autorizada para `^BVSP` somente quando houver contrato público compatível, acesso permitido e validação de `regularMarketPrice`/`previousClose`; a captura e a página Yahoo limitada não são suficientes.

## 0.2.26 — código sob o ícone e altura útil do gráfico

- [x] Colocar o código curto de cada ativo abaixo do próprio ícone, manter o nome/status acima e centralizar o conjunto na faixa esquerda sem substituir unidade/origem/data.
- [x] Ampliar a altura do Canvas de 15 para 20 pt em small e medium/large, mantendo centro do gráfico/variação, preço superior, metadados inferiores, largura 82 pt e altura externa de 36 pt.
- [x] Validar nomes longos, códigos curtos, 4/8 linhas, cores, ordem, dados, refresh e prévia raster; registrar o limite de não teste nativo.
- [ ] Integrar uma fonte intraday autorizada para `^BVSP` somente quando houver contrato público compatível, acesso permitido e validação de `regularMarketPrice`/`previousClose`; a captura e a página Yahoo limitada não são suficientes.

## 0.2.25 - janela 24h e layout de gráficos

- [x] Trocar a janela visual por 24 horas reais, filtrando apenas timestamps e sinalizando série intraday indisponível para fontes esparsas.
- [x] Reduzir ícones, posicionar nome/status acima, redistribuir valor/gráfico/variação/unidade/data e aumentar altura/contraste do gráfico em small e medium/large.
- [x] Validar dados escassos, janela, alinhamento, contraste e refresh por toque; gerar prévia raster. iPhone nativo permanece não testado.

## 0.2.24 - ícone circular do USD/BRL

Entregue: substituir somente o emblema do Dólar pela bandeira dos Estados
Unidos recortada em círculo no Canvas de 26 pt. Preservar caixa, alinhamentos,
dados, estado da fonte, curvas, ordem, refresh e demais ícones em small,
medium e large. Validar a árvore renderizada, a geometria e o desenho da
bandeira; iPhone permanece pendente.

## 0.2.23 - sessao de mercado por horario oficial

Entregue: o indicador deve representar a sessao regular prevista do mercado de
referencia somente quando horario, instrumento e calendario estiverem
verificados. Para o Ibovespa, usar horario de acoes da B3, feriados e sessoes
especiais de 2026 em `America/Sao_Paulo`; nao incluir pre-abertura ou
after-market nem prometer preco em tempo real. Manter neutro para dados
periodicos e instrumentos sem sessao confirmada. Nao derivar cor de HTTP,
cache, timestamp ou frescor da cotacao. Grades sem vigencia documentada ficam
neutras. Validar limites, feriados, mudanca de horario, DST da regiao de
referencia e datas fora da cobertura. iPhone permanece pendente.

## 0.2.21 — ponto após o nome

Entrega 0.2.21: mover somente a bolinha de 3 pt para após o nome na primeira
linha, usando medição intrínseca do `HStack`, com espaço e limite antes do
valor; preservar semântica, frescor, acessibilidade, dados e layout restante.
Validar nomes curtos/longos, small/medium/large e ausência de ponto duplicado.
IPhone nativo permanece pendente.

## 0.2.20 — evidência recente da fonte por ativo

Entrega 0.2.20 concluída: a bolinha usa evidência recente da consulta por
ativo, com payload/fetchedAt válidos em verde e cache, falha, timeout ou
evidência expirada em cinza; o estado fica junto da observação e a
acessibilidade não o apresenta como bolsa aberta. Layout, fontes, dados,
curvas, ordem e refresh foram preservados. Validação nativa no iPhone continua
pendente.

## 0.2.17 — feedback de pressionamento por linha

Trocar o botão transparente único por quatro botões independentes no pequeno e oito no médio/grande. Cada alvo deve cobrir a respectiva linha de conteúdo, incluindo ícone, textos e gráfico, sem sobreposição; usar `Button` plain/intent para obter o feedback nativo de pressionamento do Scripting, solicitar o refresh bounded/deduplicado já aprovado e não navegar. Preservar a URL geral fora das linhas, o bloco, dados, fontes, ordem, status de mercado e dimensões. Validar árvore compilada, hitboxes, acessibilidade, 4/8 linhas, repetição e limites de não teste no iPhone.

## 0.2.16 — refresh limitado no toque e decisão sobre estado

Implementar no pequeno 2×2 e preservar nos demais tamanhos um refresh deduplicado: janela de 1.500 ms, cache preparado de 5 segundos, recarga antes da navegação única para `Meu Painel`/Mercado e exclusão de resultado tardio após timeout. Testar sucesso, concorrência, cache preparado/expirado, rejeição/offline, timeout, resposta tardia, marcadores inválidos e latência sintética. Não alterar bloco centralizado no ícone, ordem fixa, dados ou layout.

Avaliar uma bolinha mínima somente quando as fontes fornecerem estado de sessão confiável por ativo. Como o contrato atual só expõe observações periódicas/diárias e não estado de negociação, a decisão desta versão é deixar o indicador desconhecido e não desenhar verde/cinza. iPhone permanece não testado.

## 0.2.15 — bloco interno agrupado

Voltar aos offsets internos da 0.2.13 sem reverter ordem fixa, dados ou correções posteriores. Agrupar as três linhas em uma caixa única de 36 pontos e centralizar somente essa caixa no ícone. Preservar ícones, fontes, cores, divisórias e alturas externas; validar small/medium/large, quatro/oito linhas, dados longos/ausentes e prévia com caixa/ícone marcados. iPhone permanece não testado.

## 0.2.14 — alinhamento interno dos ativos

Construir cada linha a partir da caixa central da linha 2: manter ícone e métricas externas; alinhar centro de gráfico/variação ao centro do ícone; encerrar linha 1 no topo da caixa e linha 3 na base inferior. Não alterar fontes, cores, dados, APIs, divisórias, ordem ou alturas. Validar small/medium/large, nomes longos, valores negativos e datas ausentes com PNG comparativo; iPhone permanece não testado.

## 0.2.13 — ordem fixa também no pequeno

Ignorar `popular-small-codes` e qualquer seleção legada na apresentação: pequeno sempre mostra `Selic, IPCA, Ibovespa, Dólar`; médio/grande mostram os oito na sequência fixa e mantêm slots sem fonte. Remover a ação de seleção conflitante, preservar cache, dados, layout, link Mercado e atualização pelo mesmo caminho remoto. Validar estado persistido, fonte ausente, small/medium/large e atualização incremental da instalação existente.

## 0.2.12 — refresh limitado antes da navegação

No toque, dar ao refresh uma janela limitada de 1.800 ms. Em sucesso ou rejeição, persistir/conservar o cache, pedir a recarga e só então navegar uma vez. Em timeout, pedir a recarga do cache e navegar sem prometer conclusão de rede após a troca de app. Limpar o timer, não criar loop e preservar dados, ordem fixa, layout, link Mercado e os três tamanhos. Validar sucesso, timeout, rejeição/offline, repetição e limite de não teste nativo no iPhone.

## 0.2.11 — ordem fixa e refresh no toque

Fixar `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`, preservando a posição com reserva quando uma fonte não responder e removendo ordenação por variação da superfície pública. O botão de tela inteira deve iniciar a coleta/reload pelo AppIntent e pedir o mesmo URI Mercado do Meu Painel sem aguardar a rede. Validar fonte ausente, cache/offline, navegação, repetição sem loop e os três tamanhos; confirmar comportamento nativo no iPhone quando houver aparelho.

## 0.2.10 — entrada Mercado

Trocar somente o destino do toque da área de ativos pelo esquema oficial do Meu Painel, preservando `RefreshPopular`, dados, seleção e a correção CUB. Sem fallback de instalação ou detecção não suportada. Validar URI/parâmetro, ausência de coleta/avanço no toque, repetição sem loop, refresh explícito e os três tamanhos; iPhone permanece pendente.

## 0.2.9 — variações sem truncagem

Corrigir somente o espaço nativo da variação CUB-GO na reserva fixa de 34 pt. Preservar todos os ajustes Pro e de atualização já publicados em 0.2.8, além de sinais, unidades, curvas, dados, paginação, toque e margens. Validar texto completo em small/medium/large; iPhone permanece pendente.

Escopo: preservar desenho; escolher quatro indicadores do pequeno; detalhes,
histórico maior, fontes e exportação CSV; alertas por cruzamento com baseline e
datas reais; ferramenta do assistente; controle de consulta; painel Início.
Pedido adicional: solicitar 1 minuto, recarregar widgets de usuário e links diretos
às fontes sem passagem pelo app. Detalhes e configurações permanecem dentro do app.

Não inventar observações ou causas de variações. Dados mensais/semanais não viram
tempo real. Alertas locais são avaliados somente quando o script executa; widget
não pode conceder permissões. Não prometer daemon de fundo no iOS.
Aceite: cruzamentos, datas velhas/futuras, repetição, CSV, preferências, geometria,
rede/cache e sintaxe. Fontes/iOS precisam de validação no aparelho.
