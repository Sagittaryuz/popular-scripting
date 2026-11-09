// Exercise the published model -> real host -> real engine, not a parser mock.
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { buildSync } = require('esbuild');
let sourceDir = path.join(__dirname, 'Popular Scripting'), baselineDir;
if (process.argv.includes('--baseline')) {
  baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intraday-baseline-'));
  fs.cpSync(sourceDir, baselineDir, { recursive: true });
  fs.writeFileSync(path.join(baselineDir, 'original-engine.js'), execFileSync('git',
    ['show', 'cfad28b2ee862bb061dc8ef9a92c67545706e30d:scripts/Popular Scripting/original-engine.js'], { cwd: path.join(__dirname, '..') }));
  sourceDir = baselineDir;
}
const code = buildSync({
  entryPoints: [path.join(sourceDir, 'model.ts')],
  bundle: true, write: false, format: 'cjs', platform: 'node', external: ['scripting'],
}).outputFiles[0].text;
if (baselineDir) fs.rmSync(baselineDir, { recursive: true, force: true });
const START = Date.parse('2026-11-09T16:00:00Z');
const definitions = [
  { symbol: '^BVSP', code: 'IBOV', currency: 'BRL', type: 'INDEX', price: 150000, delay: 15 },
  { symbol: '^DJI', code: 'DOW_JONES', currency: 'USD', type: 'INDEX', price: 47000, delay: 0 },
  { symbol: 'BRL=X', code: 'USD/BRL', currency: 'BRL', type: 'CURRENCY', price: 5.2, delay: 0 },
  { symbol: 'BZ=F', code: 'BRENT', currency: 'USD', type: 'FUTURE', price: 65, delay: 15 },
];
function payload(d, quoteTime) {
  // Four seven-hour sessions provide >24 observed hours without a range retry.
  const timestamp = [], close = [], sessions = [];
  for (let day = 4; day >= 1; day--) {
    const start = (START - day * 86400000) / 1000;
    sessions.push({ start, end: start + 7 * 3600 });
    for (let bar = 0; bar <= 84; bar++) {
      timestamp.push(start + bar * 300);
      close.push(d.price * (1 + bar / 100000));
    }
  }
  return { chart: { error: null, result: [{
    meta: { symbol: d.symbol, currency: d.currency, instrumentType: d.type,
      dataGranularity: '5m', regularMarketPrice: d.price,
      regularMarketTime: quoteTime / 1000, previousClose: d.price * .99,
      exchangeDataDelayedBy: d.delay, tradingPeriods: [sessions] },
    timestamp, indicators: { quote: [{ close }] },
  }] } };
}
function harness(initialTime = START) {
  const storage = new Map(), calls = [], clock = { now: initialTime };
  let phase = { start: START, mode: 'race' };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, require: name => {
      assert.equal(name, 'scripting'); return { Widget: {} };
    }, console, URL, Date: ClockDate, Intl, Math, JSON, Set, Map, setTimeout, clearTimeout,
    Data: {}, Keychain: { contains: () => false },
    Storage: { contains: k => storage.has(k), get: k => storage.get(k),
      set: (k, v) => { storage.set(k, v); return true; } },
    fetch: async (url, options) => {
      const u = new URL(url), symbol = decodeURIComponent(u.pathname.split('/').at(-1));
      const d = definitions.find(item => item.symbol === symbol);
      assert(d, 'only the four configured instruments may reach transport');
      assert.equal(u.origin, 'https://query1.finance.yahoo.com');
      assert.equal(u.search, '?range=5d&interval=5m');
      calls.push({ symbol, options });
      const requestPhase = { ...phase };
      // Yield so all parallel requests begin before advancing simulated time.
      await Promise.resolve();
      clock.now = requestPhase.start + 4000;
      if (requestPhase.mode === 'capture') {
        const entry = transport.find(t => t.symbol === symbol);
        clock.now = Math.max(clock.now, Date.parse(entry.checkedAt));
        return { ok: true, status: 200, headers: { get: () => 'application/json' },
          text: async () => JSON.stringify(captures[definitions.indexOf(d)]) };
      }
      if (requestPhase.mode === 'offline') throw Error('synthetic offline');
      const offset = requestPhase.mode === 'future' ? 5000
        : requestPhase.mode === 'seed' ? -60000 : d.delay ? -900000 : 2000;
      return { ok: true, status: 200, headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(payload(d, requestPhase.start + offset)) };
    },
  });
  return { storage, calls, clock, load: mode => {
    phase = { start: clock.now, mode };
    return module.exports.loadModel('medium', true);
  } };
}
const captureDir = path.join(__dirname, '../validation/live-capture');
const hasCaptures = ['transport', 'ibov', 'dji', 'usdbrl', 'brent'].every(name =>
  fs.existsSync(path.join(captureDir, name + '.json')));
