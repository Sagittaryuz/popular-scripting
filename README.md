## Atualização 0.2.21 — ponto após o nome

A bolinha de saúde da fonte permanece com 3 pt, mesmas cores e significado,
mas agora aparece imediatamente após o nome na primeira linha. O `HStack`
nativo usa a largura intrínseca do texto e mantém 2 pt de separação, limitado à
coluna de 64 pt para que nomes longos não invadam o valor. A linha 3, dados,
fontes, curvas, refresh e dimensões permanecem iguais. O iPhone nativo ainda
não foi testado.

## Atualização 0.2.20 — saúde recente da fonte

A bolinha de 3 pt continua na mesma posição, mas agora é verde apenas quando a
consulta que produziu aquela linha registrou um payload válido do provedor para
o ativo. Cache, arquivo histórico, falha, indisponibilidade, payload inválido,
timeout e evidência com mais de cinco minutos ficam cinza; um snapshot Git
verificado na consulta é tratado como resposta atual do provedor de dados. O
estado é por ativo e acompanha a mesma observação; o resultado preparado de
cinco segundos pode reutilizar a evidência da mesma consulta. O rótulo de
acessibilidade diz que o ponto representa saúde da fonte, não bolsa aberta.
Layout, dados, fontes, curvas, ordem e refresh permanecem inalterados.

## Atualização 0.2.19 — estado neutro até haver contrato do índice

A bolinha de 3 pt continua à esquerda da última data, mas agora permanece
neutra em todas as linhas. O horário de negociação de ações da B3 não é usado
como proxy para o Ibovespa: o índice é calculado a partir dos ativos da
carteira, e as fontes verificadas não fornecem um estado atual de publicação do
próprio índice. Assim, não há verde/cinza falso para sessão, conectividade ou
frescor. O rótulo de acessibilidade explica essa incerteza. Layout, dados,
fontes, curvas, ordem e refresh permanecem inalterados.

## Atualização 0.2.18 — estado de sessão explícito

Cada linha agora tem uma bolinha de 3 pt à esquerda da última data. Ela é
verde/cinza apenas para o Ibovespa quando a sessão prevista da B3 está aberta
ou fechada segundo o horário oficial e o calendário de 2026. Essa bolinha não
afirma que a cotação da fonte está fresca ou que a rede está conectada. Selic,
IPCA, CUB-GO, Diesel S10, Brent, Soja GO e Dólar permanecem com ponto neutro,
pois os contratos usados pelo widget são periódicos, diários ou não informam
uma sessão de negociação aplicável. O significado completo também aparece no
rótulo de acessibilidade. Não há inferência baseada em HTTP 200.

## Atualização 0.2.17 — feedback de toque por linha

O pequeno tem quatro áreas de toque independentes e o médio/grande oito. Cada área acompanha uma linha inteira de conteúdo — ícone, nome, valor, gráfico, variação e data — sem sobreposição. O `Button` plain do Scripting fornece o feedback nativo de pressionamento e chama `RefreshAssetsOnTap`, que mantém o refresh limitado/deduplicado sem abrir outro app. A URL geral do widget permanece para áreas fora das linhas. Ícones, alinhamentos, curvas, dados, ordem fixa e status de mercado permanecem inalterados. O efeito nativo não foi testado fisicamente no iPhone.

## Atualização 0.2.16 — refresh limitado no toque

O toque do widget pequeno 2×2 e dos demais tamanhos compartilha consultas concorrentes, aguarda até 1,5 s antes de abrir o Mercado no Meu Painel e solicita uma recarga após sucesso, falha ou timeout. Um resultado preparado é reutilizado por 5 s; uma resposta tardia não substitui o modelo persistido nem dispara outra recarga. O destino de navegação, o bloco interno centralizado no ícone, a ordem fixa, os dados, as fontes e as dimensões permanecem inalterados.

A bolinha verde/cinza não foi adicionada: os contratos atuais não informam estado confiável de sessão para todos os indicadores. O produto mantém esse estado desconhecido, sem inferir mercado aberto por HTTP 200, relógio ou calendário incompleto. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.15 — bloco interno agrupado

