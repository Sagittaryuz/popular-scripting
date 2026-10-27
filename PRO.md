## 0.2.16 — refresh do widget no toque

O toque no widget pequeno e nos demais tamanhos compartilha uma consulta já em andamento, aguarda até 1.500 ms e pede uma recarga antes de abrir o Mercado no Meu Painel. O modelo preparado é reutilizado por 5 segundos; rejeição/offline conserva o cache. Um resultado que chega depois do timeout não grava o modelo nem gera uma segunda recarga. O layout aprovado, bloco centralizado no ícone, ordem fixa, fontes e dados não mudam.

A bolinha de estado foi deliberadamente adiada: o contrato atual não diferencia de forma defensável mercado aberto, fechado ou desconhecido para todos os oito indicadores. Não é usado HTTP 200, horário local ou calendário parcial para fabricar esse estado; iPhone nativo não testado.

## 0.2.15 — bloco interno agrupado

Cada ativo preserva a disposição de linhas da 0.2.13 dentro de um super-elemento de 36 pontos. A caixa total do bloco compartilha o centro vertical do ícone; gráfico e variação não são centralizados independentemente. Ícones, fontes, cores, divisórias, alturas externas, ordem fixa e dados permanecem inalterados. A validação cobre small/medium/large, quatro/oito linhas, nomes longos, valores negativos e ausência de data; iPhone nativo não testado.

## 0.2.14 — alinhamento interno dos ativos

O ícone mantém sua posição e diâmetro. A caixa da linha 2 é a referência: gráfico e variação são centralizados nela e no ícone; nome/valor ficam alinhados pelo topo da linha 1; código/data ficam alinhados pela base da linha 3. As alturas, fontes, cores, divisórias, ordem fixa, dados e fontes API permanecem iguais. A validação desktop cobre os três tamanhos e casos de texto/valor/data extremos; iPhone nativo não foi testado.

## 0.2.13 — ordem fixa no pequeno

O pequeno não usa mais `popular-small-codes` nem páginas persistidas: sua página é sempre `Selic, IPCA, Ibovespa, Dólar`. Médio e grande usam os oito indicadores na ordem fixa, incluindo Soja GO, CUB-GO, Diesel S10 e Brent. Preferências antigas não são apagadas, mas deixam de controlar a ordem; a tela não oferece uma seleção que contradiga a regra. Slots sem fonte permanecem visíveis. O projeto existente deve ser atualizado pelo endereço `https://github.com/Sagittaryuz/popular-scripting/tree/main/scripts/Popular%20Scripting`, sem reimportar uma cópia em outro caminho. iPhone nativo não testado.

## 0.2.12 — refresh limitado antes do Mercado

O toque de tela inteira ligado a `RefreshAndOpenMarket` aguarda a atualização por até 1,8 s. Se a consulta termina, a persistência e a solicitação de recarga vêm antes de uma única abertura de `Meu Painel`/`Mercado`; se a fonte rejeita ou está offline, o cache é preservado e recarregado. Quando o limite vence, a recarga do cache é solicitada e a navegação continua, sem afirmar que a rede terminará depois que o iOS trocar de app. O timer é limpo e não há repetição. A recarga de timeline do iOS não é renderização instantânea. iPhone nativo não foi testado.

## 0.2.11 — ordem fixa e toque com atualização

Oito indicadores seguem `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`; ausência conserva o slot com reserva sem cotação e não há ranking por variação. O toque no widget solicita a coleta/renderização e abre o Mercado no Meu Painel pelo URI existente, sem aguardar rede, instalar o painel ou repetir a abertura. O iOS pode adiar a execução; cache e dados reais são preservados. iPhone nativo não testado.

## Mudança 0.2.7

A homepage é agora um projeto independente em Sagittaryuz/scripting-home. Referências à homepage embutida abaixo são históricas. As funções dos widgets e sua aparência foram preservadas.

## Atualização 0.2.6 — páginas e ativos adicionais

Toque no conteúdo para avançar à próxima página, com retorno à primeira depois da última. Pequeno: 4 por página; médio/grande: 8. O trapézio continua acionando exclusivamente consulta e recarga global. Os links de cada linha saem do widget para dar lugar à paginação; fontes seguem disponíveis nos detalhes do projeto.

Os oito indicadores atuais vêm primeiro; até oito ativos adicionais são obtidos do catálogo público do Investidor10, distribuídos entre ações, FIIs, ETFs, stocks, BDRs e cripto conforme disponibilidade. Reutiliza parser/cache/validação de cotações já existentes. Adicionais sem preço positivo ou sem data são excluídos. Ordenação do bloco original preservada; extras não são apresentados como ranking comparável aos indicadores econômicos.

