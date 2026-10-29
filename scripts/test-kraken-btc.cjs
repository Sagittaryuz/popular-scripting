const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});

const files=new Map();
const fm={
  documentsDirectory:()=>'/documents',
  joinPath:(...parts)=>parts.join('/'),
  fileExists:file=>files.has(file),
  createDirectory:()=>{},
  readString:file=>files.get(file),
  writeString:(file,value)=>files.set(file,value)
};
const now=Date.parse('2026-10-29T20:12:31Z');
const hourEnd=Date.parse('2026-10-29T20:00:00Z');
const pairURL='https://api.kraken.com/0/public/AssetPairs?pair=XBTUSD';
const tickerURL='https://api.kraken.com/0/public/Ticker?pair=XBTUSD';
const ohlcURL='https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60';
const tickerPrice=110000.25;
const candles=[];
for(let i=0;i<=720;i++){
  const at=hourEnd-(720-i)*3600000,close=100000+i*10;
  candles.push([Math.floor(at/1000),String(close-5),String(close+5),String(close-10),String(close),String(close-2),'12.5','4']);
}
const responses={
  [pairURL]:{error:[],result:{XXBTZUSD:{altname:'XBTUSD',wsname:'XBT/USD',base:'XXBT',quote:'ZUSD',status:'online'}}},
  [tickerURL]:{error:[],result:{XXBTZUSD:{c:[String(tickerPrice),'0.01']}}},
  [ohlcURL]:{error:[],result:{XXBTZUSD:candles,last:String(Math.floor((hourEnd-3600000)/1000))}}
};
class MockRequest {
  constructor(url){this.url=url;this.response={statusCode:200};}
  async loadJSON(){if(!responses[this.url])throw Error('unexpected URL '+this.url);return responses[this.url];}
}
const api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined},{family:'medium',now});

const pair=api.parseKrakenAssetPair(responses[pairURL]);
assert.equal(JSON.stringify(pair),JSON.stringify({key:'XXBTZUSD',altname:'XBTUSD',wsname:'XBT/USD',base:'XXBT',quote:'ZUSD',status:'online'}));
const ticker=api.parseKrakenTicker(responses[tickerURL],now);
assert.equal(ticker.price,tickerPrice);
assert.equal(ticker.lastTradeTimestamp,null,'Ticker has no trade timestamp to invent');
assert.match(ticker.stamp.label,/^consulta 20:12:31Z$/);
const parsed=api.parseKrakenOHLC(responses[ohlcURL],now);
assert.equal(parsed.window,'7D');
assert.equal(parsed.windowHours,168);
assert.equal(parsed.intervalMinutes,60);
assert.equal(parsed.rawWindowPointCount,168,'seven-day filter retains 168 hourly timestamps including the current candle');
assert.equal(parsed.closedPointCount,167,'cursor excludes the current 20:00 candle from closed history');
assert.equal(parsed.currentCandleExcluded,true);
assert.equal(parsed.excludedCurrentCandleTime,hourEnd);
assert.equal(parsed.points[0].stamp.time,Date.parse('2026-10-22T21:00:00Z'));
assert.equal(parsed.points.at(-1).stamp.time,Date.parse('2026-10-29T19:00:00Z'));
assert(parsed.points.every(point=>point.stamp.time<=parsed.cursorLastTime));

(async()=>{
const row=await api.loadBTCUSD(now);
assert.equal(row.asset.code,'BTC/USD');
assert.equal(row.asset.source,'Kraken');
assert.equal(row.asset.instrument,'XBTUSD');
assert.equal(row.asset.pair,'XBT/USD');
assert.equal(row.asset.quote,'ZUSD');
assert.equal(row.asset.unit,'USD/BTC');
assert.equal(row.asset.price,tickerPrice);
assert.equal(row.chart.points.length,167);
assert.equal(row.chart.currentCandleExcluded,true);
assert.equal(row.chartStatus,'valid-7D-closed-hourly');
assert.equal(row.variationReference.basis,'rolling24h-closed-hourly-v1');
assert.equal(row.variationReference.startTime,Date.parse('2026-10-28T20:00:00Z'));
assert.equal(row.variationReference.endTime,now,'24h variation ends at query time, not a fabricated trade timestamp');
assert.equal(row.variationReference.baseValue,106960);
assert.equal(row.asset.delta,tickerPrice-106960);
assert.equal(row.asset.percent,(tickerPrice/106960-1)*100);
assert.equal(api.validKrakenSnapshot(row,now),true);
assert.equal(api.validSnapshot(row,now),true);
assert.equal(api.unitText(row),'USD/BTC · 24H');
assert.equal(api.timeText(row),'consulta 20:12Z KR');
assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'BTC adapter does not alter the published eight-indicator order');
assert.deepEqual(Object.keys(responses).sort(),[pairURL,tickerURL,ohlcURL].sort());
assert(!Object.keys(responses).some(url=>/USDT|api[-_]key|apikey/i.test(url)),'no USDT or credential route is used');

assert.throws(()=>api.parseKrakenAssetPair({error:[],result:{XXBTZUSD:{altname:'XBTUSDT',wsname:'XBT/USDT',base:'XXBT',quote:'ZUSDT',status:'online'}}}),/não confirmado/);
assert.throws(()=>api.parseKrakenTicker({error:[],result:{XXBTZUSD:{}}},now),/ausente/);
assert.throws(()=>api.parseKrakenOHLC({error:['EAPI:Rate limit exceeded'],result:{}},now),/Resposta Kraken inválida/);
const malformed=JSON.parse(JSON.stringify(responses[ohlcURL]));
malformed.result.XXBTZUSD[10][2]='1';
assert.throws(()=>api.parseKrakenOHLC(malformed,now),/Candle Kraken inválido/);
const noClosed=JSON.parse(JSON.stringify(responses[ohlcURL]));
noClosed.result.last=String(Math.floor((hourEnd-167*3600000)/1000));
assert.throws(()=>api.parseKrakenOHLC(noClosed,now),/Mais de um candle Kraken em formação|sem duas observações fechadas/);

class FailingRequest {
  constructor(url){this.url=url;this.response={statusCode:503};}
  async loadJSON(){throw Error('offline fixture');}
}
const offlineFiles=new Map(),offlineFM={...fm,fileExists:file=>offlineFiles.has(file),readString:file=>offlineFiles.get(file),writeString:(file,value)=>offlineFiles.set(file,value)};
const offline=bundled.exports.createEngine({FileManager:{local:()=>offlineFM},Request:FailingRequest,Data:{},Timer:undefined},{family:'medium',now});
const unavailable=await offline.loadBTCUSD(now);
assert.equal(unavailable.asset.code,'BTC/USD');
assert.equal(unavailable.asset.price,null,'network failure does not invent a quote');
assert.equal(unavailable.chart,null);
assert.equal(unavailable.chartStatus,'Kraken-unavailable');
assert.equal(unavailable.quoteVerified,false);

console.log('PASS Kraken BTC/USD: public XBT/USD pair validation, closed hourly 7D window, partial-candle exclusion, query-time ticker semantics, rolling-24H variation, units, USDT/error rejection, offline fallback, and fixed-order isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
