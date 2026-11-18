# Ready-made artwork selected by Marcos

Approval: “Ok. Implante elas”, replying to the comparison sheet of existing web images.

- IBOV: B3 corporate logo, https://logospng.org/logo-b3-brasil-bolsa-balcao/ ; original PNG https://logospng.org/download/b3/logo-b3-brasil-bolsa-balcao-4096.png . Wrapped losslessly in SVG for reproducible rendering. B3 brand rights remain with its owner; no blanket open-source trademark licence is asserted. Used as a referential identifier of the exchange, not an official Ibovespa logo or endorsement.
- DOW_JONES: original wordmark from the approved comparison, https://www.davemanuel.com/2014/06/22/dow-17000-likely-coming-this-week/ ; https://www.davemanuel.com/images/dow_jones_industrial_logo.jpg . Wrapped losslessly in SVG; only surrounding blank white margins are excluded from the fit. No blanket licence for the host photograph is asserted. Simple-text wordmarks are identified as PD-textlogo by Wikimedia for its separate vector counterpart (https://commons.wikimedia.org/wiki/File:Dow_Jones_logo.svg); trademark restrictions still apply. Used only as a referential identifier, not endorsement.
- BRENT: existing Oil Barrel icon, https://www.svgrepo.com/svg/219810/oil-barrel ; https://www.svgrepo.com/show/219810/oil-barrel.svg . Page identifies licence as CC0. Generic oil barrel, not an official Brent logo.
- USD/BRL: Google Material Icons `currency_exchange`, sharp variant, Apache 2.0. Original source https://github.com/google/material-design-icons/blob/master/src/action/currency_exchange/materialiconssharp/24px.svg . Full licence included in LICENSE-google.txt. Same ready-made design represented in the approved Rawpixel preview; replaces its JPEG checkerboard preview with the actual transparent SVG. Generic currency exchange, not a specific currency pair logo.

Renderer removes only transparent padding, uniformly fits the unchanged artwork on a white circular support for contrast on the dark widget, and adds no outline/border. Outer corners remain transparent. The strokes/brackets inside the original marks are part of the original artwork, not new borders.

Use `node scripts/generate-ready-made-icons.cjs`. Previous handmade generator is retained as historical source only; it is not the active artwork generator. No market-data or geometry changes.

## USD/BRL replacement, 2026-11-18

Marcos supplied and selected the split US/Brazil flag image, PNG RGBA 354x351. Preserved verbatim inside usd-brl-reference.svg (SHA256 d4d6b2f2775cd219170d00ece81bae7fe1a2a96928a1bc65659fc875519fefbe). Fitted proportionally into the 156px export with original transparency, no added background or border. Supersedes Google currency_exchange for USD/BRL only; other artwork remains unchanged. User-provided artwork, no additional blanket rights claimed.

## Dow Jones replacement, 2026-11-18

Marcos supplied the cyan square with a white Dow symbol. Original 600x600 PNG preserved losslessly in dow-user-reference.svg. The renderer uniformly scales it and masks only outer background corners to match the circular widget style. No added border/background, no logo modification. Supersedes previous Dow wordmark only. Other three icons unchanged. User-provided artwork; rights remain with their respective owners.

## Ibovespa replacement, 2026-11-18

Marcos supplied the blue square B3 symbol, PNG 600x600, preserved losslessly in ibov-user-reference.svg. Uniform scale and circular mask of background corners only, no border or new background. Combined with the Dow update before publication. USD/BRL and Brent remain byte-identical. B3 trademark remains with its owner; user-provided artwork.

## Brent replacement, 2026-11-18

Marcos supplied the grey oil barrel/yellow drop on a coral circle (980x980 PNG), preserved losslessly in brent-user-reference.svg. Renderer excludes only the 34px outside-circle pale margin, uniformly fits the 912x912 circle and masks the outer corners. Original barrel, colors and proportions retained, no added border. Other three icons are byte-identical. User-provided artwork, rights remain with their owners.