const transport = hasCaptures ? JSON.parse(fs.readFileSync(path.join(captureDir, 'transport.json'))) : [];
const captures = hasCaptures ? ['ibov', 'dji', 'usdbrl', 'brent'].map(name =>
  JSON.parse(fs.readFileSync(path.join(captureDir, name + '.json')))) : [];
const cacheEntries = h => [...h.storage].filter(([key]) => key.includes('intraday-yahoo-5m-v1-'));
async function main() {
  const failures = [];
  async function test(name, run) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL ' + name + ': ' + error.message); }
  }
  await test('real-time quotes arriving after engine creation are accepted alongside delayed quotes', async () => {
    const h = harness(), model = await h.load('race');
    console.log('Receive-time evidence:', JSON.stringify(model.rows.map(row => ({ code: row.asset.code,
      verified: row.quoteVerified, quoteTime: row.stamp?.time, error: row.sourceError }))));
    assert.equal(h.calls.length, 4);
    assert.deepEqual(Array.from(model.rows, row => row.asset.code), definitions.map(d => d.code));
    for (const row of model.rows)
      assert.equal(row.quoteVerified, true, row.asset.code + ' must accept quote <= actual receipt time');
    for (const row of model.rows) {
      assert.equal(row.history.complete, true);
      assert.equal(row.fetchedAt, START + 4000, 'fetchedAt must describe receipt, not request start');
    }
    assert.equal(cacheEntries(h).length, 4);
  });
  if (hasCaptures) await test('captured Yahoo responses replay through real model and host at recorded receive times', async () => {
    const start = Math.min(...transport.map(t => Date.parse(t.checkedAt) - t.elapsedMs));
    const h = harness(start), model = await h.load('capture');
    for (const [i, d] of definitions.entries()) {
      const t = transport.find(t => t.symbol === d.symbol);
      const quote = captures[i].chart.result[0].meta.regularMarketTime * 1000;
      console.log('Capture timing:', JSON.stringify({ symbol: d.symbol,
        start: new Date(start).toISOString(), quote: new Date(quote).toISOString(), receipt: t.checkedAt }));
      if (!d.delay) assert(quote > start && quote <= Date.parse(t.checkedAt));
    }
    assert(model.rows.every(row => row.quoteVerified === true), 'all four actual captures must be accepted');
  });
  else console.log('SKIP optional live capture replay: local validation/live-capture files absent');
  await test('quotes even one second beyond receipt remain rejected without cache', async () => {
    const h = harness(), model = await h.load('future');
    assert.equal(model.rows.length, 4);
    assert(model.rows.every(row => row.quoteVerified === false && row.intradayUnavailable === true));
    assert.equal(cacheEntries(h).length, 0);
  });
  await test('future and offline responses preserve verified per-instrument cache exactly', async () => {
    const h = harness(), seeded = await h.load('seed');
    assert(seeded.rows.every(row => row.quoteVerified));
    const before = cacheEntries(h);
    assert.equal(before.length, 4);
    for (const mode of ['future', 'offline']) {
      h.clock.now += 60000;
      const model = await h.load(mode);
      assert(model.rows.every(row => row.cached === true && row.quoteVerified === true));
      assert.deepEqual(Array.from(model.rows, row => row.stamp.time), Array.from(seeded.rows, row => row.stamp.time));
      assert.deepEqual(cacheEntries(h), before, 'failed updates must not replace source cache');
    }
  });
  assert.equal(failures.length, 0, failures.join('\n'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
