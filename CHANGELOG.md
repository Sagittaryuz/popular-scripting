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
