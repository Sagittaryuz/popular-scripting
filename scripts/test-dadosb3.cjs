const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});

const now=Date.parse('2026-10-29T20:12:31Z'),asset={code:'BBAS3',type:'acoes',name:'Banco do Brasil',source:'DadosB3',currency:'BRL',unit:'BRL/ação',unitLabel:'BRL/ação',instrument:'BBAS3',instrumentConfirmed:true};
const files=new Map(),fm={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>files.has(file),createDirectory:()=>{},readString:file=>files.get(file),writeString:(file,value)=>files.set(file,value)};
const api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:class{},Data:{},Timer:undefined},{family:'medium',now,localTestAssets:true});
const payload={precos:[
  {data:'2026-10-22',precoFechamento:'22,10'},
  {data:'2026-10-23',precoFechamento:'22,20'},
  {data:'2026-10-26',precoFechamento:'22,30'},
  {data:'2026-10-27',precoFechamento:'22,40'},
  {data:'2026-10-28',precoFechamento:'22,50'}
]};

const row=api.parseDadosB3Rows(payload,asset,now);
assert.equal(api.dadosB3URL(asset,now),'https://dadosb3.com/empresas/BBAS3/precos?de=2026-10-21&ate=2026-10-29');
assert.equal(row.asset.source,'DadosB3');
assert.equal(row.asset.price,22.5);
assert.ok(Math.abs(row.asset.delta-.1)<1e-9);
assert.equal(row.asset.percent,(22.5/22.4-1)*100);
assert.equal(row.stamp.day,'2026-10-28');
assert.equal(row.stamp.hasTime,false,'the provider gives a civil EOD date, not a fabricated trade instant');
assert.equal(row.chart.window,'7D');
assert.equal(row.chart.timeBasis,'eod-civil-day');
assert.equal(row.chart.points.length,5);
assert.equal(api.validDadosB3Snapshot(row),true);
const metadataIconURL='https://dadosb3.com/logos/BBAS3.png',metadataRow=api.parseDadosB3Rows({metadata:{logoUrl:metadataIconURL},precos:payload.precos},asset,now);
assert.equal(metadataRow.asset.iconURL,metadataIconURL,'only an image URL explicitly supplied by API metadata is carried forward');
assert.equal(JSON.stringify(api.parseBrapiLogoMap({stocks:[{stock:'BBAS3',logo:'https://icons.brapi.dev/icons/BBAS3.svg'},{stock:'BBDC4',logo:'https://icons.brapi.dev/icons/BBDC4.svg'},{stock:'^BVSP',logo:'https://icons.brapi.dev/icons/BVSP.svg'}]})),JSON.stringify({
  BBAS3:{iconURL:'https://icons.brapi.dev/icons/BBAS3.svg',iconSource:'brapi-metadata'},
  BBDC4:{iconURL:'https://icons.brapi.dev/icons/BBDC4.svg',iconSource:'brapi-metadata'}
}),'Brapi logos use returned stock/logo fields and do not add an IBOV proxy');
const visible=api.displayChart(row.chart,now),coordinates=api.lineCoordinates(row.chart,46,20);
assert.equal(visible.displayStatus,'available-7d-eod');
assert.equal(visible.points.length,5);
assert.equal(coordinates.length,5);
assert.equal(coordinates[0].x,.75);
assert.equal(coordinates.at(-1).x,45.25);

const quoteOnly=api.parseDadosB3Rows({precos:[{data:'2026-10-28',precoFechamento:'22,50'}]},asset,now);
assert.equal(quoteOnly.asset.price,22.5,'a valid latest EOD close survives when there is not enough history for a curve');
assert.equal(quoteOnly.asset.percent,null);
assert.equal(quoteOnly.chart,null);
assert.equal(quoteOnly.chartStatus,'price-only-eod');
assert.equal(api.validDadosB3Snapshot(quoteOnly),true);

const iconFiles=new Map(),iconFM={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>iconFiles.has(file),createDirectory:()=>{},readString:file=>iconFiles.get(file),writeString:(file,value)=>iconFiles.set(file,value)},iconURL=metadataIconURL,iconBase64='iVBORw0KGgo'+'A'.repeat(80),iconRequests=[];
class IconRequest {
  constructor(url){this.url=url;this.response={statusCode:200};}
  async loadJSON(){iconRequests.push(this.url);return {metadata:{logoUrl:iconURL},precos:payload.precos};}
  async load(){iconRequests.push(this.url);return {toBase64String:()=>iconBase64};}
}
const iconApi=bundled.exports.createEngine({FileManager:{local:()=>iconFM},Request:IconRequest,Data:{},Timer:undefined},{family:'medium',now,force:true,localTestAssets:true});

assert.throws(()=>api.parseDadosB3Rows({precos:[{data:'2026-10-30',precoFechamento:'22,60'}]},asset,now),/Observação EOD/);
assert.throws(()=>api.parseDadosB3Rows({precos:[{data:'2026-10-28',precoFechamento:'22,50'},{data:'2026-10-28',precoFechamento:'22,60'}]},asset,now),/duplicada/);
assert.throws(()=>api.parseDadosB3Rows({precos:[]},asset,now),/sem fechamento/);

api.cacheWrite('dadosb3-eod-v1-BBAS3',row);
class FailingRequest {
  constructor(url){this.url=url;this.response={statusCode:503};}
  async loadJSON(){throw Error('offline DadosB3 fixture');}
}
const offline=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:FailingRequest,Data:{},Timer:undefined},{family:'medium',now,localTestAssets:true});
(async()=>{
  const iconRow=await iconApi.loadDadosB3(asset);
  assert.equal(iconRow.asset.iconURL,iconURL);
  assert.equal(iconRow.asset.iconData,iconBase64,'the API image is cached privately as an image payload, never versioned');
  assert.equal(iconRow.asset.iconSource,'api-metadata');
  assert.deepEqual(iconRequests,[api.dadosB3URL(asset,now),iconURL],'the image request follows the source metadata and does not invent a URL');
  const rows=await offline.collectRows();
  assert.equal(rows[0].asset.code,'BBAS3');
  assert.equal(rows[0].asset.price,22.5,'private cache preserves the last valid quote when the source is unavailable');
  assert.equal(rows[0].cached,true);
  assert.equal(rows[1].asset.price,null);
  assert.equal(rows[2].asset.price,null);
  console.log('PASS DadosB3 local adapter: exact direct URLs, EOD parsing, daily variation, seven-day real points, explicit date-only semantics, quote-only fallback, invalid/future/duplicate rejection, private cache preservation, and metadata-only image/cache fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
