# Popular Scripting — Pro 0.2.13

## 0.2.13 — ordem fixa do widget pequeno

O pequeno usa sempre os quatro primeiros resultados já ordenados pelo motor: `SELIC`, `IPCA`, `IBOV` e `USD/BRL`. `popular-small-codes`, páginas, exportações e preferências antigas não substituem mais essa ordem; os estados antigos são mantidos apenas como compatibilidade de dados, sem efeito visual. Médio e grande exibem os oito códigos fixos na sequência `SELIC`, `IPCA`, `IBOV`, `USD/BRL`, `SOJA_JATAI_GO`, `CUB_GO`, `DIESEL_S10`, `BRENT`. Slots de fonte indisponível permanecem reservados. O caminho remoto continua sendo `main/scripts/Popular Scripting`; atualizar o projeto existente é suficiente, sem criar cópia. iPhone nativo não testado.

## 0.2.12 — refresh limitado antes da navegação

`RefreshAndOpenMarket` aguarda até 1.800 ms pela consulta iniciada no toque. Quando a consulta termina, o modelo já persistido é seguido por `Widget.reloadAll()`/recarga dos controles e depois por uma única abertura de `Meu Painel`/`Mercado`. Rejeição ou offline conserva o cache e segue a mesma ordem. No timeout, o widget solicita a recarga do cache e abre o destino uma vez; a consulta pendente pode ser suspensa pelo iOS, portanto não há garantia de atualização de rede após a troca de app. O timer é limpo, não há retry/loop e o iOS ainda pode adiar o render da timeline. iPhone nativo não testado.

## 0.2.11 — ordem fixa e atualização no toque

Os oito indicadores do widget usam a sequência `Selic, IPCA, Ibovespa, Dólar, Soja GO, CUB-GO, Diesel S10, Brent`. O motor produz uma reserva explícita para qualquer fonte ausente, sem criar cotação, e a superfície Scripting não oferece mais ordenação por variação. O toque em qualquer área é um `Button` de tela inteira ligado ao AppIntent `RefreshAndOpenMarket`: a coleta começa, `Safari.openURL` solicita o URI existente do Meu Painel sem esperar a rede, e `Widget.reloadAll()` é pedido ao final. Quando o AppIntent continua vivo, a recarga vem depois da persistência; a conclusão da coleta antes da troca para outro app não é garantida pelo iOS. Não há instalação, fallback ou repetição; offline conserva cache. iPhone nativo não foi testado.

## 0.2.10 — toque Mercado no Meu Painel

O toque na área de ativos agora usa `Script.createRunURLScheme("Meu Painel", { section: "market" })`, equivalente a `scripting://run/Meu%20Painel?section=market`, para abrir a Home independente com Mercado em foco. A ação implícita anterior `NextPopularPage` não é mais chamada pelo widget; o botão explícito `RefreshPopular` continua consultando dados. Não há tentativa de instalar, detectar ou repetir a abertura quando o painel não existe, pois a API não oferece essa detecção. O motor, dados, seleção, paginação compatível, correção CUB 0.2.9 e arquivos de `scripting-home` permanecem fora do escopo.

## 0.2.9 — variação CUB sem reticências

O retorno do usuário isolou truncagem por espaço, não ausência de dado: o CUB-GO conserva três casas na variação publicada (`+0,025%`) e usa uma reserva nativa de 34 pt. A vista reduz somente o piso desse rótulo longo para 6,5 pt, preservando a geometria, alinhamento, curvas, fontes, paginação, atualização, Pro e os demais ajustes posteriores. IPCA, Diesel e Brent mantêm sinais, unidades e textos completos. Nenhum dado econômico ou arquivo da interface Scriptable foi alterado. O iPhone nativo não foi testado.

Fonte: `Sagittaryuz/popular-scripting`, `main`, `scripts/Popular Scripting`.
Preservar motor gerado, fontes, unidades, datas, geometria e versões anteriores.
TSX nativo, cache local, fontes públicas e GitHub Actions para referências.

Camada Pro independente do motor: seleção de quatro entre oito, detalhes,
CSV, alertas por cruzamento, ferramentas do assistente, controles e painel Home.
Pequeno coleta oito para que a escolha de quaisquer quatro tenha dados reais.
APIs e código no iPhone não recebem dependências npm; as novas dependências são
somente para validação no desktop. Não há backend/credencial/serviço pago novo.
Critérios e limites em `PLANS.md` e `PRO.md`.

Padrão: `Sagittaryuz/development-standards`, commit
`722279eb8ec4bac318f8fa2ad50ac34b128e90dc`, GIT-FIRST 1.0.1, WEBAPP-WORKFLOW 1.2.3.
Git é origem; Drive recebe backup privado com histórico recuperável.
