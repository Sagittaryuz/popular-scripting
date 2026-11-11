# Diagnóstico remoto privado

## Implementação em uso na versão 0.2.52

A fonte e os testes do receptor implantado estão em `worker/`; são separados da distribuição Scripting. Não publicar eventos reais nem incluir o valor de credenciais.

O cliente nativo está em `../Popular Scripting/diagnostics.ts` e o contrato fechado em `diagnostics-schema.ts`. `schema.ts` reexporta esse contrato para os testes do projeto. A integração roda no app e widget; o destino é `POST https://popular-private-market-prep.mrpires72.workers.dev/v1/market`, com o mesmo bearer já existente no Keychain. A allowlist de destino do token não foi ampliada e nenhuma credencial foi criada, copiada do aparelho ou incluída no repositório.

Campos permitidos: versão/motor, etapa, um dos quatro ativos, código técnico/cache de listas fixas, HTTP, contagem de pontos e horários. Preços, preferências, texto livre, URLs, corpos e headers HTTP, identificadores de aparelho e tokens são descartados antes da persistência/transmissão e novamente no servidor.

- Cliente: até 32 eventos/24 h, tentativa a cada cinco minutos persistida, timeout de 1,2 s, sem redirects e sem ler corpo de resposta. HTTP202 confirma aceitação. Falhas preservam a fila e não substituem cotações por erros.
- Servidor: autenticação antes do Durable Object, limite de 16 KiB, schema validado, hash idempotente, limite de cinco minutos, até 64 lotes/sete dias com limpeza física por alarme. O POST não depende dos provedores econômicos.
- Histórico: tabela `diagnostics` separada do cache econômico no MarketCache existente. A leitura é feita privadamente no Data Studio pela sessão administrativa Cloudflare autorizada. Não há GET público de logs nem nova credencial de leitura.
- Operação: a tela principal mostra o último envio ou erro seguro. Remover o token desativa o envio sem interromper as quatro cotações Yahoo.

Os arquivos `client.ts`, `server.ts` e seus testes preservam o protótipo isolado da .51 com adaptadores injetados. Não são o transporte/endpoint implantado, não devem ser publicados como servidor sem adaptação e não concedem acesso de leitura. O endpoint preparatório `/v1/diagnostics` não foi ativado.

## Validação e limites

Ver [VALIDACAO-0.2.52.md](../../VALIDACAO-0.2.52.md). Testes sintéticos, SQLite local e consulta administrativa são distintos da entrega nativa. O envio real do iPhone fica pendente até atualizar/executar a versão e verificar a chegada do lote no histórico privado. Não publicar eventos reais ou capturas administrativas neste repositório público.
