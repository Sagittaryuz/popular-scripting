# Integração da fonte privada

A integração foi publicada no remoto em `0.2.34`; o cliente não contém o valor
do token e não depende de teste nativo para ser importado. A validação ponta a
ponta continua pendente neste executor porque a tentativa de alcançar o
endpoint foi interrompida pelo túnel com `403` antes do Worker. Isso não é
tratado como resposta do Worker nem como confirmação de dados reais.

## Contrato usado

- Endpoint fixo: `GET https://popular-private-market-prep.mrpires72.workers.dev/v1/market`.
- O cliente envia `Authorization: Bearer ...` somente nesse caminho exato.
- A resposta esperada é o bundle `schema: 1`, `source: "brapi"`, na ordem
  `BBAS3`, `BBDC4`, `IBOV`; o símbolo do índice deve ser `^BVSP`.
- Cotação, variação, timestamps, histórico de 7 dias e `iconURL` são aceitos
  somente quando passam pela validação do bundle. A imagem do ativo só usa a
  URL `icons.brapi.dev` devolvida pelo backend; sem ela, a interface usa as
  iniciais.
- O perfil novo não chama DadosB3 nem Brapi diretamente para cotações ou
  logos. Sem token, sem resposta válida ou com cache privado disponível, os
  três slots B3 ficam sem cotação ou mostram somente o último cache privado;
  nenhum valor é fabricado. BTC/USD continua no adaptador público Kraken.

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

## Verificações desta preparação

- `npm run check`: passou.
- `npm test`: passou, incluindo transporte autenticado, rejeição de bearer em
  fontes públicas, ordem dos quatro ativos, bundle de 7 dias, ausência de
  chamadas DadosB3/Brapi no fluxo novo e fallback sem dados.
- O endpoint real não pôde ser autenticado neste executor: a tentativa sem
  token foi bloqueada pelo túnel com `403` antes de alcançar o Worker. Não há
  afirmação de sucesso, cache, payload ou dados ao vivo.
- A entrega publicada é `0.2.34`; o SHA remoto deve ser conferido no GitHub
  antes de atualizar uma instalação existente. Não houve teste nativo em
  iPhone nem validação ponta a ponta neste executor.
