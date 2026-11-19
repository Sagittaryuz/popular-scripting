const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, 'Popular Scripting');
const engine = fs.readFileSync(path.join(dir, 'original-engine.js'), 'utf8')
  .replace('export function createEngine', 'function createEngine');
const box = {console, Date, Intl, Map, Set, URL};
vm.createContext(box);
vm.runInContext(engine+'\nthis.createEngine=createEngine;', box);

const hour=3600000, day=24*hour, bar=300000;
const friday=Date.parse('2026-11-20T21:00:00Z');
const sunday=Date.parse('2026-11-22T16:00:00Z');
const api=box.createEngine({FileManager:{local:()=>({documentsDirectory:()=>"/doc",joinPath:(...x)=>x.join("/"),fileExists:()=>false,createDirectory(){}})}}, {now:friday,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-24h'});
const defs=api.INTRADAY_ASSETS;
const daily=Array.from({length:5},(_,i)=>[friday-(4-i)*day-6*hour,friday-(4-i)*day]);
const crypto={code:'BTC/USD',instrument:'BTC-USD',providerCurrency:'USD',providerType:'CRYPTOCURRENCY',source:'Yahoo Finance',type:'criptomoedas'};
function fixture(d, sessions=daily, {price=d.code==="USD/BRL"?5.8:104, missing=null, previous=99}={}){
  const timestamp=[],close=[],base=d.code==="USD/BRL"?5.6:100;
  for(const [a,b] of sessions){
    for(let t=a;t<=b;t+=bar){
      if(timestamp.at(-1)===t)continue;
      timestamp.push(t);
      close.push(t===missing?null:base+(timestamp.length-1)/5000);
    }
  }
  close[close.length-1]=price;
  return {chart:{result:[{
    meta:{symbol:d.instrument,currency:d.providerCurrency,instrumentType:d.providerType,
      dataGranularity:'5m',regularMarketPrice:price,regularMarketTime:timestamp.at(-1)/1000,
      previousClose:previous,regularMarketPreviousClose:previous,chartPreviousClose:98,
      tradingPeriods:[sessions.map(([start,end])=>({start:start/1000,end:end/1000}))],
      currentTradingPeriod:{regular:{start:sessions.at(-1)[0]/1000,end:sessions.at(-1)[1]/1000}}},
    timestamp:timestamp.map(t=>t/1000),indicators:{quote:[{close}]}
  }],error:null}};
}
function visible(row,time){return api.tradingWindow(row.chart,time);}
function sameReference(row,time){
  const w=visible(row,time),[first,last]=[w.points[0],w.points.at(-1)];
  assert.equal(w.displayWindow.coveredMs,day);
  assert.equal(w.displayWindow.complete,true);
  assert.equal(last.stamp.time,row.stamp.time,'curve ends at quote');
  assert.equal(last.value,row.asset.price,'curve and quote end at same price');
  assert(Math.abs(row.asset.percent-(last.value/first.value-1)*100)<1e-10,'return shares chart start and end');
  assert(Math.abs(row.asset.delta-(last.value-first.value))<1e-10);
  return w;
}

for(const d of defs){
  const onFriday=api.parseIntraday(fixture(d),d,friday);
  const w=sameReference(onFriday,friday);
  assert(w.displayWindow.endTime-w.displayWindow.startTime>day,'24 trading hours span multiple civil days');
  assert.equal(w.displayWindow.startTime,daily[1][0],'latest four complete six-hour sessions');
  const onSunday=fixture(d,daily,{previous:onFriday.asset.price});
  onSunday.chart.result[0].meta.currentTradingPeriod.regular={start:sunday/1000,end:(sunday+day)/1000};
  const rolled=api.parseIntraday(onSunday,d,sunday);
  sameReference(rolled,sunday);
  assert.equal(rolled.asset.percent,onFriday.asset.percent,'weekend/session rollover must not zero Friday');
  assert.equal(rolled.stamp.time,friday);
}
const d=defs[0];
const missingAt=friday-hour;
const outage=api.parseIntraday(fixture(d,daily,{missing:missingAt}),d,friday);
const healthy=api.parseIntraday(fixture(d),d,friday);
const outageWindow=sameReference(outage,friday);
assert.equal(outage.asset.percent,healthy.asset.percent,'a missing intermediate open-session bar must not pause the trading clock');
assert(outageWindow.points.some(p=>p.breakBefore),'no chart interpolation across missing bars');
const unknown=api.applyTradingReturn({...outage,chart:{...outage.chart,sessions:[]}},friday);
assert.equal(unknown.asset.percent,null,'missing calendar cannot declare an unexplained break a closure');

const overlapping=fixture(d,daily);
overlapping.chart.result[0].meta.tradingPeriods[0].push({
  start:(daily.at(-1)[0]+bar)/1000,end:(friday-bar)/1000,
});
const union=api.parseIntraday(overlapping,d,friday);
assert.equal(sameReference(union,friday).displayWindow.startTime,daily[1][0],'overlapping session metadata cannot double count trading time');

const afterClose=fixture(d,daily);
afterClose.chart.result[0].meta.regularMarketTime=(friday+hour)/1000;
afterClose.chart.result[0].meta.regularMarketPrice=105;
const closed=api.parseIntraday(afterClose,d,friday+hour);
assert.equal(closed.stamp.time,friday,'a late provider stamp does not move the trading endpoint past session close');
assert.equal(closed.asset.price,healthy.asset.price);
assert.equal(closed.asset.percent,healthy.asset.percent);
sameReference(closed,friday+hour);

const incomplete=api.parseIntraday(fixture(d,daily.slice(-3)),d,friday);
assert.equal(incomplete.asset.percent,null,'18 hours are not a 24h return');
assert.equal(incomplete.asset.delta,null);
assert.equal(api.displayPercent(incomplete.asset.percent,incomplete.asset),'—');
const flatFixture=fixture(d,daily,{price:100});
flatFixture.chart.result[0].indicators.quote[0].close.fill(100);
const flat=api.parseIntraday(flatFixture,d,friday);
assert.equal(flat.asset.percent,0);
sameReference(flat,friday);

// The last price can have a sub-bar quote timestamp; use that genuine quote
// as the plotted endpoint without fabricating a cutoff sample.
const exact=fixture(d,daily);
const evidence=exact.chart.result[0];
const partialAt=friday-150000;
evidence.meta.regularMarketTime=partialAt/1000;
evidence.meta.regularMarketPrice=103;
evidence.timestamp.pop();
evidence.indicators.quote[0].close.pop();
const partial=api.parseIntraday(exact,d,friday);
const partialWindow=visible(partial,friday);
assert.equal(partialWindow.points.at(-1).stamp.time,partialAt);
assert.equal(partialWindow.points.at(-1).value,103);
assert.equal(partialWindow.displayWindow.coveredMs,day+150000);
assert.equal(partialWindow.displayWindow.overshootMs,150000);
assert.equal(partial.asset.percent,(103/partialWindow.points[0].value-1)*100);

const continuous=[[sunday-2*day,sunday-day],[sunday-day,sunday]];
const btc=api.parseIntraday(fixture(crypto,continuous),crypto,sunday);
const cw=sameReference(btc,sunday);
assert.equal(cw.displayWindow.startTime,sunday-day,'continuous market does not pause at midnight or on weekend');
assert.equal(cw.displayWindow.gaps,0);

// The return may use a real sample exactly one provider interval before
// the cutoff, but two missing base observations make the return unavailable.
const cutoff=sunday-day;
const boundaryAtFive=api.parseIntraday(fixture(crypto,continuous,{missing:cutoff}),crypto,sunday);
const bw=visible(boundaryAtFive,sunday);
assert.equal(bw.displayWindow.startTime,cutoff-bar);
assert.equal(bw.displayWindow.overshootMs,bar);
assert.equal(bw.displayWindow.complete,true);
assert.equal(boundaryAtFive.asset.percent,(boundaryAtFive.asset.price/bw.points[0].value-1)*100);
const missingBase=fixture(crypto,continuous,{missing:cutoff});
const baseEvidence=missingBase.chart.result[0];
baseEvidence.indicators.quote[0].close[baseEvidence.timestamp.indexOf((cutoff-bar)/1000)]=null;
const remote=api.parseIntraday(missingBase,crypto,sunday);
assert.equal(remote.asset.percent,null,'the ten-minute-old base is outside the five-minute tolerance');
assert.equal(remote.asset.delta,null);
assert.equal(visible(remote,sunday).displayWindow.complete,false);

const draw=fs.readFileSync(path.join(dir,'draw.js'),'utf8');
const color=draw.match(/export function movementColor\(row\)\s*\{[^}]*\}/)?.[0];
assert(color,'movementColor exported from native drawing helper');
const movementColor=vm.runInNewContext(color.replace('export function','(function')+')');
assert.equal(movementColor({movement:0.000001}),'#00E676','tiny positive return stays green');
assert.equal(movementColor({movement:-0.000001}),'#FF1744','tiny negative return stays red');
const yellow=movementColor({movement:0});
assert.match(yellow,/^#[0-9a-f]{6}$/i);
const [r,g,b]=[1,3,5].map(i=>parseInt(yellow.slice(i,i+2),16));
assert(r>180&&g>125&&b<Math.min(r,g)*0.7,'exact zero is yellow');
for(const movement of [null,undefined,NaN,Infinity,-Infinity])assert.notEqual(movementColor({movement}),yellow,'missing/nonfinite return is never zero');
console.log('PASS trading return: all four instruments, 24h shared chart endpoints, Friday→Sunday rollover, known/unknown feed gaps, 5-minute baseline tolerance, continuous market, exact-zero color');
