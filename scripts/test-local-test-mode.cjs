const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
assert.match(fs.readFileSync(path.join(__dirname,'Popular Scripting','host.ts'),'utf8'),/api\.kraken\.com/,'the supported host allowlist includes the public Kraken transport');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});

const now=Date.parse('2026-10-29T20:12:31Z'),hourEnd=Date.parse('2026-10-29T20:00:00Z');
const pairURL='https://api.kraken.com/0/public/AssetPairs?pair=XBTUSD';
const tickerURL='https://api.kraken.com/0/public/Ticker?pair=XBTUSD';
const ohlcURL='https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60';
const candles=[];
for(let i=0;i<=168;i++){
  const at=hourEnd-(168-i)*3600000,close=50000+i*5;
  candles.push([Math.floor(at/1000),String(close-2),String(close+2),String(close-4),String(close),String(close-1),'4.2','3']);
}
const responses={
  [pairURL]:{error:[],result:{XXBTZUSD:{altname:'XBTUSD',wsname:'XBT/USD',base:'XXBT',quote:'ZUSD',status:'online'}}},
  [tickerURL]:{error:[],result:{XXBTZUSD:{c:['60000.25','0.01']}}},
  [ohlcURL]:{error:[],result:{XXBTZUSD:candles,last:String(Math.floor((hourEnd-3600000)/1000))}}
};
const files=new Map([
  ['/documents/popular-widget-cache-v6/btc-usd-kraken-v1.json',JSON.stringify({asset:{code:'OLD-CACHE',price:1}})],
  ['/documents/popular-widget-cache-v6/ordering-v64.json',JSON.stringify({schema:1,mode:'fixed'})]
]);
const fm={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>files.has(file),createDirectory:()=>{},readString:file=>files.get(file),writeString:(file,value)=>files.set(file,value)};
const requests=[];
class MockRequest {
  constructor(url){this.url=url;this.response={statusCode:200};requests.push(url);}
  async loadJSON(){if(!responses[this.url])throw Error('unexpected URL '+this.url);return responses[this.url];}
}

(async()=>{
  const normal=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined},{family:'medium',now});
  assert.equal(normal.localTestMode,false,'the test list is opt-in and cannot replace production by default');
  const api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined},{family:'medium',now,localTestAssets:true});
  assert.equal(api.localTestMode,true);
  assert.equal(JSON.stringify(api.localTestAssets.map(asset=>asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  const rows=await api.collectRows();
  assert.equal(JSON.stringify(rows.map(row=>row.asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  assert.equal(new Set(rows.map(row=>row.asset.code)).size,4,'local mode does not duplicate assets');
  assert(rows.slice(0,3).every(row=>row.localTest===true&&row.asset.source==='B3'&&row.asset.price===null&&row.chart===null&&row.quoteVerified===false&&/source-unavailable$/.test(row.chartStatus)),'B3 slots are explicit unavailable rows');
  const btc=rows[3];
  assert.equal(btc.localTest,true);
  assert.equal(btc.asset.source,'Kraken');
  assert.equal(btc.asset.code,'BTC/USD');
  assert.equal(btc.asset.price,60000.25);
  assert.equal(btc.chart.window,'7D');
  assert.equal(btc.chart.points.length,167);
  assert.equal(btc.chart.currentCandleExcluded,true);
  assert.equal(btc.cached,undefined,'old cache does not leak into local test mode');
  assert.equal(JSON.stringify(requests),JSON.stringify([pairURL,tickerURL,ohlcURL]),'collectRows calls the Kraken adapter transport only');
  assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'production order remains separate');
  assert.deepEqual(Array.from(await api.collectAdditionalRows()),[],'local mode disables catalog additions');

  const placements=rows.map((row,index)=>({code:row.asset.code,column:Math.floor(index/4),line:index%4}));
  assert(placements.every(item=>item.column===0),'wide local layout keeps the four requested rows in one column');
  assert.equal(new Set(placements.map(item=>item.code)).size,4);

  class FailingRequest {
    constructor(url){this.url=url;this.response={statusCode:503};}
    async loadJSON(){throw Error('offline local fixture');}
  }
  const offline=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:FailingRequest,Data:{},Timer:undefined},{family:'medium',now,localTestAssets:true});
  const offlineRows=await offline.collectRows();
  assert.equal(JSON.stringify(offlineRows.map(row=>row.asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  assert.equal(offlineRows[3].asset.price,null,'a previous BTC cache cannot replace the unavailable local test quote');
  assert.equal(offlineRows[3].chart,null);
  assert.equal(offlineRows[3].quoteVerified,false);
  assert.equal(offlineRows.some(row=>row.cached===true),false);

  console.log('PASS local test mode: active BBAS3/BBDC4/IBOV/BTCUSD order, explicit B3-unavailable rows, collectRows-to-Kraken integration, no legacy cache leakage, no wide duplicates, and offline fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
