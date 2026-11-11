import assert from 'node:assert/strict';
import {ASSET_CODES,CACHE_TTL_MS,MarketCache,default as worker} from '../src/worker.mjs';
import {requestPrivateMarket} from '../src/client-contract.mjs';

const now=Date.parse('2026-10-29T20:12:31Z');
const day=value=>Math.floor(Date.parse(value+'T12:00:00Z')/1000);
const fixtures={
  BBAS3:{price:22.5,change:.1,percent:.44,logo:'https://icons.brapi.dev/icons/BBAS3.svg',base:22.1},
  BBDC4:{price:10.3,change:.05,percent:.49,logo:'https://icons.brapi.dev/icons/BBDC4.svg',base:10.1},
  '^BVSP':{price:171000,change:-2500,percent:-1.44,base:170000}
};
const dates=['2026-10-22','2026-10-23','2026-10-26','2026-10-27','2026-10-28'];
function payload(symbol){
  const item=fixtures[symbol];
  return {results:[{symbol,regularMarketPrice:item.price,regularMarketChange:item.change,regularMarketChangePercent:item.percent,regularMarketTime:'2026-10-28T20:00:00.000Z',...(item.logo?{logourl:item.logo}:{}),historicalDataPrice:dates.map((date,index)=>({date:day(date),close:item.base+index,adjustedClose:item.base+index}))}]};
}
class FakeSQL {
  constructor(){this.row=null;this.statements=[]}
  exec(sql,...args){
    this.statements.push(sql);
    if(/^SELECT/.test(sql))return {toArray:()=>this.row?[this.row]:[]};
    if(/^INSERT/.test(sql)){this.row={fetched_at:args[1],payload:args[2]};return {toArray:()=>[]};}
    return {toArray:()=>[]};
  }
}
class FakeState {constructor(){this.storage={sql:new FakeSQL()}}}
function request(token='widget-fixture-token'){return new Request('https://private.invalid/v1/market',{headers:token?{authorization:'Bearer '+token}:{}})}
function responseFor(symbol){return {ok:true,status:200,json:async()=>payload(symbol)}}

let calls=[];
const fetchFixture=async(url,options)=>{
  calls.push({url,options});
  const symbol=decodeURIComponent(new URL(url).pathname.split('/').at(-1));
  assert.equal(options.headers.authorization,'Bearer brapi-fixture-key');
  return responseFor(symbol);
};
const runtime={WIDGET_TOKEN:'widget-fixture-token',BRAPI_API_KEY:'brapi-fixture-key',__TEST_NOW:now,__TEST_FETCH:fetchFixture};
const state=new FakeState(),object=new MarketCache(state,runtime),stub={fetch:request=>object.fetch(request)};
let lookedUp=0;
const namespace={idFromName:name=>{lookedUp++;assert.equal(name,'marcos-personal-market');return 'fixture-id'},get:id=>{assert.equal(id,'fixture-id');return stub}};
const env={...runtime,MARKET_CACHE:namespace};

const denied=await worker.fetch(request('wrong-token'),env);
assert.equal(denied.status,401);
assert.equal(lookedUp,0,'authentication happens before Durable Object access');
assert.equal(calls.length,0,'unauthorized requests never reach upstream');
const missingProvider=await worker.fetch(request(),{...env,BRAPI_API_KEY:''});
assert.equal(missingProvider.status,503);
assert.equal(lookedUp,0,'missing provider key must not access cache');

const first=await worker.fetch(request(),env),firstBody=await first.json();
assert.equal(first.status,200);
assert.equal(firstBody.delivery,'upstream');
assert.deepEqual(firstBody.assets.map(row=>row.asset.code),ASSET_CODES);
assert.equal(calls.length,3,'one sequential upstream request per asset');
assert.equal(calls[0].url,'https://brapi.dev/api/quote/BBAS3?range=1mo&interval=1d');
assert.equal(calls[2].url,'https://brapi.dev/api/quote/%5EBVSP?range=1mo&interval=1d');
assert.equal(firstBody.assets[0].chart.sourceStartDay,'2026-10-23');
assert.deepEqual(firstBody.assets[0].chart.points.map(point=>point.stamp.day),dates.slice(1));
assert.equal(firstBody.assets[0].asset.price,22.5);
assert.equal(firstBody.assets[0].asset.percent,.44);
assert.equal(firstBody.assets[0].stamp.day,'2026-10-28');
assert.equal(firstBody.assets[2].asset.iconURL,undefined,'IBOV never gets an invented ETF logo');
assert.equal(JSON.stringify(firstBody).includes('historicalDataPrice'),false,'raw upstream payload is not returned');