O conteúdo interno de cada ativo volta à disposição da 0.2.13 e passa a ser um único bloco: nome/valor, gráfico/variação e código/data. A caixa total de 36 pontos é centralizada no ícone; as linhas internas não são redistribuídas. A 0.2.14 permanece no histórico Git como referência recuperável. Ícones, fontes, cores, divisórias, alturas externas, ordem fixa, dados e fontes permanecem inalterados. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.14 — alinhamento interno medido

Dentro de cada ativo, a caixa reservada da linha 2 é a referência: gráfico e variação têm o mesmo centro vertical do ícone; nome e valor compartilham o topo acima dela; código e última apuração compartilham a base abaixo dela. Ícones, alturas de linha, fontes, cores, divisórias, ordem fixa, dados e fontes permanecem inalterados. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.13 — ordem fixa também no widget pequeno

O widget pequeno agora ignora seleções e páginas persistidas de versões anteriores e mostra sempre `Selic, IPCA, Ibovespa, Dólar`. Médio e grande mantêm os oito na sequência `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`. Preferências antigas continuam importáveis sem alterar essa ordem; fontes ausentes conservam seu slot. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.12 — refresh limitado antes da navegação

O toque dá ao refresh uma oportunidade limitada de até 1,8 s antes de abrir o Mercado no Meu Painel. Em sucesso, o resultado é persistido, a recarga é solicitada e só então ocorre a navegação; em rejeição/offline, o cache é preservado, recarregado e a navegação ocorre uma vez. Se a rede exceder o limite, o widget recarrega o cache disponível e navega sem prometer que a coleta terminará depois da troca de app. O timer é limpo e não há loop. O iOS continua decidindo quando o widget renderiza a solicitação; isso não é uma promessa de atualização instantânea. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.11 — ordem fixa e toque com refresh

Os oito indicadores aparecem em ordem fixa: Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10 e Brent. Uma fonte ausente conserva sua posição com a reserva sem cotação; não há ordenação por variação. Tocar qualquer área do widget solicita uma nova coleta e uma recarga pelo AppIntent e, sem esperar a rede, abre `Meu Painel` na seção `Mercado`. A coleta concluída persiste os dados antes de pedir a recarga; como a abertura é imediata, o iOS pode suspender o AppIntent depois da troca de app, portanto a conclusão antes da navegação não é garantida. Cache e navegação permanecem disponíveis offline. A apresentação nativa no iPhone ainda não foi testada.

## Atualização 0.2.10 — toque para Meu Painel

Tocar na área de ativos abre `Meu Painel` diretamente na seção `Mercado`, usando o esquema oficial do Scripting (`scripting://run/Meu%20Painel?section=market`). O painel precisa estar instalado; o widget não tenta instalar, detectar ou reabrir em loop. O botão explícito **Consultar indicadores** continua sendo o caminho para coleta/refresh, e a seleção de ativos e os dados compartilhados permanecem intactos. A apresentação nativa no iPhone ainda não foi testada.

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

**Atual: 0.2.21 — Scripting Pro.** Detalhes, ordem fixa dos oito indicadores, CSV,
alertas, assistente, Central de Controle e painel Início. Consulta solicitada em
1 minuto e links diretos às fontes. [Ativação, testes e limites](PRO.md).

Widget econômico para o aplicativo Scripting, com acesso público e sem token de GitHub no aplicativo.

## Importação remota

Na tela **Importar Scripts Remotos** do Scripting, cole:

```text
https://github.com/Sagittaryuz/popular-scripting/tree/main/scripts/Popular%20Scripting
```

Importe **Popular Scripting**, confirme a versão **0.2.21**, abra o projeto e toque em **Atualizar**. Adicione o widget do Scripting à Tela de Início e selecione esse projeto.

Para receber melhorias de código, use a atualização do script remoto no Scripting. Essa importação vincula o projeto à pasta `main/scripts/Popular Scripting`; não use um endereço de commit ou tag para acompanhar as próximas versões. O botão **Atualizar** dentro da tela do Popular consulta somente os indicadores e solicita recarregar o widget.

