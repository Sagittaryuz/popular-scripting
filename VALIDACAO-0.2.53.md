# Popular Scripting 0.2.53 — cápsulas das cotações

## Pedido e escopo

Adicionar uma cápsula atrás dos números, com metade da altura dos ícones, alinhada ao topo deles, cor igual ao gráfico respectivo e largura uniforme. Implementação no destino existente `Sagittaryuz/popular-scripting`, pasta `main/scripts/Popular Scripting`, sobre a .52 (`bf3c288`).

A cápsula envolve a cotação principal; o percentual permanece separado abaixo. Não há alteração nos dados, preços, percentual, nomes, ícones, curvas, fontes de mercado, cache ou logs privados. O motor `2026.11.11.101`, transporte e backend da .52 são preservados byte a byte. A única alteração em `model.ts` é a versão do aplicativo.

## Resultado verificável

- Geometria comum: largura 36 pt, altura 13 pt (metade do ícone de 26 pt), topo 5 pt (igual ao ícone). Em widgets menores todos os elementos escalam juntos, sem esticar círculos nem cápsulas.
- Preenchimento exato da curva: `#00E676` para alta, `#FF1744` para baixa e `#96969C` para movimento zero/ausente. A cápsula usa primitivas Canvas já presentes no projeto.
- Texto escuro `#171719`, em negrito e centralizado. Contraste mínimo verificado de 4,5:1 nos três fundos. Fonte máxima 10,5 pt com ajuste nativo à largura e margens internas de 2 pt; o tamanho foi limitado para caber na altura de 13 pt solicitada.
- Todos os valores apresentados continuam completos, sem substituir ou arredondar números para caber. A largura da cápsula independe do tamanho do texto. Variação permanece abaixo e gráfico não é coberto.

## Verificações concluídas

- `npm run check`: sintaxe/imports de 18 módulos TS/TSX.
- `npm test`: suíte completa, incluindo modelo/transporte, relógio da fonte, cache, intenções de toque, diagnóstico privado e regressões SQLite/econômicas do Worker.
- Novo `test-price-capsule.cjs`: alta/baixa/neutro/ausência, quatro e oito linhas, cinco dimensões, mesma largura/topo, proporção 1:2, extremidades circulares, ordem do desenho, contraste, margens e ausência de sobreposição.
- Testes de alinhamento, toque, ícone e perfil ajustados somente nas expectativas afetadas por cápsula/fonte/versão. Evidência visual atualizada para .53.
- Prévia executa modelo/host/JSX/Canvas de produção com respostas reais já capturadas, sem consultas novas nem alteração dos feeds. Revisão visual independente dos quatro PNGs encontrou preços completos e nenhuma colisão ou corte visível.
- [Pequeno](validation/market-profile-0.2.53-small.png), [médio](validation/market-profile-0.2.53-medium.png), [grande](validation/market-profile-0.2.53-large.png), [preview do app](validation/market-profile-0.2.53-preview.png), [medidas](validation/market-profile-0.2.53-preview.json).

## Orientação de teste validada

A suíte revelou uma falha temporal preexistente no teste do relógio: o primeiro harness usava `Date.now()` real na apresentação de uma fixture das 12:08, que passou a receber marca de dado antigo após 90 minutos. O segundo harness já congelava o relógio. Ambos agora usam a mesma `ClockDate` sintética. O motor não foi alterado, a expectativa não foi relaxada e o teste volta a reproduzir a diferença de relógio original de forma determinística.

## Limites e instalação

As imagens são simulações Linux Skia com métricas de texto aproximadas, não capturas do iPhone. Tipografia e toque nativos ainda não foram homologados. As cotações das prévias são históricas, não valores ao vivo.

Atualizar o vínculo remoto do **Popular Scripting para 0.2.53 / motor 2026.11.11.101**. Não apagar projeto ou cache. O botão Atualizar dentro do Popular consulta dados; não instala o código novo. Esta revisão não muda a implantação do receptor de logs nem comprova envio nativo de diagnóstico.