Página é persistida por família, preservada ao atualizar e compartilhada entre instâncias da mesma família. A troca usa dados em cache por até 15 segundos para não consultar todas as fontes a cada toque. Consulta automática/manual continua atualizando observações; páginas não alteram datas. Falha no catálogo preserva extras antigos identificados como cache.

Consulta desktop real em 24/10/2026: sete adicionais datados (PETR4, KNCR11, IVVB11, NVDC34, BTC, ITUB4, ISNT11), incluindo a mesma allowlist do host. NVDA retornou sem cotação datada utilizável e foi excluída. Cotação datada publicada não equivale a confirmação de negociação em tempo real. Disponibilidade e composição podem mudar.

Testes locais: páginas sem repetição, retorno ao início, preferência do pequeno, isolamento por tamanho, intenção sem rede, cache sem renovar data e separação do trapézio. Compilação/toque/renderização físicos desta versão ainda pendentes.

## Atualização 0.2.5 — centralização e texto do rodapé

Data/hora deslocada 2 pontos para baixo: centro vertical da área pintada de 17 pontos (trapézio de 13 + base de 4). Texto passa de 8,5 para 9,5 pontos; forma, gradiente, largura e altura do trapézio preservados. A área de toque acompanha o rodapé inteiro central.

Conteúdo centralizado entre o topo do widget e o topo da faixa pintada, com margens superior/inferior iguais. No tamanho grande, o título e a nota de rodapé participam dos limites usados na centralização.

Atualização global mantém Widget.reloadAll(). Testes locais de consulta/cache, chamada global, formato/fuso, centro do texto, margens iguais, links e dimensões aprovados. Não existe recibo remoto que comprove a simultaneidade do toque nos três widgets físicos. Codex usa horário da coleta publicada; Popular, horário da consulta, preservando observações por indicador.

## Atualização 0.2.4 — espaço recuperado e recarga global

Reserva inferior reduzida de 36 para 23 pontos: devolve 13 pontos ao conteúdo. Trapézio mantém altura 13 e cantos curvos; os 4 pontos abaixo dele, até a borda inferior e nas laterais, usam a continuação do mesmo gradiente. Não pinta a faixa toda acima dessa base.

O botão consulta os dados deste projeto e, em seguida, usa Widget.reloadAll() para solicitar a recarga de todos os widgets criados no Scripting (usuário/desenvolvimento), incluindo Calendar. Botões da Central de Controle também mantêm sua recarga existente. A solicitação não impõe execução imediata ao iOS e não invalida caches de outros scripts; cada projeto conserva seu próprio comportamento de consulta. Calendar 0.3.10 remove apenas o ícone de refresh visível, mantendo navegação e caminho de atualização por intenção/atalho.

Data/hora local preservada: Codex indica coleta publicada; Popular indica consulta às fontes. Sem recibo remoto do toque/visual destes dois widgets. Testes locais comprovam chamada global real do helper em vez da API restrita a widgets de usuário, atualização/cache em sucesso e falha, base/gradiente contínuo e redistribuição. Renderização/toque simultâneo em todos os widgets no aparelho ainda pendentes.

## Atualização 0.2.3 — rodapé discreto com gradiente

Trapézio com 13 pontos de altura (antes 26), quatro cantos suavizados com curvas quadráticas, gradiente vermelho #9B2B37 → #521720 e texto cinza-claro menor. Mantém a reserva inferior de 36 pontos e o mesmo botão de atualização. Gradiente desenhado em faixas explícitas sob recorte curvo, sem depender de objetos de gradiente do host.

A data/hora é local: testado UTC 12:05 → 09:05h | 24/10 em America/Sao_Paulo. Codex indica a coleta publicada e conserva sua data ao usar cache; Popular indica consulta, sem substituir as datas reais dos indicadores. Não há recibo remoto do toque nesses dois projetos. A execução no aparelho e o horário visível no dispositivo ainda não foram confirmados remotamente.

Testes locais: consulta forçada por AppIntent, cache/recarga, sucesso/falha, geometria em quatro tamanhos, curvas/gradiente, fuso, formato e data inválida. No Codex, integração da intenção com o repositório e armazenamento reais do projeto, usando transporte nativo simulado. Prévia Canvas local; visual nativo pendente.

## Atualização 0.2.2 — trapézio de atualização

