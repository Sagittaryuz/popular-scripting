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
const fredCSV=['observation_date,DCOILBRENTEU','2026-10-26,80.10','2026-10-27,81.20','2026-10-28,80.75','2026-10-29,82.05','2026-10-30,81.60'].join('\n');
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
    if(this.url.startsWith('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU'))return fredCSV;
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
  assert.equal(rows[1].asset.price,null,'Dow Jones is never filled with a proxy or invented quote');
  assert.equal(rows[1].sourceError,'dow-jones-authorized-feed-required');
  assert.equal(rows[1].chart,null);
  assert.equal(rows[2].asset.source,'AwesomeAPI');
  assert.equal(rows[2].asset.price,5.25,'USD/BRL uses the existing AwesomeAPI adapter');
  assert.equal(rows[2].chart.window,'7D');
  assert.equal(rows[3].asset.source,'EIA/FRED');
  assert.equal(rows[3].asset.name,'Petróleo');
  assert.equal(rows[3].asset.price,81.6,'Brent uses the real fixture payload without a hardcoded current value');
  assert.equal(rows[3].chart.window,'7D');
  assert.equal(rows[3].chart.timeBasis,'eod-civil-day');
  assert.equal(rows[3].chart.sourceStartDay,'2026-10-24');
  assert.equal(rows[3].chart.sourceEndDay,'2026-10-30');
  assert.equal(JSON.stringify(rows[3].chart.points.map(point=>point.stamp.day)),JSON.stringify(privateDays),'Brent chart keeps real daily observations and does not fill weekends');
  assert(requests.includes(privateURL));
  assert(requests.some(url=>url.startsWith('https://economia.awesomeapi.com.br/last/USD-BRL')));
  assert(requests.some(url=>url.startsWith('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU')));
  assert(!requests.some(url=>url.includes('^DJI')||url.includes('DOW')),'the unavailable Dow slot does not call an unverified endpoint');
  assert.equal(JSON.stringify(api.publishedProfileAssets.map(asset=>asset.code)),JSON.stringify(['IBOV','DOW_JONES','USD/BRL','BRENT']));
  assert.equal(JSON.stringify(api.fixedIndicatorCodes),JSON.stringify(['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']),'the former fixed list remains recoverable');
  const old=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:MockRequest,Data:{},Timer:undefined,privateMarket:{endpoint:privateURL,readToken:()=> 'fixture-private-token'}},{family:'medium',now:queryTime,localTestAssets:true});
  assert.equal(JSON.stringify(old.localTestAssets.map(asset=>asset.code)),JSON.stringify(['BBAS3','BBDC4','IBOV','BTC/USD']),'the previous profile remains available as an explicit engine default');
  console.log('PASS published market profile: IBOV/Dow/USD/Brent order, private IBOV, AwesomeAPI USD/BRL, EIA/FRED 7D EOD Brent, explicit Dow source gap, visible profile recovery, and no unverified Dow request.');
})().catch(error=>{console.error(error);process.exitCode=1;});
