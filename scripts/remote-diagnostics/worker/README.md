# Backend de diagnostico privado

Fonte do Worker existente com adicao de POST /v1/market. GET economico preservado. Bearer WIDGET_TOKEN continua no mesmo endpoint; segredo nunca esta neste pacote. Nao ha GET HTTP de logs: leitura historica usa Data Studio administrativo do Durable Object existente.

Contrato: JSON schema 1/version/engineVersion/events, resposta 202. Somente enums e numeros limitados. Máximo 32 eventos, 16 KiB/lote; servidor aceita 1 lote/5 min, responde 202 a retry identico por SHA256 sem duplicar. Tabela diagnostics separada de market_cache, máximo 64 lotes e 7 dias; alarme remove expirados. Nenhuma credencial, binding, plano ou observability adicional.

Testes Node 24: node test/diagnostics.test.mjs e node test/market.test.mjs. Ambos passaram. O primeiro usa SQLite real local e credenciais sinteticas; nao confundir com POST real de iPhone.

Implantacao de codigo confirmada no painel, sem problemas no editor, 100% ativa. Hash SHA256 do bundle implantado gerado com esbuild 0.28.2 (bundle,format esm,keepNames): 466e9aa5a2e996290ed468e47eaa0ba85faddf4b810e176d5d4ef3e85246b6ce

Validacao administrativa real: tabela criada no DO existente; fixture tecnica inserida/lida e removida, contagem final 0. A fixture e dados de conta NAO estao no pacote. HTTP de producao bloqueado pela politica de rede do executor, sem resposta do Worker e sem contorno. Primeira entrega autenticada do iPhone pendente.

Leitura autorizada: Cloudflare > Worker existente > binding MARKET_CACHE > Data Studio > instancia existente > SELECT received_at,payload FROM diagnostics ORDER BY id DESC LIMIT 64. Nenhum token deve ser extraido para viabilizar leitura.

Observacao de compatibilidade: o nome de instancia existente em worker.mjs precisa ser preservado para nao criar um cache duplicado. Arquivos contêm nomes tecnicos de bindings e referencia a chaves, nunca os valores das credenciais. Nenhum ID de conta, namespace ou objeto administrativo foi incluido.


Reprodutibilidade do pacote: ao executar esbuild 0.28.2 com entry `src/worker.mjs`, bundle, format esm e keepNames, o SHA256 é `d9dc5ee61836fe61f54ae75572d82bf3f7e48cbf8b72a0b548cb3ca60d54f46d`. A diferença para o bundle implantado são somente os dois comentários de caminhos (`diagnostics-prep/` versus `src/`), conferidos byte a byte após substituir esses comentários. Ambos transformados com `esbuild.transformSync(text,{loader:'js',minify:true,format:'esm'}).code` têm SHA256 `f633c0257b2597d778ee36f59af93c1b1a364301d39474173e2c20d2afd572e4`.
