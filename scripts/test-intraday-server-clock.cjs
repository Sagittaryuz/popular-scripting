// Reproduce the iPhone evidence: local 12:07:47, quote 12:08:12,
// same response HTTP Date 12:08:13. Do not alter the device clock.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const {buildSync}=require('esbuild');
const local=Date.parse('2026-11-11T15:07:47.216Z'),server=Date.parse('2026-11-11T15:08:13Z'),quote=Date.parse('2026-11-11T15:08:12Z');
// Freeze both harnesses: timePresentation reads Date.now(), not options.now.
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[local]));}static now(){return local;}}
const source=fs.readFileSync(path.join(__dirname,'Popular Scripting/original-engine.js'),'utf8').replace('export function createEngine','function createEngine');
const box={console,Date:ClockDate,Intl,Map,Set,URL};vm.createContext(box);vm.runInContext(source+'\nthis.createEngine=createEngine;',box);
const host={FileManager:{local:()=>({documentsDirectory:()=>'/doc',joinPath:(...x)=>x.join('/'),fileExists:()=>false,createDirectory(){}})}};
const api=box.createEngine(host,{now:local,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'}),usd=api.INTRADAY_ASSETS[2];
function payload(d,at=quote){const timestamp=[],close=[];for(let j=300;j>=0;j--){timestamp.push(at/1000-j*300);close.push(d.code==='USD/BRL'?5.56:100);}return {chart:{result:[{meta:{symbol:d.instrument,currency:d.providerCurrency,instrumentType:d.providerType,dataGranularity:'5m',regularMarketPrice:close[0],regularMarketTime:at/1000,previousClose:d.code==='USD/BRL'?5.58:99,tradingPeriods:[[{start:timestamp[0]-300,end:at/1000+86400}]]},timestamp,indicators:{quote:[{close}]}}],error:null}};}
const diagnostic=(extra={})=>({httpStatus:200,localReceiptTime:local,serverTime:server,...extra});
const row=api.parseIntraday(payload(usd),usd,local,diagnostic());
assert.equal(row.quoteVerified,true);assert(row.asset.percent<0);assert.equal(row.stamp.time,quote);
assert.equal(api.timeText(row),'12:08 YF','provider-confirmed timestamp remains visible');
assert.equal(row.fetchedAt,local,'cache age remains on the local clock');
assert.equal(row.intradayDiagnostic.validationClock,'provider-http-date');
assert.equal(row.intradayDiagnostic.validationTime,server);
assert.equal(row.intradayDiagnostic.quoteMinusReceiptMS,24784);
assert.equal(api.displayChart(row.chart,local).points.at(-1).stamp.time,quote,'renderer retains provider-confirmed latest bar');
assert.equal(api.validIntradayCache(row,usd,local),true,'cache accepts its verified response clock');
assert.equal(api.validIntradayCache(row,usd,local+60000),true);
assert.equal(api.validIntradayCache(row,usd,local+11*86400000),false,'server offset does not revive stale data');
for(const d of [{},diagnostic({serverTime:NaN}),diagnostic({httpStatus:500}),diagnostic({serverTime:local+300001})])assert.throws(()=>api.parseIntraday(payload(usd),usd,local,d),/cotação inválida/);
assert.throws(()=>api.parseIntraday(payload(usd,server+1000),usd,local,diagnostic()),/cotação inválida/,'future relative to server is still rejected');
assert.throws(()=>api.parseIntraday(payload(usd,server+1000),usd,server+26000,diagnostic({localReceiptTime:server+26000})),/cotação inválida/,'fast local clock does not authorize a quote after server time');
const old=api.parseIntraday(payload(usd,local-60000),usd,local,{});assert(api.validIntradayCache(old,usd,local),'legacy cache without HTTP reference remains valid');
const poisoned={...row,chart:{...row.chart,clockReference:{...row.chart.clockReference,serverTime:server+86400000}}};assert(!api.validIntradayCache(poisoned,usd,local),'invalid cache reference cannot bypass future checks');
const audit=api.quoteAudit(row);assert.equal(audit.intradayDiagnostic.validationClock,'provider-http-date');
// Production model + host + cache, using the exact observed clock skew.
const code=buildSync({entryPoints:[path.join(__dirname,'Popular Scripting/model.ts')],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting']}).outputFiles[0].text;
const values=new Map(),moduleOut={exports:{}};let offline=false,fetchCount=0;
vm.runInNewContext(code,{module:moduleOut,exports:moduleOut.exports,require:()=>({Widget:{}}),URL,console,Date:ClockDate,Intl,Math,JSON,Set,Map,setTimeout,clearTimeout,Data:{},Keychain:{contains:()=>false},Storage:{contains:k=>values.has(k),get:k=>values.get(k),set:(k,v)=>{values.set(k,v);return true}},fetch:async url=>{fetchCount++;if(offline)throw Error('synthetic offline');const symbol=decodeURIComponent(new URL(url).pathname.split('/').at(-1)),d=api.INTRADAY_ASSETS.find(d=>d.instrument===symbol);return {ok:true,status:200,headers:{get:k=>k==='date'?new Date(server).toUTCString():'application/json'},text:async()=>JSON.stringify(payload(d))}}});
(async()=>{const m=await moduleOut.exports.loadModel('medium',true);assert(m.rows.every(r=>r.quoteVerified&&r.intradayDelivery==='network'));assert.equal(m.rows[2].percent,'-0,36%');assert.equal(m.rows[2].time,'12:08 YF');assert(m.rows.every(r=>m.api.displayChart(r.chart).points.at(-1).stamp.time===quote));const requests=fetchCount;const ttl=await moduleOut.exports.loadModel('medium',false);assert.equal(fetchCount,requests,'fresh TTL uses no new network request');assert(ttl.rows.every(r=>r.intradayDelivery==='cache'));offline=true;const c=await moduleOut.exports.loadModel('medium',true);assert(c.rows.every(r=>r.cached&&r.quoteVerified&&r.intradayDiagnostic.cachePreserved&&r.intradayDelivery==='fallback'));assert.equal(c.rows[2].percent,m.rows[2].percent);console.log('PASS provider HTTP clock: observed iPhone skew, renderer, cache, all four assets, strict future rejection, invalid/missing HTTP Date, stale and legacy caches.');})().catch(e=>{console.error(e);process.exitCode=1});
