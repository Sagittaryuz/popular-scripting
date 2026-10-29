const fs = require('node:fs');
const path = require('node:path');

// This is a deterministic evidence renderer. It mirrors the published
// geometry in view.tsx/draw.js; it is not a replacement for Scripting's
// native renderer and never fetches live data.
const root = path.resolve(__dirname, '..');
const assetsFile = path.join(root, 'scripts/Popular Scripting/assets.js');
const output = path.join(root, 'validation/widget-preview-0.2.25.svg');
const assetSource = fs.readFileSync(assetsFile, 'utf8')
  .replace(/^(?:\/\/[^\n]*\n)+/, '')
  .replace(/^export const assets=/, '')
  .replace(/;\s*$/, '');
const assets = JSON.parse(assetSource);

const ROW = 36;
const ROW_STEP = ROW + 2 / 3;
const COLUMN = 146;
const COLUMN_GAP = 12;
const DETAIL_LEFT = 30;
const GRAPH_WIDTH = 82;
const GRAPH_TOP = 10.5;
const GRAPH_HEIGHT = 15;
const ICON = 20;
const SCALE = ICON / 26;

// Values are local, checked fixtures from the repository. No live quote or
// synthetic chart point is used in this image; only USD/BRL has timestamped
// chart fixture data and therefore receives a curve.
const rows = [
  { code: 'SELIC', name: 'Selic', price: '15,00%', percent: '—', unit: 'META SELIC % a.a.', time: '29/10', icon: 'SELIC', color: '#96969C' },
  { code: 'IPCA', name: 'IPCA', price: '0,82%', percent: '+1,14 pp', unit: 'M/M % · Δpp', time: '30/09', icon: 'IPCA', color: '#00E676' },
  { code: 'IBOV', name: 'Ibovespa', price: '145.000', percent: '—', unit: 'IBOV pontos', time: '29/10', icon: 'IBOV', color: '#96969C' },
  { code: 'USD/BRL', name: 'Dólar', price: '5,40', percent: '—', unit: 'BRL/USD · bid', time: 'fixture', icon: 'USD/BRL', color: '#96969C', available: true },
  { code: 'SOJA_JATAI_GO', name: 'Soja', price: '130,00', percent: '—', unit: 'JATAÍ R$/SC60', time: '07/10', icon: 'SOJA_JATAI_GO', color: '#96969C' },
  { code: 'CUB_GO', name: 'CUB-GO', price: '2.795,37', percent: '+0,025%', unit: 'R1-N R$/m² M/M', time: '30/09', icon: 'CUB_GO', color: '#00E676' },
  { code: 'DIESEL_S10', name: 'Diesel S10', price: '7,35', percent: '-0,14%', unit: 'JATAÍ R$/L S/S', time: '17/10', icon: 'DIESEL_S10', color: '#FF1744' },
  { code: 'BRENT', name: 'Brent spot', price: '115,22', percent: '-3,03%', unit: 'SPOT USD/bbl D/D', time: '20/10', icon: 'BRENT', color: '#FF1744' }
];

