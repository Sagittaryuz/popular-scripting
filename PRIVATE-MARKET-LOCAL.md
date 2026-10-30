# Integração da fonte privada

A revisão do cliente é `0.2.42`; ela não contém o valor do token e não depende
de teste nativo para ser importada. A validação ponta a ponta continua
pendente neste executor porque a tentativa de alcançar o
endpoint foi interrompida pelo túnel com `403` antes do Worker. Isso não é
tratado como resposta do Worker nem como confirmação de dados reais.

## Contrato usado

- Endpoint fixo: `GET https://popular-private-market-prep.mrpires72.workers.dev/v1/market`.
- O cliente envia `Authorization: Bearer ...` somente nesse caminho exato.
- A resposta esperada é o bundle `schema: 1`, `source: "brapi"`, na ordem
  `BBAS3`, `BBDC4`, `IBOV`; o símbolo do índice deve ser `^BVSP`.
- Cotação, variação, timestamps, histórico de 7 dias e `iconURL` são aceitos
  somente quando passam pela validação do bundle. O cliente busca o corpo
  somente da URL HTTPS `icons.brapi.dev` devolvida no metadado, valida o MIME e
  o SVG antes de usar `SVG.code`, e mantém iniciais visíveis se falhar; não há
  URL montada, ETF ou proxy.
- O perfil ativo usa somente a linha `IBOV` desse bundle privado; não chama
  DadosB3 nem Brapi para cotações ou lista de logos. Sem token, resposta válida
  ou cache privado, o slot IBOV fica sem cotação; nenhum valor é fabricado.
  O perfil anterior `BBAS3/BBDC4/IBOV/BTC/USD` continua recuperável no motor.

## Configuração no iPhone

1. Abra o projeto Popular no Scripting e execute a tela principal.
2. Em **Detalhes dos indicadores**, toque em **Configurar fonte privada**.
3. Cole o token privado no campo seguro e toque em **Salvar**. O valor é
   gravado somente no Keychain sob `popular-private-market-widget-token-v1`;
   não é escrito em `Storage`, arquivo, diagnóstico, GitHub, log ou widget.
4. O app solicita recarga dos widgets. A consulta seguinte usa o endpoint
   protegido; o widget em si não abre prompt nem expõe o token.
5. **Remover token privado** apaga somente essa chave do Keychain. A ação não
   altera o Worker nem a `BRAPI_API_KEY`.

O botão não deve ser usado antes de o mesmo valor estar configurado no Worker
como `WIDGET_TOKEN`. Neste checkout nenhum token foi configurado ou preservado.

## Diagnóstico da falha observada

O cliente envia `Authorization: Bearer <token>` somente para o endpoint privado
exato. O transporte local foi coberto por teste de contrato e a documentação
oficial do Scripting confirma que `fetch` aceita um objeto de headers e que o
Keychain é isolado por script; a configuração e o widget usam o mesmo projeto,
mas o acesso nativo ao iPhone não foi reproduzido aqui.

O log operacional do Worker informou que as requisições autenticadas chegaram à
brapi e que as 14 subrequisições recentes retornaram 4xx. Isso afasta, nessa
execução, um simples bloqueio de rede do iPhone ou ausência de `WIDGET_TOKEN`,
mas não identifica se o upstream respondeu 401, 403, 404 ou 429. O Worker
preparado ainda chama `/api/quote/{ticker}?range=7d&interval=1d`; a OpenAPI atual
da brapi recomenda `/api/v2/stocks/quote` e `/api/v2/stocks/historical` para
integrações novas, mantendo a v1 ativa. O executor responsável pelo Worker deve
confirmar a rota/plano e devolver somente uma categoria/código numérico seguro;
não deve devolver corpo upstream ou credenciais.

Na versão `0.2.42`, abra o projeto no Scripting, toque em **Atualizar** e leia
a linha **Fonte privada:** na tela do app. Ela diferencia `token ausente no
Keychain`, `Worker rejeitou a autorização (401)`, `Worker/fonte indisponível`
`Worker respondeu HTTP 4xx` e `resposta ... não passou na validação`, além de
indicar cache preservado. Quando o novo contrato seguro estiver ativo no
Worker, a mesma linha poderá acrescentar `origem upstream HTTP <código>` e o
ativo entre `BBAS3`, `BBDC4` e `IBOV`, além do `upstreamCode` allow-listed; o
cliente ignora qualquer outro campo. A
linha não mostra token, URL autenticada, corpo HTTP ou preço inventado. O widget
continua exibindo ausência honesta no IBOV até o Worker entregar um bundle válido;
Dow Jones permanece sem cotação por falta de fonte autorizada.

## Verificações desta preparação

- `npm run check`: passou.
- `npm test`: passou, incluindo transporte autenticado, rejeição de bearer em
  fontes públicas, ordem dos quatro ativos, bundle de 7 dias, ausência de
  chamadas DadosB3/Brapi no fluxo novo e fallback sem dados.
- O endpoint real não pôde ser autenticado neste executor: a tentativa sem
  token foi bloqueada pelo túnel com `403` antes de alcançar o Worker. Não há
  afirmação de sucesso, cache, payload ou dados ao vivo.
- O artefato desta revisão é `0.2.42`; a prévia `validation/market-profile-0.2.42-preview.png`
  é fixture-only. O download vivo dos logos retornou `403` no túnel deste
  executor, portanto o aparelho ainda precisa validar os corpos reais.
  O SHA remoto deve ser conferido no
  GitHub antes de atualizar uma instalação existente. Não houve teste nativo em
  iPhone nem validação ponta a ponta neste executor.
