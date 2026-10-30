const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
assert.match(fs.readFileSync(path.join(__dirname,'Popular Scripting','host.ts'),'utf8'),/api\.kraken\.com/,'the supported host allowlist includes the public Kraken transport');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});

const now=Date.parse('2026-10-29T20:12:31Z'),hourEnd=Date.parse('2026-10-29T20:00:00Z'),quoteAt=Date.parse('2026-10-28T20:00:00Z');
const b3Dates=['2026-10-22','2026-10-23','2026-10-26','2026-10-27','2026-10-28'];
const privateURL='https://popular-private-market-prep.mrpires72.workers.dev/v1/market';
const bbasLogoURL='https://icons.brapi.dev/icons/BBAS3.svg',bbdcLogoURL='https://icons.brapi.dev/icons/BBDC4.svg',syntheticIcon='iVBORw0KGgo'+'A'.repeat(80);
const bbasSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><circle cx="13" cy="13" r="13" fill="#007f4e"/><path fill="#fff" d="M6 7h14v3H6zm0 5h14v3H6zm0 5h10v3H6z"/></svg>';
const bbdcSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><circle cx="13" cy="13" r="13" fill="#c91429"/><path fill="#fff" d="M6 7h14v3H6zm0 5h10v3H6zm0 5h14v3H6z"/></svg>';
const pairURL='https://api.kraken.com/0/public/AssetPairs?pair=XBTUSD';
const tickerURL='https://api.kraken.com/0/public/Ticker?pair=XBTUSD';
const ohlcURL='https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60';
const candles=[];
for(let i=0;i<=168;i++){
  const at=hourEnd-(168-i)*3600000,close=50000+i*5;
  candles.push([Math.floor(at/1000),String(close-2),String(close+2),String(close-4),String(close),String(close-1),'4.2','3']);
}
const point=(day,value)=>({value,stamp:{day,time:Date.parse(day+'T20:00:00Z'),hasTime:true,label:day.slice(8)+'/'+day.slice(5,7)}});
const privatePayload={schema:1,source:'brapi',fetchedAt:now,delivery:'upstream',assets:[
  {asset:{code:'BBAS3',symbol:'BBAS3',source:'brapi',price:22.5,delta:.1,percent:(22.5/22.4-1)*100,quoteBasis:'regular-market',percentBasis:'provider',iconURL:bbasLogoURL,iconSource:'brapi-metadata'},stamp:{day:'2026-10-28',time:quoteAt,hasTime:true,label:'28/10'},chart:{source:'brapi',symbol:'BBAS3',window:'7D',windowDays:7,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:'2026-10-23',sourceEndDay:'2026-10-29',points:b3Dates.slice(1).map((day,index)=>point(day,22.2+index*.1))}},
  {asset:{code:'BBDC4',symbol:'BBDC4',source:'brapi',price:10.3,delta:.05,percent:(10.3/10.25-1)*100,quoteBasis:'regular-market',percentBasis:'provider',iconURL:bbdcLogoURL,iconSource:'brapi-metadata'},stamp:{day:'2026-10-28',time:quoteAt,hasTime:true,label:'28/10'},chart:{source:'brapi',symbol:'BBDC4',window:'7D',windowDays:7,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:'2026-10-23',sourceEndDay:'2026-10-29',points:b3Dates.slice(1).map((day,index)=>point(day,10.15+index*.05))}},
  {asset:{code:'IBOV',symbol:'^BVSP',source:'brapi',price:171000,delta:-2500,percent:(171000/173500-1)*100,quoteBasis:'regular-market',percentBasis:'provider'},stamp:{day:'2026-10-28',time:quoteAt,hasTime:true,label:'28/10'},chart:{source:'brapi',symbol:'^BVSP',window:'7D',windowDays:7,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:'2026-10-23',sourceEndDay:'2026-10-29',points:b3Dates.slice(1).map((day,index)=>point(day,170250+index*250))}}
]};
const responses={
  [privateURL]:privatePayload,
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
  async loadString(){
    if(this.url===bbasLogoURL){this.response={statusCode:200,contentType:'image/svg+xml'};return bbasSVG;}
    if(this.url===bbdcLogoURL){this.response={statusCode:200,contentType:'image/svg+xml'};return bbdcSVG;}
    throw Error('unexpected SVG fixture');
  }
  async load(){if(![bbasLogoURL,bbdcLogoURL].includes(this.url))throw Error('unexpected binary fixture');return {toBase64String:()=>syntheticIcon};}
}