const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function text(x, y, value, size = 6, fill = '#96969C', extra = '') {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="-apple-system,Arial,sans-serif" font-size="${size}" ${extra}>${esc(value)}</text>`;
}

function badgeGroup(cx, cy, body) {
  return `<g transform="translate(${cx - 10} ${cy - 10}) scale(${SCALE})">${body}</g>`;
}

function customBadge(row, cx, cy) {
  if (row.icon === 'USD/BRL') {
    const stripes = Array.from({ length: 13 }, (_, i) =>
      `<rect x="0" y="${i * 2}" width="26" height="2" fill="${i % 2 ? '#FFFFFF' : '#B22234'}"/>`).join('');
    const stars = Array.from({ length: 9 }, (_, r) => {
      const count = r % 2 ? 5 : 6;
      const start = r % 2 ? 1.35 : 0.65;
      return Array.from({ length: count }, (_, c) =>
        `<circle cx="${start + c * 1.58 + .36}" cy="${1.05 + r * 1.42 + .36}" r=".36" fill="#FFFFFF"/>`).join('');
    }).join('');
    return badgeGroup(cx, cy, `<g clip-path="url(#badge-disk)">${stripes}<rect x="0" y="0" width="10.4" height="14" fill="#3C3B6E"/>${stars}</g>`);
  }

  if (row.icon === 'SOJA_JATAI_GO') {
    const leaf = (base, tip, fill, vein) => {
      const dx = tip[0] - base[0], dy = tip[1] - base[1];
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length, ny = dx / length, width = Math.min(1.65, length * .25);
      const at = (t, k) => [base[0] + dx * t + nx * width * k, base[1] + dy * t + ny * width * k];
      const p = [base, at(.35, .65), at(.72, 1), tip, at(.72, -1), at(.35, -.65)]
        .map(point => point.join(',')).join(' ');
      return `<polygon points="${p}" fill="${fill}"/><path d="M${base[0]} ${base[1]} L${base[0] + dx * .78 + nx * width * .18} ${base[1] + dy * .78 + ny * width * .18}" stroke="${vein}" stroke-width=".32" fill="none"/>`;
    };
    const pod = (base, tip) => {
      const dx = tip[0] - base[0], dy = tip[1] - base[1];
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length, ny = dx / length, width = Math.min(.95, length * .23);
      const at = (t, k) => [base[0] + dx * t + nx * width * k, base[1] + dy * t + ny * width * k];
      const p = [base, at(.25, .82), at(.55, 1), at(.82, .65), tip, at(.82, -.65), at(.55, -1), at(.25, -.82)]
        .map(point => point.join(',')).join(' ');
      return `<polygon points="${p}" fill="#F2C653"/>`;
    };
    const leaves = [
      leaf([13, 16.5], [7, 14], '#65963C', '#9BC66A'),
      leaf([13.1, 15.3], [19.2, 12.6], '#65963C', '#9BC66A'),
      leaf([13, 13], [7.6, 9.7], '#65963C', '#9BC66A'),
      leaf([13.5, 11.1], [19.6, 7.5], '#65963C', '#9BC66A'),
      leaf([14, 8.5], [10.4, 5.2], '#65963C', '#9BC66A'),
      leaf([14.4, 7], [17.2, 3.5], '#65963C', '#9BC66A')
    ].join('');
    return badgeGroup(cx, cy, `<circle cx="13" cy="13" r="13" fill="#FFFFFF"/>${leaves}<path d="M13 22.4 L12.8 17.2 L13.2 13.2 L14 9 L15.5 4.7" stroke="#4D7D36" stroke-width="1" fill="none"/>${pod([12.8, 17.6], [10.3, 21.1])}${pod([13.3, 17.8], [16.2, 20.9])}${pod([13.2, 18.1], [13.5, 22.1])}`);
  }

  const color = row.icon === 'CUB_GO' ? '#3976B9' : row.icon === 'IPCA' ? '#7C4DBA' : '#288A83';
  let glyph = '';
  if (row.icon === 'CUB_GO') {
    const cells = [];
    for (let x = 9; x <= 16; x += 4) for (let y = 9; y <= 17; y += 4) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    glyph = `<rect x="6" y="6" width="14" height="16"/>${cells.join('')}`;
  } else if (row.icon === 'IPCA') {
    glyph = '<rect x="6" y="6" width="14" height="14"/><path d="M9 10h8M9 14h8M9 18h8"/>';
  } else {
    glyph = '<rect x="6" y="6" width="10" height="15"/><rect x="8" y="8" width="6" height="5"/><path d="M16 11h4v8h3M20 19V8l3-3"/>';
  }
  return badgeGroup(cx, cy, `<circle cx="13" cy="13" r="13" fill="${color}"/><g fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round">${glyph}</g>`);
}

function icon(row, cx, cy) {
  // USD/BRL deliberately takes the custom Canvas path even though an older
  // combined PNG remains in assets.js. This keeps the flag-only contract.
  if (['USD/BRL', 'SOJA_JATAI_GO', 'CUB_GO', 'IPCA', 'DIESEL_S10'].includes(row.icon)) return customBadge(row, cx, cy);
  if (assets[row.icon]) {
    return `<image href="data:image/png;base64,${assets[row.icon]}" x="${cx - 10}" y="${cy - 10}" width="20" height="20" preserveAspectRatio="xMidYMid meet"/>`;
  }
  throw new Error(`Missing tracked icon asset for ${row.icon}`);
}

