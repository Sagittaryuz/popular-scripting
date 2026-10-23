# Popular Scripting

Widget econômico para o aplicativo Scripting, com acesso público e sem token de GitHub no aplicativo.

## Importação remota

Na tela **Importar Scripts Remotos** do Scripting, cole:

```text
https://github.com/Sagittaryuz/popular-scripting/tree/main/scripts/Popular%20Scripting
```

Importe **Popular Scripting**, confirme a versão **0.1.2**, abra o projeto e toque em **Atualizar**. Adicione o widget do Scripting à Tela de Início e selecione esse projeto.

Para receber melhorias de código, use a atualização do script remoto no Scripting. Essa importação vincula o projeto à pasta `main/scripts/Popular Scripting`; não use um endereço de commit ou tag para acompanhar as próximas versões. O botão **Atualizar** dentro da tela do Popular consulta somente os indicadores e solicita recarregar o widget.

## Tamanhos e dados

- Pequeno: quatro indicadores. Médio e grande: oito.
- Cinco modos de ordenação, fundo original, ícones e gráficos.
- Fontes: BCB, AgroLink, Investidor10, AwesomeAPI, FRED e referências públicas documentadas em `data/economic-series.json`.
- Dados econômicos de referência são consultados diretamente deste Git, sem autenticação. Rede indisponível ou resposta inválida preserva o cache validado ou a reserva versionada, com suas datas originais.
- O workflow `economic-data.yml` é programado em dias úteis às 16h35 UTC. Falha de uma fonte mantém a série anterior e é registrada no workflow; dados antigos não recebem data de observação nova.
- Política de atualização do widget: a partir de cinco minutos, sujeita ao iOS.

Não são solicitadas permissões de Calendário, Lembretes ou Localização. O projeto não lê credenciais; ao executar a tela principal, tenta remover somente a credencial legada que uma edição anterior do próprio projeto tenha salvo. Não altera o GitHub configurado nas preferências gerais do Scripting nem revoga credenciais da conta GitHub.

## Validação e recuperação

A versão 0.1.2 corrige a composição após o relato de textos cortados e valores invisíveis no iPhone. Nomes, preços, percentuais, meses e datas usam componentes nativos Text. Canvas desenha somente ícones e curvas, com preenchimento de transparência explícita em faixas derivadas do original; não usa tipografia Canvas nem CanvasGradient. Os meses ficam recortados somente dentro da faixa do gráfico. Mantém as colunas de 146 pt, ícones de 26 pt e três faixas de informação em cada linha do original.

Passaram sintaxe TS/TSX, equivalência de cálculos, cinco ordenações e geometrias do motor, testes da árvore TSX efetivamente usada (Text nativo, preço/percentual presentes em todas as linhas, limites das caixas, Canvas sem texto/gradiente e transparente) e quinze prévias simuladas dos três tamanhos. A prévia local anterior não captou o defeito do aparelho; a simulação nova também não comprova fontes nem aceite visual no iPhone. É necessário conferir a 0.1.2 na Tela de Início. Acesso público e cache continuam sem token.

O histórico Git e as releases preservam versões anteriores para recuperação. Antes de atualizar uma edição personalizada, preserve suas alterações locais. Os dados e preferências do projeto ficam no aparelho; não apague o projeto para atualizar.

## Manutenção

O código do widget fica em `scripts/Popular Scripting`. Cada melhoria deve atualizar `script.json` e `model.ts`, passar pelas verificações e ser publicada em `main`. Alterar apenas `data/economic-series.json` atualiza dados, sem mudar código ou versão do widget.

O script de coleta usa somente fontes públicas. Para verificar dados em Node 22: `node scripts/validate-data.cjs`. As dependências Python da coleta estão em `scripts/economic-requirements.txt`. Nenhuma dependência de teste é necessária no iPhone.

Canvas, Scripting e as fontes do sistema podem apresentar diferenças de métricas em relação ao Scriptable; não há alegação de fidelidade pixel a pixel. [Documentação do Scripting](https://scriptingapp.github.io/guide/Script/Script).
