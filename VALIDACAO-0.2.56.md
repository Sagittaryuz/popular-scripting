# Popular Scripting 0.2.56

## 0.2.56 — Fundo acompanha a curva

A captura nativa de Marcos mostrou o fundo vermelho quase invisível no Brent. A opacidade anterior dependia da altura absoluta no quadro; curvas próximas à base recebiam quase zero alpha. Agora o degradê parte da própria curva, igual para verde/vermelho, sem unir lacunas. Áreas aninhadas evitam costuras subpixel. Dados, cache, logs, textos e cápsulas preservados.

## Verificação

- Raster positivo/negativo em curvas altas, médias e próximas à base, escalas 2x–4x: alpha igual, cor correta, sem preenchimento acima da curva, fade até a base.
- Preservação das lacunas entre sessões, ausência de legenda temporal, cápsulas e layout.
- Suíte completa e compilação de 18 módulos passaram; prévia small inspecionada.
- Imagem do usuário comprova o problema anterior; a correção foi validada em simulação Skia, não no iPhone.
