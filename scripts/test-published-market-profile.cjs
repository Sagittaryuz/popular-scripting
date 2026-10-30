const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const root=path.join(__dirname,'Popular Scripting');
const entry=path.join(root,'original-engine.js');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console:{log(){}},Date,URL,Intl,Math,JSON,Set,Map});

const queryTime=Date.parse('2026-10-30T18:00:00Z');
const privateURL='https://popular-private-market-prep.mrpires72.workers.dev/v1/market';
const dayStamp=(day,hour=17)=>({day,time:Date.parse(`${day}T${String(hour).padStart(2,'0')}:00:00Z`),hasTime:true,label:day.slice(8)+'/'+day.slice(5)});
const privateDays=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30'];
const privatePayload={schema:1,source:'brapi',fetchedAt:queryTime-15*60000,delivery:'upstream',assets:['BBAS3','BBDC4','IBOV'].map((code,index)=>{
  const symbol=code==='IBOV'?'^BVSP':code,base=code==='IBOV'?170000:20+index*4,step=code==='IBOV'?200:.1;
  return {asset:{code,symbol,source:'brapi',price:base+step*4,delta:step,percent:(step/(base+step*3))*100,quoteBasis:'regular-market',percentBasis:'provider'},stamp:dayStamp('2026-10-30'),chart:{source:'brapi',symbol,window:'7D',windowDays:7,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:'2026-10-24',sourceEndDay:'2026-10-30',points:privateDays.map((day,i)=>({value:base+step*i,stamp:dayStamp(day)}))}};
})};
const fxPayload={USDBRL:{code:'USD',codein:'BRL',bid:'5.25',ask:'5.26',pctChange:'0.4',timestamp:String(Math.floor((queryTime-30*60000)/1000))}};
const fxHistory=[0,1,2].map(i=>({code:'USD',codein:'BRL',bid:String(5.2+i*.02),timestamp:String(Math.floor((queryTime-(2-i)*3600000)/1000))}));
const files=new Map();
const fm={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>files.has(file),createDirectory:()=>{},readString:file=>files.get(file),writeString:(file,value)=>files.set(file,value)};
const requests=[];
class MockRequest {
  constructor(url){this.url=String(url);this.response={statusCode:200};this.headers={};requests.push(this.url);}
  async loadJSON(){
    if(this.url===privateURL)return privatePayload;
    if(this.url==='https://economia.awesomeapi.com.br/last/USD-BRL')return fxPayload;
    if(this.url==='https://economia.awesomeapi.com.br/USD-BRL/100')return fxHistory;
    throw Error('unexpected JSON URL '+this.url);
  }
  async loadString(){
    throw Error('unexpected string URL '+this.url);
  }
}

