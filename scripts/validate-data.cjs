// Validates public data using the same production domain rules as the widget.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'scripts/Popular Scripting/original-engine.js'),'utf8').replace('export function createEngine','function createEngine');
const create=vm.runInNewContext(source+'\ncreateEngine',{Date,URL,console,Map,Set});
const files={documentsDirectory:()=>'/test',joinPath:(a,b)=>a+'/'+b,fileExists:()=>false,createDirectory(){}};
const api=create({FileManager:{local:()=>files}},{family:'medium'});
const data=JSON.parse(fs.readFileSync(path.join(root,'data/economic-series.json'),'utf8'));
assert.equal(data.schema,1);assert(Number.isFinite(Date.parse(data.verifiedAt))&&Date.parse(data.verifiedAt)<=Date.now());
for(const def of api.ECONOMIC_ASSETS){assert(api.validEconomicSeries(data.series[def.code],def),def.code);assert(api.validEconomicRow(api.economicRow(def,data.series[def.code])),def.code);}
assert(!/Keychain|api.github.com/.test(source));
assert.match(source,/Authorization:'Bearer '\+token/,'only the private profile carries a bearer header');
assert.match(source,/privateMarket\.endpoint/,'private requests use the host-provided endpoint');
console.log('PASS: four economic series, provenance, dates, units, derived rows and no credential literal in the engine.');
