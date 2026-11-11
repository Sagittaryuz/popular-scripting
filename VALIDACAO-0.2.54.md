# Popular Scripting 0.2.54

## Escopo e causa

A evidência nativa da .53 mostrou um recorte diagonal no fundo de todas as cápsulas. O render desktop com arcos passou, portanto não provou compatibilidade com o preenchimento nativo. O novo desenho evita a composição de arcos elípticos e usa exclusivamente moveTo/lineTo/closePath, já utilizados pelos preenchimentos dos gráficos.

O contorno tem 24 segmentos por semicircunferência e interior sólido. Nas dimensões atuais, a aproximação fica abaixo de 0,02 pt. Geometria 36 × 13 pt, cor do gráfico e margem interna do preço preservadas.

## Novos pedidos agrupados

Nome e preço ocupam a faixa superior de 13 pt. Sigla/data e variação ocupam a inferior de 13 pt, ancorada à base do ícone de 26 pt. Nomes não recebem fundo. Fontes nominais iguais de 10,5 pt; nomes longos truncam para não invadir o gráfico. A segunda linha conserva ajuste proporcional e conteúdo original, sem reduzir precisão de valores.

## Verificação

- Teste de desenho com contexto que só permite linhas; nenhuma chamada de arco/ellipse pode voltar.
- Raster nas escalas 1x–4x: interior opaco sem recorte diagonal, cantos transparentes, simetria com tolerância de antialiasing.
- Geometria, alinhamento, cores e contraste em cinco dimensões e todos os estados de movimento.
- Suíte completa de regressões e compilação TS/TSX.
- Prévia de produção em quatro dimensões com dados históricos capturados. Sem novas consultas de cotação e sem alterações no motor/cache/logs/Worker.

## Limites

A imagem recebida comprova o defeito da .53, não a correção. As prévias .54 são Linux Skia, não capturas do iPhone; a confirmação visual nativa continua pendente. Atualizar o projeto remoto no Scripting, sem apagar cache. O botão Atualizar cotações não instala a versão nova.