const cached=await worker.fetch(request(),env),cachedBody=await cached.json();
assert.equal(cachedBody.delivery,'cache');
assert.equal(calls.length,3,'fresh Durable Object SQLite cache avoids upstream calls');

const noSecretState=new FakeState(),noSecret=new MarketCache(noSecretState,{...runtime,BRAPI_API_KEY:''});
const noSecretResponse=await noSecret.fetch(request());
assert.equal(noSecretResponse.status,503);
assert.equal(noSecretState.storage.sql.row,null,'configuration failure does not write a cache');

const failedObject=new MarketCache(new FakeState(),{...runtime,__TEST_FETCH:async()=>new Response('private upstream body',{status:403,headers:{'x-private':'hidden'}})});
const failedEnv={...env,MARKET_CACHE:{idFromName:()=>1,get:()=>failedObject}};
const failedResponse=await worker.fetch(request(),failedEnv);
assert.equal(failedResponse.status,503);
assert.deepEqual(await failedResponse.json(),{error:'upstream-unavailable',upstreamStatus:403,upstreamAsset:'BBAS3'});
const rejected=await worker.fetch(new Request('https://private.invalid/v1/market'),failedEnv);
assert.equal(rejected.status,401);
assert.deepEqual(await rejected.json(),{error:'unauthorized'});
for(const [code,expected] of [['INVALID_RANGE','INVALID_RANGE'],['secret-token-in-code',undefined]]){
  const object=new MarketCache(new FakeState(),{...runtime,__TEST_FETCH:async()=>new Response(JSON.stringify({code,message:'secret-token-in-message',details:'secret-token-in-details'}),{status:400})});
  const result=await object.fetch(request()),body=await result.json();
  assert.equal(body.upstreamStatus,400);assert.equal(body.upstreamAsset,'BBAS3');assert.equal(body.upstreamCode,expected);
  assert.equal(JSON.stringify(body).includes('secret-token'),false);
}
const networkObject=new MarketCache(new FakeState(),{...runtime,__TEST_FETCH:async()=>{throw Error('private network detail')}});
const networkResponse=await networkObject.fetch(request());
assert.deepEqual(await networkResponse.json(),{error:'upstream-unavailable'});

let gateResolve;
const gate=new Promise(resolve=>{gateResolve=resolve});
let concurrentCalls=0;
const slowFetch=async(url,options)=>{concurrentCalls++;await gate;const symbol=decodeURIComponent(new URL(url).pathname.split('/').at(-1));return responseFor(symbol)};
const concurrentState=new FakeState(),concurrent=new MarketCache(concurrentState,{...runtime,__TEST_NOW:now+CACHE_TTL_MS+1,__TEST_FETCH:slowFetch});
const p1=concurrent.fetch(request()),p2=concurrent.fetch(request());
await Promise.resolve();
assert.equal(concurrentCalls,1,'concurrent refreshes share one in-flight upstream sequence');
gateResolve();
const [r1,r2]=await Promise.all([p1,p2]);
assert.equal(r1.status,200);assert.equal(r2.status,200);assert.equal(concurrentCalls,3);

const staleState=new FakeState(),stale=new MarketCache(staleState,{...runtime,__TEST_NOW:now+CACHE_TTL_MS+1,__TEST_FETCH:async()=>{throw Error('fixture offline')}});
staleState.storage.sql.row={fetched_at:now,payload:JSON.stringify(firstBody)};
const staleResponse=await stale.fetch(request()),staleBody=await staleResponse.json();
assert.equal(staleResponse.status,200);assert.equal(staleBody.delivery,'stale-cache');assert.equal(staleBody.stale,true);

await assert.rejects(()=>requestPrivateMarket({endpoint:'https://brapi.dev',widgetToken:'fixture'}),/diretamente/);
let clientRequest;
const clientBundle=await requestPrivateMarket({endpoint:'https://private.invalid',widgetToken:'widget-fixture-token',fetchImpl:async(url,options)=>{clientRequest={url:String(url),options};return {ok:true,json:async()=>firstBody}}});
assert.deepEqual(clientBundle.assets.map(row=>row.asset.code),ASSET_CODES);
assert.equal(clientRequest.url,'https://private.invalid/v1/market');
assert.equal(clientRequest.options.headers.authorization,'Bearer widget-fixture-token');
console.log('PASS private Worker prep: auth-before-cache, server-only BRAPI key, serialized one-asset upstream calls, SQLite cache TTL, singleflight, stale fallback, no raw payload/proxy, exact ^BVSP and configurable client endpoint.');
