const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

const root=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(root,'scripts/Popular Scripting/model.ts'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/Popular Scripting/script.json'),'utf8'));
const view=fs.readFileSync(path.join(root,'scripts/Popular Scripting/view.tsx'),'utf8');
const engine=fs.readFileSync(path.join(root,'scripts/Popular Scripting/original-engine.js'),'utf8');
const index=fs.readFileSync(path.join(root,'scripts/Popular Scripting/index.tsx'),'utf8');

assert.equal(manifest.version,'0.2.35','published script manifest is bumped with the active private profile');
assert.match(model,/export const VERSION='0\.2\.35'/);
assert.match(model,/export const PUBLISHED_TEST_ASSETS=true/);
assert.match(model,/PUBLISHED_TEST_PROFILE='b3-btc-7d'/);
assert.match(model,/localTestAssets:PUBLISHED_TEST_ASSETS/);
assert.match(model,/if\(!PUBLISHED_TEST_ASSETS&&cacheOnly/,'a legacy cache cannot shadow the active test profile');
assert.match(model,/const additions=PUBLISHED_TEST_ASSETS\?\[\]:/,'legacy catalog additions are disabled by the profile');
assert.match(model,/const orderedRows=PUBLISHED_TEST_ASSETS\?rows:fixedIndicatorRows\(rows\)/,'the active four-row order is not re-sorted by the legacy IBOV slot');
assert.match(model,/const combined=PUBLISHED_TEST_ASSETS\?\[\.\.\.orderedRows,\.\.\.additions\]:/,'the active order is preserved through the persisted result');
assert.match(model,/FIXED_INDICATOR_CODES=\['SELIC','IPCA','IBOV','USD\/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'\]/,'the former list remains recoverable');
assert.match(engine,/const KRAKEN_WINDOW_HOURS = 7 \* 24/);
assert.match(engine,/const VERSION = '2026\.10\.30\.87'/,'the published engine bundle is identified separately from the package version');
assert.match(engine,/window:'7D'/);
assert.match(view,/BBAS3.*BBDC4.*IBOV.*BTC\/USD/,'the published UI accepts the four test identifiers');
assert.match(view,/curve\.status==='unavailable-7d'/);
assert.match(engine,/get privateMarketStatus\(\)/,'the engine exposes only a safe private-source status snapshot');
assert.match(model,/privateMarketStatusText/,'the foreground model has safe status labels');
assert.match(model,/Worker respondeu HTTP/,'the foreground model labels other safe HTTP statuses without exposing a response body');
assert.match(index,/privateMarketStatusText/,'the diagnostic is visible in the foreground app, not in the widget layout');

console.log('PASS published profile: version 0.2.35 activates the private BBAS3/BBDC4/IBOV/BTCUSD profile, identifies the engine bundle, bypasses legacy cache/additions, preserves the old fixed list, and keeps the 7D UI contract plus safe source diagnostics.');