(async()=>{
  const privateMarket={endpoint:privateURL,readToken:()=> 'widget-fixture-token-'.padEnd(64,'x')};
  const normal=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now});
  assert.equal(normal.localTestMode,false,'the test list is opt-in and cannot replace production by default');
  const api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  assert.equal(api.localTestMode,true);
  assert.equal(JSON.stringify(api.localTestAssets.map(asset=>asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  const rows=await api.collectRows();
  assert.throws(()=>api.parsePrivateMarketBundle({...privatePayload,assets:privatePayload.assets.map((row,index)=>index===0?{...row,chart:{...row.chart,sourceEndDay:'2026-10-28'}}:row)},now),/Janela privada inválida/,'the client rejects a bundle that relabels the seven-day window');
  assert(api.parsePrivateMarketBundle({...privatePayload,delivery:'stale-cache'},now).every(row=>row.cached===true),'backend stale-cache delivery is retained as a cached observation');
  assert.equal(JSON.stringify(rows.map(row=>row.asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  assert.equal(new Set(rows.map(row=>row.asset.code)).size,4,'local mode does not duplicate assets');
  assert(rows.slice(0,3).every(row=>row.localTest===true&&row.asset.source==='PrivateMarket'&&Number.isFinite(row.asset.price)&&row.chart?.window==='7D'&&row.chart?.timeBasis==='trade-timestamp'&&row.chart.points.length===4&&row.chart.sourceStartDay==='2026-10-23'&&row.chart.sourceEndDay==='2026-10-29'&&row.stamp.day==='2026-10-28'&&row.quoteVerified===true&&row.chartStatus==='valid-7D-daily'),'B3 rows use the authenticated private bundle');
  assert.equal(rows[0].asset.iconURL,bbasLogoURL,'BBAS3 uses the URL returned by Brapi metadata');
  assert.equal(rows[1].asset.iconURL,bbdcLogoURL,'BBDC4 uses the URL returned by Brapi metadata');
  assert.equal(rows[0].asset.iconSVGCode,bbasSVG,'BBAS3 uses the validated SVG body returned by its API URL');
  assert.equal(rows[1].asset.iconSVGCode,bbdcSVG,'BBDC4 uses the validated SVG body returned by its API URL');
  assert.equal(rows[0].asset.iconFormat,'svg-code');
  assert.equal(rows[1].asset.iconFormat,'svg-code');
  assert.equal(rows[0].asset.iconSource,'brapi-metadata');
  assert.equal(rows[1].asset.iconSource,'brapi-metadata');
  assert.equal(rows[2].asset.iconURL,undefined,'IBOV keeps the initials fallback because Brapi list has no IBOV logo');
  assert.equal(rows[0].asset.percent,(22.5/22.4-1)*100,'BBAS3 variation uses the last two real closes');
  assert.ok(Math.abs(rows[1].asset.delta-(10.3-10.25))<1e-9,'BBDC4 variation uses the last two real closes');
  assert.equal(rows[2].asset.price,171000,'IBOV uses points, not an ETF or proxy');
  assert.match(api.timeText(rows[0]),/^28\/10 API/,'private provider keeps the explicit observation date');
  assert.equal(api.displayChart(rows[0].chart,now).displayStatus,'available-7d','private provider observations remain drawable with their real timestamps');
  assert.equal(api.lineCoordinates(rows[0].chart,46,20).length,4,'private chart uses only real observations inside the current seven-day window');
  const btc=rows[3];
  assert.equal(btc.localTest,true);
  assert.equal(btc.asset.source,'Kraken');
  assert.equal(btc.asset.code,'BTC/USD');
  assert.equal(btc.asset.price,60000.25);
  assert.equal(btc.chart.window,'7D');
  assert.equal(btc.chart.points.length,167);
  assert.equal(btc.chart.currentCandleExcluded,true);
  assert.equal(btc.cached,undefined,'old cache does not leak into local test mode');
  assert.equal(api.privateMarketStatus.code,'fresh','a valid private bundle is reported without exposing token or response data');assert.equal(api.privateMarketStatus.cached,false);assert.equal(api.privateMarketStatus.at,now);
  assert.equal(JSON.stringify(requests),JSON.stringify([privateURL,bbasLogoURL,bbdcLogoURL,pairURL,tickerURL,ohlcURL]),'collectRows calls only the authenticated private bundle, returned Brapi logo URLs and Kraken for BTC; it does not call DadosB3 or public Brapi quote routes');
  assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'production order remains separate');
  assert.deepEqual(Array.from(await api.collectAdditionalRows()),[],'local mode disables catalog additions');

  const invalidFiles=new Map(),invalidFM={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>invalidFiles.has(file),createDirectory:()=>{},readString:file=>invalidFiles.get(file),writeString:(file,value)=>invalidFiles.set(file,value)};
  class InvalidSVGRequest extends MockRequest {
    async loadString(){
      if(this.url===bbasLogoURL){this.response={statusCode:200,contentType:'image/png'};return bbasSVG;}
      if(this.url===bbdcLogoURL){this.response={statusCode:200,contentType:'image/svg+xml'};return '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';}
      return super.loadString();
    }
  }
  const invalidSVG=bundled.exports.createEngine({FileManager:{local:()=>invalidFM},Request:InvalidSVGRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  const invalidIconRows=await invalidSVG.collectRows();
  assert.equal(invalidIconRows[0].asset.iconSVGCode,undefined,'an SVG MIME mismatch keeps the initials fallback path');
  assert.equal(invalidIconRows[1].asset.iconSVGCode,undefined,'unsafe SVG markup is rejected before native rendering');
  assert.equal(invalidIconRows[0].asset.iconFormat,'svg');
  assert.equal(invalidIconRows[1].asset.iconFormat,'svg');

  const placements=rows.map((row,index)=>({code:row.asset.code,column:Math.floor(index/4),line:index%4}));
  assert(placements.every(item=>item.column===0),'wide local layout keeps the four requested rows in one column');
  assert.equal(new Set(placements.map(item=>item.code)).size,4);

  class FailingRequest {
    constructor(url){this.url=url;this.response={statusCode:503};}
    async loadJSON(){throw Error('HTTP 503');}
  }
  const offlineFiles=new Map(),offlineFM={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>offlineFiles.has(file),createDirectory:()=>{},readString:file=>offlineFiles.get(file),writeString:(file,value)=>offlineFiles.set(file,value)};
  const offline=bundled.exports.createEngine({FileManager:{local:()=>offlineFM},Request:FailingRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  const offlineRows=await offline.collectRows();
  assert.equal(JSON.stringify(offlineRows.map(row=>row.asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']));
  assert(offlineRows.slice(0,3).every(row=>row.asset.source==='PrivateMarket'&&row.asset.price===null&&row.chart===null&&row.chartStatus==='PrivateMarket-unavailable'),'private endpoint failure keeps the B3 slots without inventing values');
  assert.equal(offlineRows[3].asset.price,null,'a previous BTC cache cannot replace the unavailable local test quote');
  assert.equal(offlineRows[3].chart,null);
  assert.equal(offlineRows[3].quoteVerified,false);
  assert.equal(offlineRows.some(row=>row.cached===true),false);
  assert.equal(offline.privateMarketStatus.code,'worker-unavailable','a Worker 5xx is distinguished from a parsing or token failure');assert.equal(offline.privateMarketStatus.cached,false);assert.equal(offline.privateMarketStatus.at,now);

  const emptyFM=()=>{const emptyFiles=new Map();return {documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>emptyFiles.has(file),createDirectory:()=>{},readString:file=>emptyFiles.get(file),writeString:(file,value)=>emptyFiles.set(file,value)}};
  const noToken=bundled.exports.createEngine({FileManager:{local:emptyFM},Request:MockRequest,Data:{},Timer:undefined,privateMarket:{endpoint:privateURL,readToken:()=>null}},{family:'medium',now,localTestAssets:true});
  const noTokenRows=await noToken.collectRows();
  assert(noTokenRows.slice(0,3).every(row=>row.sourceError==='private-market-token-missing'&&row.asset.price===null));
  assert.equal(noToken.privateMarketStatus.code,'token-missing','missing Keychain token is reported before any authenticated request');assert.equal(noToken.privateMarketStatus.cached,false);assert.equal(noToken.privateMarketStatus.at,now);

  class UnauthorizedRequest extends MockRequest { async loadJSON(){if(this.url===privateURL){this.response={statusCode:401};throw Error('HTTP 401')}return super.loadJSON()} }
  const unauthorized=bundled.exports.createEngine({FileManager:{local:emptyFM},Request:UnauthorizedRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  await unauthorized.collectRows();
  assert.equal(unauthorized.privateMarketStatus.code,'worker-unauthorized','a private endpoint 401 is not mislabeled as an absent token');assert.equal(unauthorized.privateMarketStatus.cached,false);assert.equal(unauthorized.privateMarketStatus.at,now);

  class UpstreamDiagnosticRequest extends MockRequest { async loadJSON(){if(this.url===privateURL){const error=Error('HTTP 503');error.privateMarketDiagnostic={upstreamStatus:403,upstreamAsset:'IBOV',upstreamCode:'INVALID_INTERVAL',token:'never-expose'};throw error}return super.loadJSON()} }
  const upstreamDiagnostic=bundled.exports.createEngine({FileManager:{local:emptyFM},Request:UpstreamDiagnosticRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  await upstreamDiagnostic.collectRows();
  assert.equal(upstreamDiagnostic.privateMarketStatus.code,'worker-unavailable');
  assert.equal(upstreamDiagnostic.privateMarketStatus.upstreamStatus,403,'a safe upstream status is retained for foreground diagnosis');
  assert.equal(upstreamDiagnostic.privateMarketStatus.upstreamAsset,'IBOV');
  assert.equal(upstreamDiagnostic.privateMarketStatus.upstreamCode,'INVALID_INTERVAL','the allow-listed upstream code is retained for foreground diagnosis');
  assert.equal(upstreamDiagnostic.privateMarketStatus.token,undefined,'credentials never enter the status snapshot');

  class UnsafeDiagnosticRequest extends MockRequest { async loadJSON(){if(this.url===privateURL){const error=Error('HTTP 503');error.privateMarketDiagnostic={upstreamStatus:400,upstreamAsset:'BBAS3',upstreamCode:'PRIVATE_INTERNAL',message:'never-expose'};throw error}return super.loadJSON()} }
  const unsafeDiagnostic=bundled.exports.createEngine({FileManager:{local:emptyFM},Request:UnsafeDiagnosticRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  await unsafeDiagnostic.collectRows();
  assert.equal(unsafeDiagnostic.privateMarketStatus.upstreamCode,undefined,'unknown upstream codes are discarded');
  assert.equal(unsafeDiagnostic.privateMarketStatus.message,undefined,'upstream messages never enter the status snapshot');

  class InvalidResponseRequest extends MockRequest { async loadJSON(){if(this.url===privateURL)return {schema:1};return super.loadJSON()} }
  const invalid=bundled.exports.createEngine({FileManager:{local:emptyFM},Request:InvalidResponseRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  const invalidRows=await invalid.collectRows();
  assert(invalidRows.slice(0,3).every(row=>row.sourceError==='private-market-invalid-response'));
  assert.equal(invalid.privateMarketStatus.code,'invalid-response','a response that fails the schema is distinguished from transport failure');assert.equal(invalid.privateMarketStatus.cached,false);assert.equal(invalid.privateMarketStatus.at,now);

  class CachedFailureRequest extends MockRequest { async loadJSON(){if(this.url===privateURL){this.response={statusCode:503};throw Error('HTTP 503')}return super.loadJSON()} }
  const cachedFailure=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:CachedFailureRequest,Data:{},Timer:undefined,privateMarket},{family:'medium',now,localTestAssets:true});
  const cachedRows=await cachedFailure.collectRows();
  assert(cachedRows.slice(0,3).every(row=>row.cached===true&&Number.isFinite(row.asset.price)),'a validated private cache remains usable after a Worker failure');
  assert.equal(cachedFailure.privateMarketStatus.code,'cache-fallback-worker-unavailable','cache fallback preserves the safe reason category');assert.equal(cachedFailure.privateMarketStatus.cached,true);assert.equal(cachedFailure.privateMarketStatus.at,now);

  console.log('PASS local test mode: authenticated private BBAS3/BBDC4/IBOV values and logos, seven-day real observations, quote/chart separation, BTCUSD order, no DadosB3/public-Brapi calls, private-cache isolation, no wide duplicates, offline fallback, and safe token/401/503/schema/cache diagnostics.');
})().catch(error=>{console.error(error);process.exitCode=1;});
