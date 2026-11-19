# Popular 0.2.66 — retorno nas últimas 24 horas de negociação

Pedido direto de Marcos em 19/11/2026: usar a mesma referência temporal para gráfico e variação de todos os ativos negociáveis do perfil publicado; preservar a última leitura nos fechamentos, sem reiniciar o zero. Verde positivo, vermelho negativo, amarelo somente zero exato. Sem base, exibir —.

## Implementação
- A janela termina no último dado real, não no instante da consulta. Soma a união dos períodos de negociação históricos fornecidos pelo Yahoo, excluindo intervalos entre sessões. Não usa previousClose nem chartPreviousClose para calcular retorno.
- Lacunas entre amostras dentro de uma sessão confirmada contam no tempo de negociação, mas permanecem quebras no desenho. Não se deduz fechamento de uma falha de feed.
- A referência inicial é uma observação real no máximo cinco minutos de negociação antes do alvo de 24 horas (resolução do feed). `returnReference`/`chartCoverage` registram tempo efetivo, excesso e extremos; não há interpolação de preço. Ausência de extremo suficientemente próximo deixa o percentual indisponível.
- Cotação de metadados fora da sessão não substitui o último ponto válido. O timestamp bruto fica em `providerQuote`. Gráfico e percentual compartilham extremos.
- O esquema de cache 2 rejeita percentuais diários de caches antigos; cache novo preserva preço, horário e janela em falha de rede. Perfis legados/econômicos e outros widgets não foram modificados.

## Verificação
- `npm test`: suíte completa passou, incluindo nova regressão de quatro ativos, sessões, sexta/domingo, virada do fornecedor, cripto contínua sintética, tolerância inicial, lacunas internas, calendário ausente, sessões sobrepostas, cotação após fechamento, zero e cores.
- `npm run check`: módulos e imports compilados.
- Feed Yahoo query2 consultado em 19/11, 5d/5m e expansão USD/BRL 1mo/5m: os quatro ativos apresentaram extremos suficientes; positivo/negativo deriva exclusivamente desses preços. Payloads não incluídos no repositório ou pacote.
- Renderização do modelo/host/view reais em Linux para small, medium e large e inspeção visual: mesmos layout e ícones, cores coerentes, sem percentual cinza calculado. Não equivale a teste nativo no iPhone.

## Limites
Calendário é o fornecido pelo provedor, não um calendário independente de feriados. Sessões inteiras omitidas pelo fornecedor não podem ser identificadas como fechadas com certeza. Não se acrescentam horas por calendário inventado. Sem histórico/calendário ou extremos suficientes, não se inventa zero. Tolerância de resolução é explícita (até 5min), não precisão de tick. Cripto é teste do relógio contínuo genérico; o perfil ativo segue IBOV/DOW/USD/Brent.
