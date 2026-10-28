# Melhorias Scripting Pro — 23/10/2026

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
