const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

const root=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(root,'scripts/Popular Scripting/model.ts'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/Popular Scripting/script.json'),'utf8'));
const view=fs.readFileSync(path.join(root,'scripts/Popular Scripting/view.tsx'),'utf8');
const engine=fs.readFileSync(path.join(root,'scripts/Popular Scripting/original-engine.js'),'utf8');

assert.equal(manifest.version,'0.2.30','published script manifest is bumped with the active profile');
assert.match(model,/export const VERSION='0\.2\.30'/);
assert.match(model,/export const PUBLISHED_TEST_ASSETS=true/);
assert.match(model,/PUBLISHED_TEST_PROFILE='b3-btc-7d'/);
assert.match(model,/localTestAssets:PUBLISHED_TEST_ASSETS/);
assert.match(model,/if\(!PUBLISHED_TEST_ASSETS&&cacheOnly/,'a legacy cache cannot shadow the active test profile');
assert.match(model,/const additions=PUBLISHED_TEST_ASSETS\?\[\]:/,'legacy catalog additions are disabled by the profile');
assert.match(model,/const orderedRows=PUBLISHED_TEST_ASSETS\?rows:fixedIndicatorRows\(rows\)/,'the active four-row order is not re-sorted by the legacy IBOV slot');
assert.match(model,/const combined=PUBLISHED_TEST_ASSETS\?\[\.\.\.orderedRows,\.\.\.additions\]:/,'the active order is preserved through the persisted result');
assert.match(model,/FIXED_INDICATOR_CODES=\['SELIC','IPCA','IBOV','USD\/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'\]/,'the former list remains recoverable');
assert.match(engine,/const KRAKEN_WINDOW_HOURS = 7 \* 24/);
assert.match(engine,/window:'7D'/);
assert.match(view,/BBAS3.*BBDC4.*IBOV.*BTC\/USD/,'the published UI accepts the four test identifiers');
assert.match(view,/curve\.status==='unavailable-7d'/);

console.log('PASS published profile: version 0.2.30 activates BBAS3/BBDC4/IBOV/BTCUSD, bypasses legacy cache/additions, preserves the old fixed list, and keeps the 7D UI contract.');
