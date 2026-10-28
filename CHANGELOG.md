## 0.2.21 — ponto após o nome

- Move a bolinha de saúde da fonte, sem duplicá-la, para o fim do nome na primeira linha. O `HStack` nativo mede o texto intrínseco, mantém espaçamento de 2 pt e comprime/limita nomes longos dentro da coluna de 64 pt antes do valor.
- Preserva diâmetro de 3 pt, cores, semântica de consulta/frescor, acessibilidade, alinhamento do título/valor, linha 3, dados, fontes, curvas, refresh e dimensões. iPhone nativo continua não testado.

## 0.2.20 — saúde recente da consulta por ativo

- A bolinha de 3 pt agora fica verde somente quando a coleta atual registra um payload válido do provedor para aquele ativo, com `fetchedAt` válido e sem cache/fallback histórico (um snapshot Git verificado na consulta é aceito); falha, indisponibilidade, resposta inválida, fallback ou evidência expirada ficam cinza.
- O estado é persistido por linha junto da mesma observação, expira após cinco minutos e um timeout/falha global rebaixa o cache preservado. O resultado preparado de cinco segundos pode reutilizar a mesma evidência recente.
- Acessibilidade explica que o ponto representa evidência da fonte, não bolsa aberta. Refresh por linha, layout, fontes, dados, curvas, ordem e link do Meu Painel permanecem iguais. iPhone nativo continua não testado.

## 0.2.19 — neutralidade do estado do Ibovespa

- Mantém a bolinha de 3 pt na mesma posição, mas deixa todos os indicadores neutros até existir um contrato de sessão/publicação por ativo.
- O Ibovespa não usa mais o horário de ações ou o after-market como proxy: a B3 define o índice a partir dos ativos da carteira, mas as fontes verificadas não informam o estado atual de divulgação do próprio índice.
- Preserva refresh por linha, fontes, dados, curvas, ordem fixa, tamanhos e link do Meu Painel. Testes nativos no iPhone continuam pendentes.

## 0.2.18 — indicador de sessão honesto

- Adiciona uma bolinha de 3 pt imediatamente à esquerda da última data de cada linha, sem alterar a caixa, o ícone, o bloco de três linhas ou as alturas externas.
- Para o Ibovespa, verde/cinza representam somente a sessão prevista da B3 conforme o horário oficial e o calendário de 2026; o rótulo acessível deixa claro que isso não confirma o frescor da cotação nem a conectividade da fonte.
- Para Selic, IPCA, CUB-GO, Diesel S10, Brent, Soja GO e Dólar, o ponto é neutro: as fontes atuais são periódicas ou não publicam uma sessão aplicável ao ativo exibido. Não há verde/cinza inferido de HTTP 200, data de coleta ou preço.
- Preserva refresh por linha, fontes, dados, curvas, ordem fixa, tamanhos e link do Meu Painel. Testes nativos no iPhone continuam pendentes.

## 0.2.17 — feedback nativo por linha

- O widget pequeno expõe quatro botões independentes e os widgets médio/grande expõem oito, cada um cobrindo sua coluna/linha inteira de conteúdo sem sobreposição.
- Cada linha usa `Button` plain com `RefreshAssetsOnTap`: o Scripting/iOS fornece o estado nativo de pressionamento e o mesmo refresh limitado/deduplicado de 0.2.16, sem abrir outro app. A URL do widget e `RefreshAndOpenMarket` permanecem fora dessas áreas.
- Ícones, bloco de três linhas, gráficos, dados, ordem fixa, fontes, dimensões e indicador de mercado não foram alterados. O feedback de pressionamento nativo não foi testado fisicamente no iPhone.

## 0.2.16 — refresh limitado e deduplicado no toque

- O toque do widget mantém o destino existente `Meu Painel`/`Mercado`, mas agora compartilha consultas concorrentes, aguarda até 1.500 ms antes de navegar e solicita uma única recarga depois do resultado ou do cache preservado.
- Um resultado preparado é reutilizado por 5 segundos; falha/offline preserva o cache. Respostas que chegam depois do timeout não podem substituir o modelo persistido nem iniciar uma segunda recarga.
- Não foi adicionada bolinha de estado: as fontes atuais expõem observações periódicas/diárias, não um contrato confiável de sessão aberta por ativo. O estado permanece desconhecido, sem fabricar verde/cinza. Layout, bloco centralizado no ícone, ordem fixa, dados e tamanhos permanecem inalterados; iPhone nativo ainda não testado.

## 0.2.15 — bloco interno centralizado

- Recupera a disposição interna da 0.2.13 e agrupa nome/valor, gráfico/variação e código/data em um único bloco de 36 pontos.
- Centraliza somente a caixa total do bloco no centro do ícone; a linha 2 não é recentralizada e os dados, fontes, ordem, ícones, cores, divisórias e alturas externas permanecem iguais.
- Mantém a 0.2.14 no histórico como referência recuperável; iPhone nativo ainda não testado.

## 0.2.14 — 2026-10-27

- Alinha internamente cada ativo pela caixa da linha 2: gráfico e variação compartilham o centro do ícone; nome/valor usam o topo e código/data usam a base.
- Preserva ícones, alturas externas, fontes, cores, divisórias, dados, fontes API e ordem dos quatro/oito indicadores.
- Adiciona teste medido para small/medium/large, nomes longos, valores negativos e data ausente; iPhone nativo ainda não testado.

## 0.2.13 — 2026-10-27

