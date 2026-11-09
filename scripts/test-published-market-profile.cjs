const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {bundle,hostHarness,endpoint,symbols}=require('./test-trading-host.cjs');
const types=['INDEX','INDEX','CURRENCY','FUTURE'],currencies=['BRL','USD','BRL','USD'],bases=[170000,48000,5.3,94];
function synthetic(symbol){
  const i=symbols.indexOf(symbol),timestamps=[],close=[],tradingPeriods=[];
  // Five real sessions with a weekend and overnight gaps. No closed-hour data.
  for(const day of ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06']){
    const start=Date.parse(day+'T13:00:00Z')/1000;tradingPeriods.push([{start,end:start+6*3600}]);
    for(let j=0;j<=72;j++){timestamps.push(start+j*300);close.push(bases[i]*(1+timestamps.length/100000));}
  }
  return {chart:{result:[{meta:{symbol,currency:currencies[i],instrumentType:types[i],dataGranularity:'5m',regularMarketPrice:close.at(-1),regularMarketTime:timestamps.at(-1),previousClose:bases[i],tradingPeriods},timestamp:timestamps,indicators:{quote:[{close}]}}],error:null}};
}
async function test(){
  const captured=process.env.TRADING_CAPTURE_DIR;
  const names=['ibov.json','dji.json','usdbrl.json','brent.json'];
  const payloads=symbols.map((symbol,i)=>captured?JSON.parse(fs.readFileSync(path.join(captured,names[i]),'utf8')):synthetic(symbol));
  const now=captured?Math.max(...payloads.map(p=>p.chart.result[0].meta.regularMarketTime*1000))+60000:Date.parse('2026-11-09T09:00:00Z');
  const h=hostHarness(url=>{const symbol=decodeURIComponent(new URL(url).pathname.split('/').at(-1));assert(symbols.includes(symbol));return payloads[symbols.indexOf(symbol)];});
  // An unrelated old cache must never substitute spot or a fixed Jan-2027 contract.
  h.storage.set('popular-engine:/popular/popular-widget-cache-v6/economic-v59-BRENT.json',JSON.stringify({asset:{code:'BRENT',price:123,source:'EIA',contractMonth:'2027-01'}}));
  const {createEngine}=bundle('original-engine.js');
  const api=createEngine(h.host,{family:'medium',force:true,now,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'});
  const rows=await api.collectRows();
  assert.deepEqual(Array.from(rows,r=>r.asset.code),['IBOV','DOW_JONES','USD/BRL','BRENT']);
  assert.equal(rows.length,4);
  for(let i=0;i<4;i++){
    const row=rows[i],raw=payloads[i].chart.result[0],visible=api.displayChart(row.chart,now);
    assert.equal(row.asset.source,'Yahoo Finance');assert.equal(row.asset.instrument,symbols[i]);
    assert.equal(row.asset.price,raw.meta.regularMarketPrice);assert.equal(row.asset.percentBasis,'supplier-previous-close');
    assert.equal(row.chart.window,'trading-24h');assert.equal(row.chart.timeBasis,'observed-trading-time');
    assert(visible.points.length>2,'each asset has a real curve');assert(row.chartCoverage.coveredMs>0);
    assert.equal(visible.displayWindow.coveredMs,row.chartCoverage.coveredMs);
    const supplied=new Map(raw.timestamp.map((t,j)=>[t*1000,raw.indicators.quote[0].close[j]]));
    for(const p of visible.points)assert.equal(p.value,supplied.get(p.stamp.time),'rendered values must originate in source timestamps');
    const coordinates=api.lineCoordinates(visible,46,20);assert.equal(coordinates.length,visible.points.length);
    assert.equal(coordinates.filter(p=>p.breakBefore).length,visible.displayWindow.gaps);
    if(!captured){assert.equal(row.chartCoverage.complete,true);assert.equal(row.chartCoverage.coveredMs,86400000);assert(visible.displayWindow.gaps>=3);assert(now-visible.points.at(-1).stamp.time>48*3600000,'Friday session remains visible on Monday');}
  }
  assert.equal(api.displayName(rows[3].asset),'Brent futuro');
  assert([...h.storage.keys()].some(k=>k.endsWith('/intraday-yahoo-5m-v1-BZ%3DF.json')),'future cache uses provider-specific identity');
  assert.equal(JSON.parse(h.storage.get('popular-engine:/popular/popular-widget-cache-v6/economic-v59-BRENT.json')).asset.price,123,'old economic cache stays untouched');
  assert(h.calls.every(c=>c.url.startsWith('https://query1.finance.yahoo.com/v8/finance/chart/')));
  assert(symbols.every(symbol=>h.calls.some(c=>c.url===endpoint(symbol))));
  assert(!h.calls.some(c=>c.options.headers.Authorization||c.options.headers.Cookie));
  const legacy=createEngine(h.host,{family:'medium',now,localTestAssets:true});
  assert.deepEqual(Array.from(legacy.localTestAssets,a=>a.code),['BBAS3','BBDC4','IBOV','BTC/USD']);
  assert.deepEqual(Array.from(api.fixedIndicatorCodes),['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']);
  assert.equal(typeof api.profileTwentyFourHour,'function');assert.equal(typeof api.profileSevenDayDaily,'function');assert.equal(typeof api.profileSevenDayEOD,'function');
  // Preserve the former calendar-24H and 7D helper contracts independently
  // from the new published trading-time profile.
  const helperNow=Date.parse('2026-10-30T18:00:00Z');
  const stamp=(day,hour=17)=>({day,time:Date.parse(day+'T'+String(hour).padStart(2,'0')+':00:00Z'),hasTime:true});
  const legacy24=api.profileTwentyFourHour({asset:{code:'fixture',price:103},chart:{window:'24H',windowHours:24,timeBasis:'trade-timestamp',closedOnly:false,points:[5,12,17].map((hour,i)=>({value:100+i,stamp:stamp('2026-10-30',hour)}))}},helperNow);
  assert.equal(legacy24.chartStatus,'valid-24h');assert.equal(api.displayChart(legacy24.chart,helperNow).points.length,3);
  const daily=api.profileSevenDayDaily({asset:{code:'fixture',price:103},chart:{closedOnly:true,timeBasis:'trade-timestamp',points:['2026-10-24','2026-10-27','2026-10-30'].map((day,i)=>({value:100+i,stamp:stamp(day)}))}},helperNow);
  assert.equal(daily.chartStatus,'valid-7D-daily');assert.equal(daily.chart.points.length,3);
  const short=api.profileSevenDayDaily({asset:{code:'short',price:100},chart:{points:[10,11,12].map((hour,i)=>({value:100+i,stamp:stamp('2026-10-30',hour)}))}},helperNow);
  assert.equal(short.chartStatus,'7d-daily-history-unavailable');
  console.log('PASS bundled engine + actual host + '+(captured?'captured public Yahoo responses':'synthetic 5-minute sessions')+': four quotes/curves, exact source values, trading coverage, session gaps, no legacy substitution or credentials, recoverable prior profile.');
}
test().catch(e=>{console.error(e);process.exitCode=1});
