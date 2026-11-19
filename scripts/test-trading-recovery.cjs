const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'Popular Scripting/original-engine.js'),'utf8').replace('export function createEngine','function createEngine');
const box={console,Date,Intl,Map,Set,URL};vm.createContext(box);vm.runInContext(code+'\nthis.createEngine=createEngine;',box);
const minute=60000,bar=5*minute,hour=60*minute,day=24*hour;
const base=Date.parse('2026-11-17T00:00:00Z'),time=base+3*day;
const values=new Map(),calls=[];
let api,respond;
class Request{constructor(url){this.url=url;calls.push(url);}async loadJSON(){return respond(this.url);}}
const host={Request,FileManager:{local:()=>({documentsDirectory:()=>'/doc',joinPath:(...x)=>x.join('/'),fileExists:p=>values.has(p),createDirectory(){},readString:p=>values.get(p),writeString:(p,s)=>values.set(p,s)})}};
api=box.createEngine(host,{now:time,force:true,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'});
const d=api.INTRADAY_ASSETS.find(x=>x.code==='USD/BRL');
function fixture(end, {gap=false,near=false,oldOnly=false,single=false}={}){
  const timestamps=[],close=[];
  for(let t=single?end:base;t<=end;t+=bar){
    if(gap&&t>=base+day+3*hour&&t<base+day+7*hour)continue;
    if(oldOnly&&t>base+day+23*hour)continue;
    timestamps.push(t/1000);close.push(5.44+(t-base)/day*.15);
  }
  if(near){const t=end-day;timestamps.push(t/1000);close.push(5.61);const tuples=timestamps.map((p,i)=>[p,close[i]]).sort((a,b)=>a[0]-b[0]);timestamps.splice(0,Infinity,...tuples.map(p=>p[0]));close.splice(0,Infinity,...tuples.map(p=>p[1]));}
  const price=close.at(-1);
  return {chart:{result:[{timestamp:timestamps,indicators:{quote:[{close}]},meta:{symbol:d.instrument,currency:d.providerCurrency,instrumentType:d.providerType,dataGranularity:'5m',regularMarketPrice:price,regularMarketTime:end/1000,previousClose:price,chartPreviousClose:price,tradingPeriods:[[{start:base/1000,end:time/1000}]]}}]}};
}
function parse(en,opt){return api.parseIntraday(fixture(en,opt),d,time);}
function coherent(row){
  const shown=api.displayChart(row.chart,time);
  assert(row.returnReference);
  assert.equal(shown.points.at(-1).value,row.asset.price);
  assert.equal(shown.points.at(-1).stamp.time,row.stamp.time);
  assert.equal(row.returnReference.endTime,row.stamp.time);
  assert.equal(row.returnReference.startTime,shown.points[0].stamp.time);
  assert.equal(row.asset.percent,(shown.points.at(-1).value/shown.points[0].value-1)*100);
}
(async()=>{
  const end=base+2*day+5*hour;
  const partial=parse(end,{gap:true}), good=parse(base+day+2*hour);
  assert.equal(partial.asset.percent,null);
  assert(partial.chartCoverage.overshootMs>bar);
  // Same calendar, real latest endpoint lacks preceding support; historical candidate does not.
  const cold=api.recoverTradingReturn(partial,null,time);
  coherent(cold);
  assert(cold.stamp.time<partial.stamp.time);
  assert.equal(cold.returnRecovery.source,'history');
  assert.equal(cold.returnRecovery.requestedTime,partial.stamp.time);
  assert.equal(cold.returnRecovery.displayedTime,cold.stamp.time);
  assert(cold.asset.percent>0,'equal provider previousClose must not fabricate zero');
  const cacheCandidate=parse(base+2*day+4*hour,{near:false});
  assert(cacheCandidate.stamp.time>cold.stamp.time);
  const preferred=api.recoverTradingReturn(partial,cacheCandidate,time);
  coherent(preferred);
  assert.equal(preferred.stamp.time,cacheCandidate.stamp.time);
  assert.equal(preferred.returnRecovery.source,'cache');
  const rolledBack=parse(cacheCandidate.stamp.time-hour);
  coherent(rolledBack);
  const preserved=api.recoverTradingReturn(rolledBack,cacheCandidate,time);
  coherent(preserved);
  assert.equal(preserved.stamp.time,cacheCandidate.stamp.time);
  assert.equal(preserved.asset.percent,cacheCandidate.asset.percent);
  assert.equal(preserved.returnRecovery.reason,'provider-quote-regressed');
  assert.equal(preserved.returnRecovery.requestedTime,rolledBack.stamp.time);
  const wrongSource={...cacheCandidate,asset:{...cacheCandidate.asset,source:'unverified-provider'}};
  assert.equal(api.recoverTradingReturn(partial,wrongSource,time).returnRecovery.source,'history');
  const noBasis=api.recoverTradingReturn(parse(end,{single:true}),null,time);
  assert.equal(noBasis.asset.percent,null);
  assert(!noBasis.returnRecovery);
  const shortHistory=api.recoverTradingReturn(parse(base+23*hour),null,time);
  assert.equal(shortHistory.asset.percent,null);
  assert(shortHistory.history.coveredMs<day);
  assert(!shortHistory.returnRecovery);
  // Sparse newer response must not overwrite a complete confirmed cached reference.
  respond=()=>fixture(good.stamp.time);
  const first=await api.loadIntraday(d);
  coherent(first);
  respond=()=>fixture(end,{single:true});
  const fallback=await api.loadIntraday(d);
  coherent(fallback);
  assert(fallback.stamp.time>=first.stamp.time&&fallback.stamp.time<end);
  assert(fallback.asset.percent>0);
  const preservedOffline=await (async()=>{respond=()=>{throw Error('offline')};return api.loadIntraday(d)})();
  coherent(preservedOffline);
  assert.equal(preservedOffline.stamp.time,fallback.stamp.time);
  assert.equal(preservedOffline.asset.percent,fallback.asset.percent);
  // If expansion supplies missing 24-hour reference, use current quote, not historical fallback.
  values.clear();calls.length=0;
  respond=url=>fixture(end,{gap:true,near:url.includes('range=1mo')});
  const expanded=await api.loadIntraday(d);
  coherent(expanded);
  assert.equal(expanded.stamp.time,end);
  assert(expanded.asset.percent>0);
  assert(calls.some(url=>url.includes('range=1mo')));
  console.log('PASS trading recovery: cold historical reference, sparse or regressed feed preserves reliable cache, preferred complete expansion, no manufactured zero');
})().catch(e=>{console.error(e);process.exitCode=1;});
