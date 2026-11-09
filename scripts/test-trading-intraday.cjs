const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'Popular Scripting/original-engine.js'),'utf8').replace('export function createEngine','function createEngine');
const box={console,Date,Intl,Map,Set,URL};vm.createContext(box);vm.runInContext(source+'\nthis.createEngine=createEngine;',box);
const time=Date.parse('2026-11-09T16:00:00Z'),store=new Map(),calls=[];
let failing=false;
const payload=(d)=>{const start=time-4*86400000,ts=[],close=[],sessions=[];for(let day=0;day<4;day++){const a=start+day*86400000;sessions.push({start:a/1000,end:(a+7*3600000)/1000});for(let j=0;j<=84;j++){ts.push((a+j*300000)/1000);close.push(100+j/1000);}}return {chart:{result:[{meta:{symbol:d.instrument,currency:d.providerCurrency,instrumentType:d.providerType,dataGranularity:'5m',regularMarketPrice:100,regularMarketTime:ts.at(-1),previousClose:99,chartPreviousClose:90,tradingPeriods:[sessions]},timestamp:ts,indicators:{quote:[{close}]}}],error:null}};};
let api;class Request{constructor(url){this.url=url;calls.push(this);}async loadJSON(){if(failing)throw Error('offline');const d=api.INTRADAY_ASSETS.find(d=>this.url.includes(encodeURIComponent(d.instrument)));return payload(d);}}
const host={Request,FileManager:{local:()=>({documentsDirectory:()=>'/doc',joinPath:(...x)=>x.join('/'),fileExists:p=>store.has(p),createDirectory(){},readString:p=>store.get(p),writeString:(p,s)=>store.set(p,s)})}};
api=box.createEngine(host,{now:time,force:true,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'});
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}const d=api.INTRADAY_ASSETS[0],row=api.parseIntraday(payload(d),d,time),visible=api.displayChart(row.chart,time);
test('24 observed hours span closed sessions',()=>{assert.equal(visible.displayWindow.coveredMs,86400000);assert(visible.displayWindow.endTime-visible.displayWindow.startTime>86400000);assert(visible.displayWindow.gaps>=3);});
test('contiguous bars across provider session IDs count observed time',()=>{const chart={window:'trading-24h',timeBasis:'observed-trading-time',intervalMs:300000,points:[{value:100,stamp:{time:time-300000,hasTime:true},session:time-86400000},{value:101,stamp:{time,hasTime:true},session:time}]};const w=api.tradingWindow(chart,time);assert.equal(w.displayWindow.coveredMs,300000);assert.equal(w.displayWindow.gaps,0);assert.equal(w.points[1].breakBefore,false);});
test('empty cached history has no fabricated range or curve',()=>{const empty={...row,chart:{...row.chart,points:[]}};assert.equal(api.validIntradayCache(empty,d,time),true);const shown=api.displayChart(empty.chart,time);assert.equal(shown.points.length,0);assert.equal(shown.displayWindow.startTime,null);assert.equal(shown.displayWindow.endTime,null);assert.equal(shown.displayWindow.complete,false);assert.equal(api.lineCoordinates(empty.chart).length,0);});
test('cache rejects null quote time',()=>assert.equal(api.validIntradayCache({...row,stamp:{...row.stamp,time:null}},d,time),false));
test('percent uses daily previousClose, not chartPreviousClose',()=>assert(Math.abs(row.asset.percent-(100/99-1)*100)<1e-9));
test('coordinate gaps persist without interpolation',()=>{const c=api.lineCoordinates(row.chart);assert.equal(c.length,visible.points.length);assert.equal(c.filter(x=>x.breakBefore).length,visible.displayWindow.gaps);assert.equal(c[0].x,.75);assert.equal(c.at(-1).x,45.25);});
test('no calendar month marks for observed bars',()=>assert.equal(api.monthLayout(row.chart).lines.length,0));
for(const key of ['symbol','currency','instrumentType','dataGranularity'])test('reject wrong '+key,()=>{const p=payload(d);p.chart.result[0].meta[key]='wrong';assert.throws(()=>api.parseIntraday(p,d,time));});
test('reject missing sessions',()=>{const p=payload(d);delete p.chart.result[0].meta.tradingPeriods;assert.throws(()=>api.parseIntraday(p,d,time));});
test('reject future quote',()=>{const p=payload(d);p.chart.result[0].meta.regularMarketTime=time/1000+1;assert.throws(()=>api.parseIntraday(p,d,time));});
test('reject quote older than ten days',()=>{const p=payload(d);p.chart.result[0].meta.regularMarketTime=time/1000-11*86400;assert.throws(()=>api.parseIntraday(p,d,time));});
test('missing bar breaks curve, no interpolation',()=>{const p=payload(d);p.chart.result[0].indicators.quote[0].close[p.chart.result[0].timestamp.length-5]=null;const r=api.parseIntraday(p,d,time);assert(r.history.gaps>row.history.gaps);});
test('partial coverage explicit',()=>{const p=payload(d);p.chart.result[0].timestamp=p.chart.result[0].timestamp.slice(-20);p.chart.result[0].indicators.quote[0].close=p.chart.result[0].indicators.quote[0].close.slice(-20);const r=api.parseIntraday(p,d,time);assert.equal(r.chartStatus,'intraday-partial');assert.equal(r.history.complete,false);});
test('cache accepts exact source identity',()=>assert.equal(api.validIntradayCache(row,d,time),true));
test('cache rejects different instrument',()=>assert.equal(api.validIntradayCache(row,api.INTRADAY_ASSETS[1],time),false));
test('cache rejects spot substitution',()=>assert.equal(api.validIntradayCache({...row,asset:{...row.asset,source:'EIA/FRED'}},d,time),false));
test('audit coverage and instrument',()=>{const a=api.quoteAudit(row);assert.equal(a.instrument,'^BVSP');assert.equal(a.chartCoverage.complete,true);});
const fixtureDir=process.env.INTRADAY_FIXTURES;
if(fixtureDir){
  const files=['ibov','dji','usdbrl','brent'];
  const captures=files.map(file=>JSON.parse(fs.readFileSync(path.join(fixtureDir,file+'.json'))));
  const asOf=Math.max(...captures.map(p=>Number(p.chart.result[0].meta.regularMarketTime)*1000))+60000;
  assert(Number.isFinite(asOf),'live captures must contain valid quote timestamps');
  const liveApi=box.createEngine(host,{now:asOf,force:true,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'});
  for(const [i,file] of files.entries())test('real '+file+' identity, sessions and 24h',()=>{const r=liveApi.parseIntraday(captures[i],liveApi.INTRADAY_ASSETS[i],asOf);assert.equal(r.history.complete,true);assert(liveApi.lineCoordinates(r.chart).length>280);console.log(JSON.stringify({code:r.asset.code,price:r.asset.price,percent:r.asset.percent,history:r.history,asOf}));});
}

(async()=>{const rows=await api.collectPublishedProfileRows();assert.equal(rows.length,4);assert(rows.every(r=>r.quoteVerified));assert.equal(calls.length,4);assert(calls.every(c=>c.timeoutInterval<=20));assert.equal(store.size,4);failing=true;const cached=await api.collectPublishedProfileRows();assert(cached.every(r=>r.cached));assert(cached.every((r,i)=>r.stamp.time===rows[i].stamp.time));console.log(`PASS ${count+2} intraday cases including four-provider collection and same-instrument offline cache`);})().catch(e=>{console.error(e);process.exitCode=1;});
