# Popular Scripting 0.2.51 — referência de relógio por resposta

## Causa reproduzida e correção

O diagnóstico nativo da .50 mostrou respostas válidas do Yahoo 25–26 segundos à frente do relógio de recebimento local. O HTTP Date da própria resposta confirmava o horário da cotação. A comparação estrita exclusivamente com o relógio local descartava dólar/Dow como futuros e preservava o cache antigo.

Teste reproduz o desvio com horários sintéticos representativos: local 15:07:47.216 UTC, cotação 15:08:12 UTC e servidor 15:08:13 UTC. Falhou no motor .99 antes da alteração e passou depois. A correção só usa HTTP Date positivo e finito da mesma resposta HTTP 200, dentro de cinco minutos do relógio local. Esse limite verifica coerência do cabeçalho; não libera cotações até cinco minutos no futuro. Qualquer cotação posterior à referência aceita continua rejeitada.

A referência fica na própria curva/cache, nunca no relógio do sistema. O TTL de consulta usa fetchedAt local, não a hora ajustada. Renderização e validade do cache usam a mesma referência; cache legado sem referência continua suportado. Outros instrumentos e dados econômicos não são alterados.

## Verificações

- Teste de regressão do bug nativo, ausência/invalidade/erro HTTP do cabeçalho, desvio implausível, cotação realmente futura, cache legado/antigo/inválido e continuidade do renderer.
- Integração do modelo/host reais com quatro instrumentos sob o mesmo desvio; fallback de rede preserva cotação e histórico válidos.
- Suíte completa do projeto, incluindo contratos de transporte, fonte, renderer e diagnósticos, e compilação de 16 módulos Scripting.
- Preparo remoto: dois testes sintéticos cobrem sanitização, fila, privacidade, handler autenticado, leitura separada, payload/TTL, falha e concorrência. Não houve deploy, criação de credencial ou envio de registros reais.
- Layout .50 preservado byte a byte; evidências visuais dessa versão continuam válidas para a geometria. Teste local não comprova instalação ou funcionamento nativo da .51 no iPhone.

## Logs remotos e próximo passo

O pedido é leitura remota do processamento, não exportação manual de capturas. Código preparatório está isolado, fora do bundle do aplicativo. Não se publica telemetria pessoal no repositório público. O destino proposto é o Worker privado existente, com armazenamento limitado e autorizações independentes de escrita/leitura. A rota de diagnóstico ainda precisa ser integrada, implantada e testada na sessão administrativa já autorizada; nenhuma credencial legada foi reutilizada ou extraída.

A correção da cotação pode ser instalada independentemente dessa implantação. Atualize o projeto remoto no Scripting para .51 e execute Atualizar, sem apagar o cache. Logs remotos só serão descritos como operacionais depois de envio real do iPhone e leitura privada confirmados.