## Tamanhos e dados

- Pequeno: quatro indicadores. Médio e grande: oito.
- Ordem fixa dos oito indicadores, fundo original, ícones e gráficos.
- Fontes: BCB, AgroLink, Investidor10, AwesomeAPI, FRED e referências públicas documentadas em `data/economic-series.json`.
- Dados econômicos de referência são consultados diretamente deste Git, sem autenticação. Rede indisponível ou resposta inválida preserva o cache validado ou a reserva versionada, com suas datas originais.
- O workflow `economic-data.yml` é programado a cada hora útil, 11h17–23h17 UTC, sujeito a atrasos do GitHub. Falha de uma fonte mantém a série anterior e é registrada no workflow; dados antigos não recebem data de observação nova.
- Política de atualização do widget: a partir de um minuto, configurável em 1/5/15, sujeita ao iOS.

Não são solicitadas permissões de Calendário, Lembretes ou Localização. O projeto não lê credenciais; ao executar a tela principal, tenta remover somente a credencial legada que uma edição anterior do próprio projeto tenha salvo. Não altera o GitHub configurado nas preferências gerais do Scripting nem revoga credenciais da conta GitHub.

## Validação e recuperação

A versão 0.2.21 mantém os meses nos extremos da curva, a composição nativa Text, Canvas transparente para ícones/curvas, as dimensões originais e a disposição interna recuperada da 0.2.13. O refresh por toque usa uma janela de 1.500 ms, deduplicação concorrente e um resultado preparado por 5 segundos; cada linha tem seu próprio feedback nativo sem navegação; a bolinha registra apenas a evidência recente da consulta daquele ativo, agora após o nome, nunca bolsa aberta.

A leitura dos preços AgroLink tem alternativa zlib em JavaScript, independente da descompressão nativa. A atualização manual permite até 20 segundos totais e 6 segundos por consulta AgroLink; o widget mantém 8 e 3 segundos. Falhas das fontes aparecem na tela após Atualizar, e o cache anterior é preservado com suas datas. O IPCA trata o cabeçalho da resposta SIDRA; o CUB trata letras separadas na extração de PDFs, mantendo a conferência de mês/padrão.

Testes locais cobrem os oito indicadores por HTTP, coletores de referência, descompressão com a ponte nativa desativada, entradas inválidas, cache, ordem fixa com fonte ausente, seleção persistida legada ignorada, bloco interno agrupado com nomes longos/valores negativos/datas ausentes, toque com refresh em sucesso/timeout/rejeição, deduplicação, cache preparado/expirado, marcadores inválidos, resposta tardia, quatro/oito hitboxes independentes, payload válido/HTTP-200 inválido, falha parcial, cache/arquivo, timeout e expiração da bolinha por ativo, colocação após o nome por HStack intrínseco, separação do valor e ausência de sobreposição, contrato de navegação e prévias simuladas. Esses testes não confirmam o comportamento da rede, do pressionamento nativo, dos intents e das fontes no iPhone; a versão 0.2.21 ainda exige essa conferência na Tela de Início.

O histórico Git e as releases preservam versões anteriores para recuperação. Antes de atualizar uma edição personalizada, preserve suas alterações locais. Os dados e preferências do projeto ficam no aparelho; não apague o projeto para atualizar.

## Manutenção

O código do widget fica em `scripts/Popular Scripting`. Cada melhoria deve atualizar `script.json` e `model.ts`, passar pelas verificações e ser publicada em `main`. Alterar apenas `data/economic-series.json` atualiza dados, sem mudar código ou versão do widget.

O script de coleta usa somente fontes públicas. Para verificar dados em Node 22: `node scripts/validate-data.cjs`. As dependências Python da coleta estão em `scripts/economic-requirements.txt`. Nenhuma dependência de teste é necessária no iPhone.

Canvas, Scripting e as fontes do sistema podem apresentar diferenças de métricas em relação ao Scriptable; não há alegação de fidelidade pixel a pixel. [Documentação do Scripting](https://scriptingapp.github.io/guide/Script/Script).
