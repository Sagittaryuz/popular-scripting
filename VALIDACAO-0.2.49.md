# Popular Scripting 0.2.49 — alias do dólar e diagnóstico por ativo

## Evidência e escopo

A nova foto real confirmou **0.2.48 / motor .98** instalada, mas Dow Jones e dólar continuaram indisponíveis. A correção anterior de relógio era um defeito reproduzível, porém não resolveu completamente o aparelho. Não se deve considerar simulação ou HTTP 200 prova de funcionamento nativo.

Uma rodada posterior, sem repetições, consultou os quatro endpoints existentes entre 20:09:58 e 20:10:15 UTC de 09/11/2026. Todos responderam HTTP 200. No replay pelo modelo/host/motor da .48, Ibovespa, Dow e Brent foram aceitos; dólar falhou por identidade.

**Causa confirmada do dólar:** o pedido `BRL=X` devolveu `meta.symbol=USDBRL=X`. Os metadados dizem `shortName=longName=USD/BRL`, moeda BRL, tipo CURRENCY e exchange CCY. A correção aceita somente esse alias específico para o mesmo par, mantendo as demais validações, endpoint e chave de cache.

**Dow permanece sem causa nativa confirmada.** A nova resposta tinha ^DJI/INDEX/USD e sessões válidas; a cotação 20:10:14 precedia o recebimento 20:10:15.323. HTTP Date era 20:10:15. Ela passou no replay. Uma diferença pequena entre relógio do aparelho e fonte pode reproduzir a ausência, mas não é evidência de que ocorreu. Nenhuma tolerância arbitrária foi acrescentada.

## Mudanças

- Motor `2026.11.09.99`: alias exato de USD/BRL e diagnóstico por instrumento.
- Erros de identidade, cotação, sessões, série, HTTP e timeout passam a ser diferenciados, em vez de só deixar o indicador vazio.
- Diagnóstico mostra horários locais/da cotação e HTTP Date quando disponível, com campos limitados. Não expõe corpo da resposta, cabeçalhos completos, tokens, Keychain ou configurações privadas.
- A tela do app mostra falhas junto do botão Atualizar, para que uma foto permita saber o que aconteceu. O widget e seu layout permanecem iguais.
- Cache válido é preservado quando uma tentativa falha. A janela continua de aproximadamente 24 horas cotadas, sem preencher lacunas.

## Validação e limites

Regressões cobrem alias exato, rejeição de pares errados, diagnósticos, respostas futuras, transporte e cache. Build, suíte completa e replay das respostas reais verificam a implementação. As prévias são simuladas e não comprovam execução no iPhone.

Esta versão corrige uma causa confirmada do dólar e permite identificar a falha restante do Dow no dispositivo. Não declara que os quatro já funcionam no iPhone.

Atualize o vínculo remoto do Popular Scripting para **0.2.49 / motor 2026.11.09.99**, abra o projeto e toque **Atualizar**. Se algum ativo faltar, envie a mensagem de diagnóstico que aparece perto desse botão. Não apague o projeto nem o cache. Fonte pública, limite de consultas e orçamento do widget continuam sujeitos a falhas.
