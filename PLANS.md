# Melhorias Scripting Pro — 23/10/2026

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
