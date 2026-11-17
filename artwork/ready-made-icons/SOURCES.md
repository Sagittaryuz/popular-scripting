# Ready-made artwork selected by Marcos

Approval: “Ok. Implante elas”, replying to the comparison sheet of existing web images.

- IBOV: B3 corporate logo, https://logospng.org/logo-b3-brasil-bolsa-balcao/ ; original PNG https://logospng.org/download/b3/logo-b3-brasil-bolsa-balcao-4096.png . Wrapped losslessly in SVG for reproducible rendering. B3 brand rights remain with its owner; no blanket open-source trademark licence is asserted. Used as a referential identifier of the exchange, not an official Ibovespa logo or endorsement.
- DOW_JONES: original wordmark from the approved comparison, https://www.davemanuel.com/2014/06/22/dow-17000-likely-coming-this-week/ ; https://www.davemanuel.com/images/dow_jones_industrial_logo.jpg . Wrapped losslessly in SVG; only surrounding blank white margins are excluded from the fit. No blanket licence for the host photograph is asserted. Simple-text wordmarks are identified as PD-textlogo by Wikimedia for its separate vector counterpart (https://commons.wikimedia.org/wiki/File:Dow_Jones_logo.svg); trademark restrictions still apply. Used only as a referential identifier, not endorsement.
- BRENT: existing Oil Barrel icon, https://www.svgrepo.com/svg/219810/oil-barrel ; https://www.svgrepo.com/show/219810/oil-barrel.svg . Page identifies licence as CC0. Generic oil barrel, not an official Brent logo.
- USD/BRL: Google Material Icons `currency_exchange`, sharp variant, Apache 2.0. Original source https://github.com/google/material-design-icons/blob/master/src/action/currency_exchange/materialiconssharp/24px.svg . Full licence included in LICENSE-google.txt. Same ready-made design represented in the approved Rawpixel preview; replaces its JPEG checkerboard preview with the actual transparent SVG. Generic currency exchange, not a specific currency pair logo.

Renderer removes only transparent padding, uniformly fits the unchanged artwork on a white circular support for contrast on the dark widget, and adds no outline/border. Outer corners remain transparent. The strokes/brackets inside the original marks are part of the original artwork, not new borders.

Use `node scripts/generate-ready-made-icons.cjs`. Previous handmade generator is retained as historical source only; it is not the active artwork generator. No market-data or geometry changes.
