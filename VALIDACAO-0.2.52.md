# Popular Scripting 0.2.52 — logs técnicos privados

## Critérios e implementação

O pedido é ler remotamente o processamento do widget sem depender de fotos. O cliente registra somente eventos de esquema fechado e os envia por POST ao mesmo Worker e caminho já usados pelo acesso privado. A leitura histórica usa a sessão administrativa Cloudflare/Data Studio existente, sem nova credencial, novo destino, logs públicos ou ampliação de acesso.

- App `0.2.52`, motor `2026.11.11.101`. A alteração do motor só identifica entrega `network`, `cache` ou `fallback`; o cálculo das cotações e a correção do HTTP Date da .51 não mudam.
- Fila local isolada, até 32 eventos e 24h. Tentativa persistida a cada cinco minutos, timeout de 1,2s, sem redirecionamento, sem ler o corpo da resposta. Apenas HTTP202 remove o lote; falha,401,429 ou resultado incerto preservam a fila.
- O Keychain fornece o bearer somente ao endpoint fixo. Nenhum valor de credencial é gravado em Storage, exportado ou incluído em evento. Remover o token suspende o envio.
- Sanitização independente no cliente e servidor: versões, etapa/ativo/código/cache de listas fixas, HTTP, contagens e horários limitados. Preços, preferências, URLs, cabeçalhos, corpo, mensagens livres e identificadores do aparelho não são enviados.
- Histórico em tabela separada do Durable Object existente: 64 lotes/7 dias, deduplicação por hash, limite de cinco minutos no servidor e alarme de limpeza física. O POST não consulta provedores econômicos. O GET econômico é preservado; não há GET de logs.
- A interface é apresentada após a tentativa limitada, porque Widget.present pode encerrar o contexto. Falhas de diagnóstico são isoladas das cotações. No app, o estado do envio fica visível.

## Verificações concluídas

- Suíte completa do repositório e compilação dos 18 módulos TS/TSX.
- Testes de privacidade, allowlist, Keychain, destino exato, redirects, fila/TTL, rate persistido entre execuções,401, offline, concorrência e eventos acrescentados durante envio.
- Regressão de falha síncrona do bridge de fetch: a promessa pendente é limpa e a tentativa seguinte funciona.
- Teste do modelo real comprova que o cache TTL não faz consulta nova e não gera falso evento de resposta; fallback preserva a cotação. Revisão independente confirmou as correções.
- Pacote do backend materializado e verificado por SHA256; os testes SQLite/econômicos também passaram no executor de integração. Fonte do pacote e bundle implantado são iguais após normalizar somente dois comentários de caminhos; hash canônico `f633c0257b2597d778ee36f59af93c1b1a364301d39474173e2c20d2afd572e4`.
- Backend com SQLite real local: autenticação antes do objeto,202/400/401/413/429, hash idempotente, TTL,64 lotes, alarme e preservação da tabela de mercado. Regressões econômicas do Worker passaram.

## Implantação e limites

O receptor foi implantado no Worker existente pelo painel autenticado, com editor sem problemas e código comparado ao bundle testado. Não foram alterados segredos, bindings, plano ou observabilidade.

Versão do Worker: `bd7651e0-89d7-4d7e-bef8-d74ba2d0f090`, confirmada Active/Latest e 100% Ready. O Data Studio confirmou a tabela separada, gravou e leu um evento técnico sintético versão0.0.0; somente essa fixture foi removida após a leitura, com contagem final zero. Isso comprova armazenamento/leitura administrativos, não a ingestão HTTP.

O teste HTTP direto GET/POST ao Worker foi bloqueado pela política de rede do executor antes de resposta do serviço. Não foi tentada rota alternativa para contornar a restrição. Assim,401 de produção e POST autenticado real não foram verificados;401/202 e demais cenários passaram no handler local com SQLite real.

Não houve execução desta versão em iPhone. POST autenticado do aparelho e leitura desse evento real só ficam confirmados após atualizar o projeto remoto no Scripting e executar Atualizar. Não é necessário apagar cache ou reenviar fotos. Até essa primeira entrega, as verificações do servidor e os testes sintéticos não equivalem a funcionamento nativo comprovado.
