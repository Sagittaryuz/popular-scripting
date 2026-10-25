## Atualização 0.2.9 — variação CUB completa

A variação M/M do CUB-GO (`+0,025%`) continua sendo o valor publicado, mas sua reserva nativa de 34 pt pode exceder a métrica de algumas UIFonts. O rótulo mantém a mesma caixa, posição, alinhamento e formatação; somente o piso de redução desse texto longo passa de 7,5 para 6,5 pt. IPCA (`+1,14 pp`), Diesel (`-0,14%`) e Brent (`-3,03%`) permanecem inalterados. Dados, curvas, fontes, paginação, toque, atualização, Pro e demais ajustes da 0.2.8 foram preservados. Teste físico no iPhone continua pendente.

## Atualização 0.2.8

Remove o trapézio e horário da área visível. O conteúdo usa a altura completa com margem vertical externa de 8pt, preserva o ajuste horizontal original e redistribui verticalmente as linhas. Tocar qualquer parte do widget força uma coleta atual, avalia alertas e avança para a próxima página; falha na fonte conserva os dados anteriores e permite avançar. A execução de apresentação seguinte usa o cache recém-coletado para não duplicar a consulta. Widget.reloadAll solicita também as outras timelines do Scripting.

Testes locais: fontes, páginas distintas/retorno, coleta forçada no intent, falha/cache, alvo único de toque, margens e novas posições. O módulo antigo de footer fica sem importação na view, apenas como histórico e regressão isolada. Aparência, toques e agenda de execução no aparelho ainda não confirmados. Reversão: scripting-v0.2.7.

## Atualização 0.2.7 — revisão de desempenho e homepage separada

O transporte une requisições simultâneas iguais dentro da mesma execução, preservando status, allowlist e orçamentos. Depois de concluídas, as requisições saem da memória de deduplicação: não criamos outro cache nem renovamos a data das cotações. Teste: duas chamadas sobrepostas viram uma requisição; consulta posterior continua indo à fonte. Cache com horário futuro deixa de ser válido.

A avaliação dos alertas habilitados agora termina antes de Widget.present, pois a apresentação pode encerrar o contexto. Mantidos pipeline de validação, dados numéricos brutos, paginação sem rede e PNG/OCR com fallback nativo. Não houve troca de linguagem, dependência de produção ou alteração visual.

A homepage embutida foi removida. Meu Painel é distribuído separadamente pelo repositório privado Sagittaryuz/scripting-home. O Popular só escreve um resumo local em Storage shared: até 16 ativos e até 24 pontos por série; não importa outra UI/motor. Outros scripts instalados no Scripting podem ler esse domínio compartilhado. Não contém credenciais. A homepage não executa consultas financeiras, OCR ou gráficos completos do motor.

Testes locais de fontes, observações antigas/futuras, alertas, cache, transporte, allowlist, paginação, footer e refresh aprovados. Compilação/visual/toques e entrega de notificações nesta versão no iPhone ainda pendentes. Atualize o projeto existente pelo mesmo Git; instale o painel separadamente.

# Popular Scripting

**Atual: 0.2.0 — Scripting Pro.** Detalhes, seleção de quatro indicadores, CSV,
alertas, assistente, Central de Controle e painel Início. Consulta solicitada em
1 minuto e links diretos às fontes. [Ativação, testes e limites](PRO.md).

Widget econômico para o aplicativo Scripting, com acesso público e sem token de GitHub no aplicativo.

## Importação remota

Na tela **Importar Scripts Remotos** do Scripting, cole:

```text
https://github.com/Sagittaryuz/popular-scripting/tree/main/scripts/Popular%20Scripting
```

Importe **Popular Scripting**, confirme a versão **0.2.0**, abra o projeto e toque em **Atualizar**. Adicione o widget do Scripting à Tela de Início e selecione esse projeto.

Para receber melhorias de código, use a atualização do script remoto no Scripting. Essa importação vincula o projeto à pasta `main/scripts/Popular Scripting`; não use um endereço de commit ou tag para acompanhar as próximas versões. O botão **Atualizar** dentro da tela do Popular consulta somente os indicadores e solicita recarregar o widget.

## Tamanhos e dados

- Pequeno: quatro indicadores. Médio e grande: oito.
- Cinco modos de ordenação, fundo original, ícones e gráficos.
- Fontes: BCB, AgroLink, Investidor10, AwesomeAPI, FRED e referências públicas documentadas em `data/economic-series.json`.
- Dados econômicos de referência são consultados diretamente deste Git, sem autenticação. Rede indisponível ou resposta inválida preserva o cache validado ou a reserva versionada, com suas datas originais.
- O workflow `economic-data.yml` é programado a cada hora útil, 11h17–23h17 UTC, sujeito a atrasos do GitHub. Falha de uma fonte mantém a série anterior e é registrada no workflow; dados antigos não recebem data de observação nova.
- Política de atualização do widget: a partir de um minuto, configurável em 1/5/15, sujeita ao iOS.

Não são solicitadas permissões de Calendário, Lembretes ou Localização. O projeto não lê credenciais; ao executar a tela principal, tenta remover somente a credencial legada que uma edição anterior do próprio projeto tenha salvo. Não altera o GitHub configurado nas preferências gerais do Scripting nem revoga credenciais da conta GitHub.

## Validação e recuperação

A versão 0.1.3 limita os meses aos extremos da curva, com máscara local e descarte dos rótulos totalmente externos. Mantém a composição nativa Text, Canvas transparente para ícones/curvas e as dimensões originais.

A leitura dos preços AgroLink tem alternativa zlib em JavaScript, independente da descompressão nativa. A atualização manual permite até 20 segundos totais e 6 segundos por consulta AgroLink; o widget mantém 8 e 3 segundos. Falhas das fontes aparecem na tela após Atualizar, e o cache anterior é preservado com suas datas. O IPCA trata o cabeçalho da resposta SIDRA; o CUB trata letras separadas na extração de PDFs, mantendo a conferência de mês/padrão.

Testes locais cobrem os oito indicadores por HTTP, coletores de referência, descompressão com a ponte nativa desativada, entradas inválidas, cache e quinze prévias simuladas. Esses testes não confirmam o comportamento da rede e das fontes no iPhone; a versão 0.1.3 ainda exige essa conferência na Tela de Início.

O histórico Git e as releases preservam versões anteriores para recuperação. Antes de atualizar uma edição personalizada, preserve suas alterações locais. Os dados e preferências do projeto ficam no aparelho; não apague o projeto para atualizar.

## Manutenção

O código do widget fica em `scripts/Popular Scripting`. Cada melhoria deve atualizar `script.json` e `model.ts`, passar pelas verificações e ser publicada em `main`. Alterar apenas `data/economic-series.json` atualiza dados, sem mudar código ou versão do widget.

O script de coleta usa somente fontes públicas. Para verificar dados em Node 22: `node scripts/validate-data.cjs`. As dependências Python da coleta estão em `scripts/economic-requirements.txt`. Nenhuma dependência de teste é necessária no iPhone.

Canvas, Scripting e as fontes do sistema podem apresentar diferenças de métricas em relação ao Scriptable; não há alegação de fidelidade pixel a pixel. [Documentação do Scripting](https://scriptingapp.github.io/guide/Script/Script).
