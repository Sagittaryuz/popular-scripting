const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
assert.match(fs.readFileSync(path.join(__dirname,'Popular Scripting','host.ts'),'utf8'),/api\.kraken\.com/,'the supported host allowlist includes the public Kraken transport');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});

const now=Date.parse('2026-10-29T20:12:31Z'),hourEnd=Date.parse('2026-10-29T20:00:00Z');
const b3Dates=['2026-10-22','2026-10-23','2026-10-26','2026-10-27','2026-10-28'];
const bbasURL='https://dadosb3.com/empresas/BBAS3/precos?de=2026-10-21&ate=2026-10-29';
const bbdcURL='https://dadosb3.com/empresas/BBDC4/precos?de=2026-10-21&ate=2026-10-29';
const ibovURL='https://dadosb3.com/indices/IBOV/precos?de=2026-10-21&ate=2026-10-29';
const brapiURL='https://brapi.dev/api/quote/list',bbasLogoURL='https://icons.brapi.dev/icons/BBAS3.svg',bbdcLogoURL='https://icons.brapi.dev/icons/BBDC4.svg',syntheticIcon='iVBORw0KGgo'+'A'.repeat(80);
const pairURL='https://api.kraken.com/0/public/AssetPairs?pair=XBTUSD';
const tickerURL='https://api.kraken.com/0/public/Ticker?pair=XBTUSD';
const ohlcURL='https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60';
const candles=[];
for(let i=0;i<=168;i++){
  const at=hourEnd-(168-i)*3600000,close=50000+i*5;
  candles.push([Math.floor(at/1000),String(close-2),String(close+2),String(close-4),String(close),String(close-1),'4.2','3']);
}
const responses={
  [brapiURL]:{stocks:[{stock:'BBAS3',logo:bbasLogoURL},{stock:'BBDC4',logo:bbdcLogoURL},{stock:'^BVSP',logo:'https://icons.brapi.dev/icons/BVSP.svg'}]},
  [bbasURL]:{precos:b3Dates.map((data,index)=>({data,precoFechamento:(22.1+index*.1).toFixed(2)}))},
  [bbdcURL]:{precos:b3Dates.map((data,index)=>({data,precoFechamento:(10.1+index*.05).toFixed(2)}))},
  [ibovURL]:{precos:b3Dates.map((data,index)=>({data,precoFechamento:String(170000+index*250)}))},
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
  async load(){if(![bbasLogoURL,bbdcLogoURL].includes(this.url))throw Error('unexpected binary fixture');return {toBase64String:()=>syntheticIcon};}
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
  assert(rows.slice(0,3).every(row=>row.localTest===true&&row.asset.source==='DadosB3'&&Number.isFinite(row.asset.price)&&row.chart?.window==='7D'&&row.chart?.timeBasis==='eod-civil-day'&&row.chart.points.length===5&&row.stamp.day==='2026-10-28'&&row.quoteVerified===true&&row.chartStatus==='valid-7D-eod'),'B3 rows use the direct EOD adapter');
  assert.equal(rows[0].asset.iconURL,bbasLogoURL,'BBAS3 uses the URL returned by Brapi metadata');
  assert.equal(rows[1].asset.iconURL,bbdcLogoURL,'BBDC4 uses the URL returned by Brapi metadata');
  assert.equal(rows[0].asset.iconSource,'brapi-metadata');
  assert.equal(rows[1].asset.iconData,syntheticIcon,'logo bytes remain a private cache payload');
  assert.equal(rows[2].asset.iconURL,undefined,'IBOV keeps the initials fallback because Brapi list has no IBOV logo');
  assert.equal(rows[0].asset.percent,(22.5/22.4-1)*100,'BBAS3 variation uses the last two real closes');
  assert.equal(rows[1].asset.delta,10.3-10.25,'BBDC4 variation uses the last two real closes');
  assert.equal(rows[2].asset.price,171000,'IBOV uses points, not an ETF or proxy');
  assert.equal(api.timeText(rows[0]),'28/10 B3†','EOD observation keeps the explicit supplier date and stale-data marker');
  assert.equal(api.displayChart(rows[0].chart,now).displayStatus,'available-7d-eod','EOD observations remain drawable without inventing an intraday timestamp');
  assert.equal(api.lineCoordinates(rows[0].chart,46,20).length,5,'EOD chart uses the real five observations');
  const btc=rows[3];
  assert.equal(btc.localTest,true);
  assert.equal(btc.asset.source,'Kraken');
  assert.equal(btc.asset.code,'BTC/USD');
  assert.equal(btc.asset.price,60000.25);
  assert.equal(btc.chart.window,'7D');
  assert.equal(btc.chart.points.length,167);
  assert.equal(btc.chart.currentCandleExcluded,true);
  assert.equal(btc.cached,undefined,'old cache does not leak into local test mode');
  assert.equal(JSON.stringify(requests),JSON.stringify([brapiURL,bbasURL,bbasLogoURL,bbdcURL,bbdcLogoURL,ibovURL,pairURL,tickerURL,ohlcURL]),'collectRows calls Brapi only for metadata, DadosB3 for quotes and Kraken for BTC');
  assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'production order remains separate');
  assert.deepEqual(Array.from(await api.collectAdditionalRows()),[],'local mode disables catalog additions');

  const placements=rows.map((row,index)=>({code:row.asset.code,column:Math.floor(index/4),line:index%4}));
  assert(placements.every(item=>item.column===0),'wide local layout keeps the four requested rows in one column');
  assert.equal(new Set(placements.map(item=>item.code)).size,4);

  class FailingRequest {
    constructor(url){this.url=url;this.response={statusCode:503};}
    async loadJSON(){throw Error('offline local fixture');}
  }
  const offlineFiles=new Map(),offlineFM={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>offlineFiles.has(file),createDirectory:()=>{},readString:file=>offlineFiles.get(file),writeString:(file,value)=>offlineFiles.set(file,value)};
  const offline=bundled.exports.createEngine({FileManager:{local:()=>offlineFM},Request:FailingRequest,Data:{},Timer:undefined},{family:'medium',now,localTestAssets:true});
  const offlineRows=await offline.collectRows();
  assert.equal(JSON.stringify(offlineRows.map(row=>row.asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  assert(offlineRows.slice(0,3).every(row=>row.asset.source==='DadosB3'&&row.asset.price===null&&row.chart===null&&row.chartStatus==='DadosB3-unavailable'),'DadosB3 failure keeps the B3 slots without inventing values');
  assert.equal(offlineRows[3].asset.price,null,'a previous BTC cache cannot replace the unavailable local test quote');
  assert.equal(offlineRows[3].chart,null);
  assert.equal(offlineRows[3].quoteVerified,false);
  assert.equal(offlineRows.some(row=>row.cached===true),false);

  console.log('PASS local test mode: DadosB3 EOD BBAS3/BBDC4/IBOV values and variations, seven-day real observations, quote/chart separation, BTCUSD order, private-cache isolation, no wide duplicates, and offline fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
