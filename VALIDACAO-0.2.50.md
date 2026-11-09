# Popular Scripting 0.2.50 — apresentação

## Pedido e preservação

O usuário confirmou o funcionamento dos indicadores/gráficos antes desta alteração. A versão muda apenas a apresentação pedida. O motor `2026.11.09.99` e o transporte são idênticos aos publicados na .49: fontes, valores, variações, timestamps, cache e cobertura de 24 horas cotadas não foram modificados.

## Resultado medido

- Colunas 28 / 44 / 32 / 36 pt, mantendo a largura útil de 146 pt. A coluna de preço cresce de 26 para 36 pt para evitar a redução excessiva dos valores.
- Nomes IBOVESPA, DOW JONES, DÓLAR e BRENT completos, em caixa alta e negrito. Fonte 6,6 pt, antes 5,5 pt: +20%.
- Preços efetivos medidos em medium/large: 9,14 / 11,10 / 14 / 11,38 pt, contra 6,60 / 8,02 / 10,54 / 8,22 pt na .49. Crescimento de aproximadamente 33–38%; fonte solicitada 14 pt, com ajuste à largura.
- Código/horário e variação usam a mesma fonte regular de 5,3 pt; small e preview aplicam a mesma escala, resultando em aproximadamente 5,15 pt.
- Quadros superiores de nomes/preços alinhados ao topo dos ícones, quadros inferiores de código/variação à base. Intervalo igual de 2 pt entre os quadros. Ícones e gráfico com altura de 26 pt, mantendo círculos em vez de alongar a geometria no large.
- BRENT é somente rótulo visual. Dados, detalhes e acessibilidade continuam identificando Brent futuro. Datas da curva, código, horário e variação permanecem completos.

## Verificações

- `npm run check`: sintaxe/imports dos 16 módulos.
- `npm test`: suíte completa, inclusive dados, alias, diagnóstico, cache, intenções de toque, navegação e geometria atualizada.
- Geometria e texto verificados em small 158×158, medium 338×170, large 338×360 e preview do app 332×158: quatro nomes/preços completos, sem reticências, sem colisões e sem texto fora do widget; círculos e limites verticais dos gráficos iguais.
- Renderer de verificação agora respeita negrito e alinhamento superior/inferior, registra limites da tinta e não impõe clipping que não existe no Text nativo. Ajuste iterativo evita truncamento artificial de fontes pequenas no Skia.
- [Prévia pequena](validation/market-profile-0.2.50-small.png), [média](validation/market-profile-0.2.50-medium.png), [grande](validation/market-profile-0.2.50-large.png), [preview do app](validation/market-profile-0.2.50-preview.png), [medidas](validation/market-profile-0.2.50-preview.json).

## Limites

As imagens executam modelo/host/JSX/Canvas de produção com respostas reais já capturadas, mas a fonte é simulada no Linux. Não são fotos do iPhone nem novas consultas de mercado. A confirmação anterior do usuário vale para os dados da .49, não para esta mudança visual ainda não testada no aparelho.

Alinhamento geométrico dos quadros não implica igualdade exata da tinta: UIFont/SwiftUI podem diferir. O intervalo visual entre letras depende das métricas e dos tamanhos distintos dos textos. Não houve compensação artificial de pixels nem mudança de preço para caber.

Atualizar o vínculo remoto do Popular Scripting para **0.2.50 / motor 2026.11.09.99**. O projeto/cache não devem ser apagados. Atualizar dentro do Popular consulta dados; não instala código novo.
