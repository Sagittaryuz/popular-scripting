const fs = require('node:fs');
const path = require('node:path');

// This is a deterministic evidence renderer. It mirrors the published
// geometry in view.tsx/draw.js; it is not a replacement for Scripting's
// native renderer and never fetches live data.
const root = path.resolve(__dirname, '..');
const assetsFile = path.join(root, 'scripts/Popular Scripting/assets.js');
const output = path.join(root, 'validation/widget-preview-0.2.30-local.svg');
const assetSource = fs.readFileSync(assetsFile, 'utf8')
  .replace(/^(?:\/\/[^\n]*\n)+/, '')
  .replace(/^export const assets=/, '')
  .replace(/;\s*$/, '');
const assets = JSON.parse(assetSource);

const ROW = 36;
const ROW_STEP = ROW + 2 / 3;
const COLUMN = 146;
const COLUMN_GAP = 12;
const COL_GAP = 2;
const COL1 = 28;
const COL2 = 40;
const COL3 = 46;
const COL4 = 26;
const COL1_X = 0;
const COL2_X = COL1 + COL_GAP;
const COL3_X = COL2_X + COL2 + COL_GAP;
const COL4_X = COL3_X + COL3 + COL_GAP;
const STATUS_DOT = 3;
const STATUS_SPACING = 8;
const STATUS_TRAILING_GAP = 2;
const NAME_TEXT_MAX = COL2 - STATUS_DOT - STATUS_SPACING - STATUS_TRAILING_GAP;
const GRAPH_WIDTH = COL3;
const GRAPH_TOP = 8;
const GRAPH_HEIGHT = 20;
const ICON = 26;
const ICON_LEFT = (COL1 - ICON) / 2;
const NAME_TOP = 9;
const NAME_HEIGHT = 8;
const META_TOP = 19;
const META_HEIGHT = 8;
const UNIT_TOP = 16.5;
const UNIT_HEIGHT = 3;
const LINE2_TOP = 20;
const SCALE = ICON / 26;
const SHORT_CODES = Object.freeze({BBAS3: 'BBAS3', BBDC4: 'BBDC4', IBOV: 'IBOV', 'BTC/USD': 'BTC/USD', SELIC: 'SELIC', IPCA: 'IPCA', 'USD/BRL': 'USD/BRL', SOJA_JATAI_GO: 'SOJAGO', CUB_GO: 'CUB-GO', DIESEL_S10: 'DIESEL', BRENT: 'BRENT'});

// Local-only fixture list requested for layout validation. It deliberately
// carries no price, variation, timestamp, or curve: BBAS3/BBDC4/IBOV remain
// unavailable in the authorized checkout, while the BTC/USD engine adapter is
// validated separately and does not inject a live quote into this preview.
const rows = [
  { code: 'BBAS3', name: 'Banco do Brasil', price: '—', percent: '—', unit: 'BRL/ação', time: 'sem amostra', icon: 'BBAS3', color: '#96969C', testFixture: true },
  { code: 'BBDC4', name: 'Bradesco PN', price: '—', percent: '—', unit: 'BRL/ação', time: 'sem amostra', icon: 'BBDC4', color: '#96969C', testFixture: true },
  { code: 'IBOV', name: 'Ibovespa', price: '—', percent: '—', unit: 'pontos', time: 'sem amostra', icon: 'IBOV', color: '#96969C', testFixture: true },
  { code: 'BTC/USD', name: 'Bitcoin', price: '—', percent: '—', unit: 'USD/BTC', time: 'sem amostra', icon: 'BTC/USD', color: '#96969C', testFixture: true }
];

const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function text(x, y, value, size = 6, fill = '#96969C', extra = '') {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="-apple-system,Arial,sans-serif" font-size="${size}" ${extra}>${esc(value)}</text>`;
}

function nameLayout(value) {
  const string = String(value ?? '—');
  const raw = [...string].reduce((sum, char) => sum + (/[MW@#]/.test(char) ? 6.2 : /[ilI1.,' ]/.test(char) ? 2.8 : 4.8), 0);
  const maximum = Math.max(5, NAME_TEXT_MAX);
  const size = Math.max(4.8, Math.min(9, 9 * maximum / Math.max(raw, 1)));
  return { size, width: Math.min(maximum, Math.max(5, raw * size / 9)) };
}

function badgeGroup(cx, cy, body) {
  return `<g transform="translate(${cx - 13} ${cy - 13}) scale(${SCALE})">${body}</g>`;
}

function customBadge(row, cx, cy) {
  if (['BBAS3', 'BBDC4', 'IBOV', 'BTC/USD'].includes(row.icon)) {
    const glyph = { BBAS3: 'BB', BBDC4: 'BD', IBOV: 'IB', 'BTC/USD': 'BTC' }[row.icon];
    const size = glyph.length === 3 ? 5.4 : 7;
    return badgeGroup(cx, cy, `<circle cx="13" cy="13" r="13" fill="#34343A"/><text x="13" y="15.5" fill="#FFFFFF" font-family="-apple-system,Arial,sans-serif" font-size="${size}" font-weight="700" text-anchor="middle">${glyph}</text>`);
  }
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
  if (['BBAS3', 'BBDC4', 'IBOV', 'BTC/USD', 'USD/BRL', 'SOJA_JATAI_GO', 'CUB_GO', 'IPCA', 'DIESEL_S10'].includes(row.icon)) return customBadge(row, cx, cy);
  if (assets[row.icon]) {
    return `<image href="data:image/png;base64,${assets[row.icon]}" x="${cx - ICON / 2}" y="${cy - ICON / 2}" width="${ICON}" height="${ICON}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  throw new Error(`Missing tracked icon asset for ${row.icon}`);
}