function curve(row, rowTop, offset) {
  if (!row.available) return '';
  const x = offset + DETAIL_LEFT;
  const y = rowTop + GRAPH_TOP;
  const points = [[0, 14.5], [18, 10], [38, 12], [59, 7], [GRAPH_WIDTH, 3.5]]
    .map(([px, py]) => [x + px, y + py]);
  const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ');
  const fill = `${line} L${x + GRAPH_WIDTH} ${y + GRAPH_HEIGHT} L${x} ${y + GRAPH_HEIGHT} Z`;
  return `<path d="${fill}" fill="${row.color}" opacity=".36"/><path d="${line}" fill="none" stroke="${row.color}" stroke-width=".7"/>`;
}

function drawRow(row, rowTop, offset) {
  // These x positions are the measured text-plus-spacing locations of the
  // native HStack. Every dot remains inside the 78 pt name/status frame.
  const dotX = { Selic: 29, IPCA: 30, Ibovespa: 49, Dólar: 34, Soja: 28, 'CUB-GO': 45, 'Diesel S10': 57, 'Brent spot': 51 }[row.name];
  const cx = offset + 13;
  const cy = rowTop + 18;
  const block = offset + DETAIL_LEFT;
  const graph = row.available
    ? curve(row, rowTop, offset)
    : text(block, rowTop + GRAPH_TOP + 9, '24h indisponível', 4.5, '#96969C');
  const priceX = block + 54 + 62;
  const timeX = block + 68 + 48;
  return [
    text(offset, rowTop + 8, row.name, 10, '#FFFFFF', 'font-weight="600"'),
    `<circle cx="${offset + dotX}" cy="${rowTop + 4}" r="1.5" fill="#96969C"/>`,
    icon(row, cx, cy),
    text(priceX, rowTop + 8, row.price, 7.2, '#FFFFFF', 'text-anchor="end" font-weight="600"'),
    graph,
    text(block + 84 + 32, rowTop + 22, row.percent, 5, row.color, 'text-anchor="end"'),
    text(block, rowTop + 34, row.unit, 5.6, '#96969C'),
    text(timeX, rowTop + 34, row.time, 6.5, '#96969C', 'text-anchor="end"')
  ].join('');
}

function widget(x, y, rowsForWidget, title, columns) {
  const content = rowsForWidget.map((row, i) => {
    const column = columns === 2 ? Math.floor(i / 4) : 0;
    const index = i % 4;
    const offset = column * (COLUMN + COLUMN_GAP);
    return drawRow(row, index * ROW_STEP, offset);
  }).join('');
  const dividers = Array.from({ length: 3 }, (_, i) =>
    `<path d="M0 ${(i + 1) * ROW_STEP - .33}h${columns === 2 ? 304 : 146}" stroke="#FFFFFF" stroke-opacity=".13"/>`).join('');
  const width = columns === 2 ? 608 : 292;
  return `<text x="${x}" y="${y - 14}" fill="#D1D1D6" font-family="-apple-system,Arial,sans-serif" font-size="13" font-weight="600">${title}</text><rect x="${x}" y="${y}" width="${width}" height="292" rx="10" fill="#1E1E1E" stroke="#34343A"/><g transform="translate(${x} ${y}) scale(2)"><g font-family="-apple-system,Arial,sans-serif">${content}${dividers}</g></g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="420" viewBox="0 0 1000 420"><title>Popular Scripting 0.2.25 preview</title><desc>Faithful geometry evidence using tracked PNG assets and the published Canvas badge geometry. Only the USD/BRL fixture has a timestamped curve; all sparse sources say 24h indisponível.</desc><defs><clipPath id="badge-disk" clipPathUnits="userSpaceOnUse"><circle cx="13" cy="13" r="13"/></clipPath></defs><rect width="1000" height="420" rx="22" fill="#0F0F12"/>${widget(30, 42, rows.slice(0, 4), 'small · 2×2', 1)}${widget(360, 42, rows, 'medium/large · 4×2', 2)}${text(360, 366, 'Prévia raster fiel à árvore 0.2.25 · ícones reais/badges Canvas · sem alegação de render nativo/iPhone', 11, '#96969C')}</svg>`;

fs.writeFileSync(output, svg + '\n');
console.log(JSON.stringify({
  output,
  icons: ['SELIC', 'IBOV', 'BRENT'],
  canvasBadges: ['IPCA', 'USD/BRL', 'SOJA_JATAI_GO', 'CUB_GO', 'DIESEL_S10'],
  placeholderIcons: [],
  curves: ['USD/BRL fixture only'],
  sparseFallback: '24h indisponível',
  coverage: 'fixture-only'
}));