- Corrige a entrega do widget pequeno: estado legado de `popular-small-codes` não pode substituir `Selic, IPCA, Ibovespa, Dólar`.
- Médio e grande preservam os oito indicadores em ordem fixa, com reservas para fontes ausentes; a tela de detalhes deixa de oferecer uma seleção conflitante.
- Atualização incremental pelo mesmo caminho `main/scripts/Popular Scripting`; iPhone nativo ainda não testado.

## 0.2.12 — 2026-10-27

- O toque no widget aguarda o refresh por até 1,8 s antes de abrir o Mercado no Meu Painel.
- Em sucesso, persiste o resultado e solicita a recarga antes da navegação; em rejeição/offline, preserva e recarrega o cache; em timeout, recarrega o cache sem prometer conclusão da rede após a troca de app.
- Garante uma navegação, limpa o timer e preserva a ordem fixa, dados, layout, fontes e correção CUB; iPhone nativo ainda não testado.

## 0.2.11 — 2026-10-27

- Fixa os oito indicadores em `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`; fontes ausentes mantêm seus slots sem valor inventado e os modos de ordenação por variação deixam de ser oferecidos.
- Todo toque no widget inicia a coleta via AppIntent, solicita `Widget.reloadAll()` ao terminar e abre `Meu Painel`/`Mercado` sem aguardar a rede; falhas offline preservam o cache e não criam loop.
- Preserva coletor, dados reais, seleção, layout, curvas, link de Mercado e correção CUB; iPhone nativo ainda não testado.

## 0.2.10 — 2026-10-26

- O toque na área de ativos abre `Meu Painel` na seção `Mercado` pelo helper oficial `Script.createRunURLScheme`.
- Remove a coleta/avanço implícitos desse toque; o `RefreshPopular` explícito, seleção, dados compartilhados e correção CUB permanecem.
- Sem instalação automática, detecção fictícia ou loop quando Meu Painel não está instalado; iPhone nativo ainda não testado.

## 0.2.9 — 2026-10-25

- Corrige a truncagem nativa da variação M/M do CUB-GO (`+0,025%`) ajustando apenas o piso de redução da fonte dentro da mesma reserva de 34 pt.
- Preserva IPCA (`+1,14 pp`), Diesel (`-0,14%`), Brent (`-3,03%`), sinais, unidades, preços, curvas, margens, fontes, paginação, toque e dados.
- Testes de sintaxe/contratos e prévias continuam simulações; iPhone nativo ainda não foi testado.

## 0.2.6 — 2026-10-24

- Toque no conteúdo avança páginas; rodapé continua atualizando.
- Até oito ativos adicionais do catálogo, com preço e data, além dos oito indicadores.
- Paginação usa cache e não altera datas de observação.
- Consulta desktop real e testes locais aprovados; toque nativo pendente.

## 0.2.5 — 2026-10-24

- Centraliza texto no rodapé estendido; fonte 9,5 sem mudar o trapézio.
- Equilibra margens superior/inferior do conteúdo.
- No tamanho grande, o título e a nota de rodapé participam dos limites usados na centralização.
- Recarga global preservada; testes locais aprovados, visual/toque nativos pendentes.

## 0.2.4 — 2026-10-24

- Pinta a base abaixo do trapézio com o gradiente contínuo até a borda.
- Devolve 13 pontos ao conteúdo (reserva de 23 pontos).
- Botão solicita recarga de todos os widgets Scripting via Widget.reloadAll().
- Testes locais aprovados; execução/visual globais no aparelho pendentes.

## 0.2.3 — 2026-10-24

- Rodapé com metade da altura, gradiente vermelho discreto e quatro cantos curvos.
- Validação de data/hora local e atualização com preservação do cache em falhas.
- Testes locais aprovados; renderização e toque no dispositivo pendentes.

## 0.2.2 — 2026-10-24

- Substitui botão circular por trapézio vermelho centralizado com data/hora e texto cinza-claro.
- Reserva inferior ampliada; mantém atualização por AppIntent e cache.
- Testes locais aprovados; visual nativo pendente.

## Popular Scripting 0.2.1 — 2026-10-24

- Botão de atualização por AppIntent no canto inferior direito, com cache preservado.
- O botão força nova consulta às fontes disponíveis, mantendo a periodicidade real dos indicadores. Os dados mantêm suas datas de observação; consultar não cria uma nova cotação.
- Testes locais aprovados; validação do toque nativo pendente.

# Histórico

## 0.2.0 — 23/10/2026

- Detalhes, curva maior, fontes, seleção de quatro indicadores e CSV.
- Alertas por cruzamento, assistente, controles, painel Início e preferências.
- Solicitação ao iOS em 1 minuto, opções 1/5/15, links diretos para fontes.
- Referências consultadas a cada hora útil; periodicidade das observações preservada.
- Fixture EIA isolada do snapshot vivo para testes reproduzíveis.
- Testes locais aprovados; rede, UI e notificações no iPhone não confirmadas.

Versões anteriores: README e tags `v0.1.1` a `v0.1.3`.
## 0.2.22 - alinhamento do nome com o gráfico

- Alinha pela esquerda o nome do ativo e seu indicador de consulta com a borda esquerda do gráfico em todos os tamanhos.
- Preserva largura da coluna, reserva de preço, fontes, dados, curvas e posições verticais.
- Teste estrutural mede a mesma borda esquerda em pequeno, médio e grande; renderização nativa no iPhone não foi testada.