(async()=>{
  const api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined,privateMarket:{endpoint:privateURL,readToken:()=> 'fixture-private-token'}},{family:'medium',force:true,now:queryTime,localTestAssets:true,localTestProfile:'ibov-dow-usd-brent-7d'});
  assert.equal(api.localTestMode,true);
  assert.equal(api.localTestProfile,'ibov-dow-usd-brent-7d');
  assert.equal(JSON.stringify(api.localTestAssets.map(asset=>asset.code)),JSON.stringify(['IBOV','DOW_JONES','USD/BRL','BRENT']));
  const rows=await api.collectRows();
  assert.equal(JSON.stringify(rows.map(row=>row.asset.code)),JSON.stringify(['IBOV','DOW_JONES','USD/BRL','BRENT']),'the active profile preserves the requested order');
  assert.equal(JSON.stringify(rows.map(row=>api.displayName(row.asset))),JSON.stringify(['Ibovespa','Dow Jones','Dólar','Petróleo']));
  assert.equal(rows[0].asset.source,'PrivateMarket','IBOV reuses the existing private Worker bundle');
  assert.equal(rows[0].asset.price,170800,'IBOV comes from the private response, not an ETF');
  assert.equal(rows[0].asset.percentBasis,'provider','daily variation remains a quote field, separate from the weekly chart');
  assert.equal(rows[0].chart,null,'daily private observations are not relabeled as a weekly intraday chart');
  assert.equal(rows[0].chartStatus,'intraday-7d-unavailable');
  assert.equal(rows[1].asset.price,null,'Dow Jones is never filled with a proxy or invented quote');
  assert.equal(rows[1].asset.source,'FRED/S&P DJI','Dow source provenance is explicit even while the copyrighted series is not requested');
  assert.equal(rows[1].asset.instrument,'DJIA');
  assert.equal(rows[1].asset.sourceRights,'third-party-copyright-permission-required');
  assert.equal(rows[1].sourceError,'dow-jones-reproduction-permission-required');
  assert.equal(rows[1].chart,null);
  assert.equal(rows[2].asset.source,'AwesomeAPI');
  assert.equal(rows[2].asset.price,5.25,'USD/BRL uses the existing AwesomeAPI adapter');
  assert.equal(rows[2].asset.percent,0.4,'the daily FX variation remains available without a fabricated chart');
  assert.equal(rows[2].chart,null,'the unauthenticated 100-sample FX response cannot cover seven intraday days');
  assert.equal(rows[2].chartStatus,'intraday-7d-unavailable');
  assert.equal(rows[3].asset.source,'ICE Futures Europe');
  assert.equal(rows[3].asset.name,'Petróleo');
  assert.equal(rows[3].asset.instrument,'BRN');
  assert.equal(rows[3].asset.contract,'BRN Jan-27');
  assert.equal(rows[3].asset.contractMonth,'2027-01');
  assert.equal(rows[3].asset.contractSymbol,'B');
  assert.equal(api.unitText(rows[3]),'BRN Jan-27','the visible secondary label identifies the requested future');
  assert.equal(api.timeText(rows[3]),'— ICE','the unavailable source is labeled without pretending to have a close time');
  assert.equal(rows[3].asset.price,null,'the requested future is not filled with an EIA spot value');
  assert.equal(rows[3].chart,null,'no authorized ICE intraday feed is available to draw the requested week');
  assert.equal(rows[3].sourceError,'brent-jan-2027-intraday-feed-required');
  assert(requests.includes(privateURL));
  assert(requests.some(url=>url.startsWith('https://economia.awesomeapi.com.br/last/USD-BRL')));
  assert(!requests.some(url=>url.startsWith('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU')),'the active profile does not fetch the wrong Brent spot instrument');
  assert(!requests.some(url=>url.includes('^DJI')||url.includes('DOW')),'the unavailable Dow slot does not call an unverified endpoint');
  assert.equal(JSON.stringify(api.publishedProfileAssets.map(asset=>asset.code)),JSON.stringify(['IBOV','DOW_JONES','USD/BRL','BRENT']));
  assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'the former fixed list remains recoverable');
  const old=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined,privateMarket:{endpoint:privateURL,readToken:()=> 'fixture-private-token'}},{family:'medium',now:queryTime,localTestAssets:true});
  assert.equal(JSON.stringify(old.localTestAssets.map(asset=>asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']),'the previous profile remains available as an explicit engine default');
  const intradayDays=['2026-10-24','2026-10-25','2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30'];
  const validIntraday={asset:{code:'fixture',price:100,percent:1,percentBasis:'provider'},chart:{source:'fixture',points:intradayDays.flatMap((day,index)=>[10,16].map(hour=>({value:100+index+hour/100,stamp:dayStamp(day,hour)})))}};
  const accepted=api.profileIntradaySevenDay(validIntraday,queryTime);
  assert.equal(accepted.chartStatus,'valid-7D-intraday','a real multi-session intraday fixture remains drawable');
  assert.equal(accepted.chart.timeBasis,'intraday-7d');
  assert.equal(accepted.chart.points.length,14);
  assert.equal(accepted.chartCoverage.coverageDays,6.25);
  console.log('PASS published market profile: requested IBOV/Dow/USD/ICE Jan-2027 order, daily variation kept separate, no EIA spot substitution or fabricated 7D chart, real intraday validator, recoverable prior profile, and no unverified requests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