function curve(row, rowTop, offset) {
  if (!row.available) return '';
  const x = offset + COL3_X;
  const y = rowTop + GRAPH_TOP;
  const points = [[0, 14.5], [18, 10], [38, 12], [59, 7], [GRAPH_WIDTH, 3.5]]
    .map(([px, py]) => [x + px, y + py]);
  const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ');
  const fill = `${line} L${x + GRAPH_WIDTH} ${y + GRAPH_HEIGHT} L${x} ${y + GRAPH_HEIGHT} Z`;
  return `<path d="${fill}" fill="${row.color}" opacity=".36"/><path d="${line}" fill="none" stroke="${row.color}" stroke-width=".7"/>`;
}

function drawRow(row, rowTop, offset) {
  // The dot follows the measured/compressed name and remains inside the
  // identity cell instead of being pinned over the last glyph.
  const name = nameLayout(row.name);
  const dotX = offset + COL2_X + name.width + STATUS_SPACING + STATUS_DOT / 2;
  const cx = offset + ICON_LEFT + ICON / 2;
  const cy = rowTop + 18;
  const graphX = offset + COL3_X;
  const graph = row.available
    ? curve(row, rowTop, offset)
    : text(graphX + GRAPH_WIDTH / 2, rowTop + GRAPH_TOP + 12, '7d indisponível', 4.2, '#96969C', 'text-anchor="middle"');
  const quoteRight = offset + COL4_X + COL4;
  const meta = `${SHORT_CODES[row.code] || row.code} | ${row.time}`;
  const unit = { BBAS3: 'BRL/ação', BBDC4: 'BRL/ação', IBOV: 'pontos', 'BTC/USD': 'USD/BTC', SELIC: '% a.a.', IPCA: 'M/M · pp', 'USD/BRL': 'BRL/USD', SOJA_JATAI_GO: 'R$/sc60', CUB_GO: 'R$/m²', DIESEL_S10: 'R$/L', BRENT: 'USD/bbl' }[row.code] || row.unit;
  return [
    text(offset + COL2_X, rowTop + NAME_TOP + 7, row.name, name.size, '#FFFFFF', `font-weight="600" textLength="${name.width}" lengthAdjust="spacingAndGlyphs"`),
    `<circle cx="${dotX}" cy="${rowTop + NAME_TOP + NAME_HEIGHT / 2}" r="${STATUS_DOT / 2}" fill="#96969C"/>`,
    icon(row, cx, cy),
    text(offset + COL2_X, rowTop + META_TOP + 6, meta, 5.3, '#96969C'),
    text(quoteRight, rowTop + 15, row.price, 6.8, '#FFFFFF', 'text-anchor="end" font-weight="600"'),
    graph,
    text(quoteRight, rowTop + UNIT_TOP + UNIT_HEIGHT, unit, 3.4, '#96969C', 'text-anchor="end"'),
    text(quoteRight, rowTop + LINE2_TOP + 7, row.percent, 5, row.color, 'text-anchor="end"')
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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="420" viewBox="0 0 1000 420"><title>Popular Scripting 0.2.30 preview</title><desc>Fixture-only geometry evidence for four columns: circular icon, grouped name plus code and observation date, sparkline, and grouped right-aligned value, unit, and variation. The native name reservation is 27 pt, followed by 8 pt spacing, a 3 pt status dot, and 2 pt trailing room. The four requested identifiers are fixture-only; no quote or curve is claimed. The display domain is seven days.</desc><defs><clipPath id="badge-disk" clipPathUnits="userSpaceOnUse"><circle cx="13" cy="13" r="13"/></clipPath></defs><rect width="1000" height="420" rx="22" fill="#0F0F12"/>${widget(30, 42, rows.slice(0, 4), 'small · 2×2', 1)}${widget(360, 42, rows, 'medium/large · 4×2', 2)}${text(360, 366, 'Prévia de dados de teste · quatro colunas 28/40/46/26 pt · nome 27 pt + espaço 8 pt + ponto 3 pt + folga 2 pt · domínio 7D · sem alegação de render nativo/iPhone', 11, '#96969C')}</svg>`;

const localSvg = svg
  .replace('Popular Scripting 0.2.29 preview', 'Popular Scripting 0.2.30 local fixture')
  .replaceAll('24h indisponível', '7d indisponível')
  .replace('Only USD/BRL has a timestamped curve; sparse sources say 7d indisponível.', 'The four requested identifiers are fixture-only; no quote or curve is claimed. The display domain is seven days.');
fs.writeFileSync(output, localSvg + '\n');
console.log(JSON.stringify({
  output,
  version: '0.2.30-local',
  fourColumns: { icon: COL1, identity: COL2, graph: COL3, quote: COL4, gap: COL_GAP },
  nameReservation: { text: NAME_TEXT_MAX, spacing: STATUS_SPACING, dot: STATUS_DOT, trailingGap: STATUS_TRAILING_GAP },
  shortCodeAndDateInIdentityColumn: true,
  icons: ['BBAS3', 'BBDC4', 'IBOV', 'BTC/USD'],
  canvasBadges: ['BBAS3', 'BBDC4', 'IBOV', 'BTC/USD'],
  placeholderIcons: [],
  curves: [],
  sparseFallback: '7d indisponível',
  sourceStatus: 'BTC/USD Kraken adapter covered by engine tests; fixture values intentionally omitted; B3 rows unavailable',
  window: { label: '7D', hours: 168, calendarDays: 7 },
  coverage: 'fixture-only'
}));