Rodapé centralizado em trapézio, topo mais estreito que a base, fundo vermelho #B3262E e texto cinza-claro #D1D1D6. Mostra HH:MMh | DD/MM e o símbolo de atualizar. Toda a faixa aciona o mesmo AppIntent. Margem inferior reservada de 36 pontos (antes 24); composição, fontes de dados, cores do conteúdo e links preservados, com ajuste de altura para caber nos tamanhos fixos do iOS. Não altera o Calendar.

O horário usa o fuso local do aparelho e representa a consulta das fontes, model.queriedAt; não substitui as datas das cotações mostradas nas linhas. Não usa a hora de renderização para fingir dados novos. Não há data fixa no produto.

Validação local: formato e virada do ano, data inválida, quatro dimensões, trapézio vermelho e texto cinza, botão sem sobreposição aos links/linhas, atualização e cache offline. Compilação/renderização/toque físicos desta versão ainda pendentes. Atualize o mesmo projeto pelo Git, preservando dados e permissões.

## Atualização 0.2.1 — botão de atualização

Botão pequeno de seta circular no canto inferior direito, usando AppIntent em segundo plano, sem solicitar abertura do app. O botão força nova consulta às fontes disponíveis, mantendo a periodicidade real dos indicadores. Os dados mantêm suas datas de observação; consultar não cria uma nova cotação.

Os widgets solicitam atualização após 1 minuto por padrão. O campo Parâmetro não altera a frequência. Codex/Popular permitem selecionar 1, 5 ou 15 minutos nas preferências do projeto. O iOS decide quando executar; a solicitação de 1 minuto não garante execução nesse intervalo. O botão pede dados atuais disponíveis e recarrega mesmo em falhas, preservando caches. Não altera o código instalado.

Testes locais de intenções, consulta forçada, sucesso/falha e geometria aprovados. Toque, renderização e execução nativa desta versão no iPhone/iPad ainda precisam de confirmação. Atualize o mesmo projeto pelo Git, preservando dados, permissões e pareamento.

# Popular Scripting 0.2.0

Atualize o mesmo projeto pelo vínculo `main/scripts/Popular Scripting`.
Preserva motor, ativos, cores e geometria. Não exclua o projeto para atualizar.

## Consulta e toques

Solicita atualização após 1 minuto, configurável em 1/5/15, e pede recarregar os
widgets de usuário nas ações. Consultas tentam renovar o cache conforme esse
intervalo, com orçamento de rede limitado. O iOS decide quando executar; APIs,
mercados e séries semanais/mensais mantêm sua própria periodicidade.
O workflow público consulta referências a cada hora útil, 11h17–23h17 UTC;
agendamento do GitHub pode atrasar. Dados não recebem observações artificiais.

Cada linha usa link HTTPS direto para a fonte. No pequeno, o iOS pode limitar os
destinos; o destino geral é a fonte do primeiro indicador. Não depende de Atalhos.
Configuração “Ao interagir” do host e os links independentes precisam de conferência
no aparelho. Para detalhes, abra o projeto no Scripting.

## Recursos

- Escolha dos quatro indicadores do pequeno; médio/grande preservam os oito.
- Detalhe por indicador, curva maior, período/unidade/fonte e link de origem.
- Exportação do histórico disponível em CSV, sem interpolar ou inventar dados.
- Alertas por cruzamento de valor: primeira observação vira base, dados velhos,
  futuros, inválidos ou regressivos não rearmam alertas; sem repetição contínua.
- Assistente recebe indicadores com datas/unidades/fontes após aprovação/toque.
  A explicação não inventa causas nem recomenda investimentos.
- Controle **Consultar indicadores**, painel Início compartilhando só contagens,
  importação/exportação JSON e pasta externa autorizada para exportações.

Alertas precisam ser configurados no app para habilitar notificações; depois são
avaliados quando o script executa, inclusive no widget. Não há serviço iOS contínuo
nem promessa de aviso imediato. IPCA/CUB e demais fontes conservam bases distintas.
IA usa modelo local quando disponível ou prepara conversa sem envio automático.

## Verificação e recuperação

Testes: regras/cruzamentos/rearme/deduplicação, datas, CSV, seleção de indicadores,
sintaxe e imports de todos os módulos, quatro séries reais validadas e 16 testes
Python de ingestão/recuperação. Fixture EIA tornou-se independente do snapshot vivo.
Não confirmados: rede, links, desenho, Home, permissões e recebimento no iPhone.
Home depende da versão instalada; documentação consultada no canal TestFlight.

Rollback: tag `v0.1.3`, preservando cache/preferências. Não altera código Scriptable.
Código e dados têm atualizações separadas. Git é fonte; Drive é backup privado.
