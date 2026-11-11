import {initDiagnostics,handleDiagnostics,diagnosticAlarm} from './diagnostics.mjs';
const BRAPI_BASE='https://brapi.dev';
const WINDOW_DAYS=7;
const CACHE_TTL_MS=30*60*1000;
const CACHE_ROW_ID=1;
export const ASSET_CODES=Object.freeze(['BBAS3','BBDC4','IBOV']);
export {CACHE_TTL_MS};
const SYMBOLS=Object.freeze({BBAS3:'BBAS3',BBDC4:'BBDC4',IBOV:'^BVSP'});
const UPSTREAM_CODES=new Set(['BAD_REQUEST','VALIDATION_ERROR','QUOTES_PER_REQUEST_EXCEEDED','INVALID_RANGE','INVALID_INTERVAL','MISSING_TOKEN','INVALID_TOKEN','FEATURE_NOT_AVAILABLE','MODULES_NOT_AVAILABLE','NOT_FOUND']);

function finite(value){return typeof value==='number'&&Number.isFinite(value)}
function number(value){
  const parsed=typeof value==='number'?value:Number(String(value??'').trim().replace(',','.'));
  return finite(parsed)?parsed:null;
}
function localDay(time){
  return finite(time)&&time>0?new Date(time).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}):null;
}
function isoDayAdd(day,amount){
  if(typeof day!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day))return null;
  const time=Date.parse(day+'T12:00:00Z');
  return finite(time)?new Date(time+amount*86400000).toISOString().slice(0,10):null;
}
function symbolFor(code){
  if(!Object.prototype.hasOwnProperty.call(SYMBOLS,code))throw Error('Ativo não permitido');
  return SYMBOLS[code];
}
function response(body,status=200,extra={}){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff',...extra}});
}
function textResponse(body,status,extra={}){
  return new Response(body,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff',...extra}});
}
function equalSecret(actual,expected){
  if(typeof actual!=='string'||typeof expected!=='string'||actual.length===0||expected.length===0)return false;
  const a=new TextEncoder().encode(actual),b=new TextEncoder().encode(expected),length=Math.max(a.length,b.length);
  let mismatch=a.length^b.length;
  for(let i=0;i<length;i++)mismatch|=(a[i%a.length]||0)^(b[i%b.length]||0);
  return mismatch===0;
}
function authorized(request,expected){
  const header=request.headers.get('authorization')||'';
  return header.startsWith('Bearer ')&&equalSecret(header.slice(7),expected);
}
function quoteURL(code){
  const url=new URL('/api/quote/'+encodeURIComponent(symbolFor(code)),BRAPI_BASE);
  url.searchParams.set('range','1mo');
  url.searchParams.set('interval','1d');
  return url.toString();
}
function sourceStamp(value){
  const time=typeof value==='number'?value*1000:Date.parse(String(value??'')),day=localDay(time);
  return finite(time)&&time>0&&day?{day,time,hasTime:true,label:day.slice(8)+'/'+day.slice(5,7)}:null;
}
function exactResult(payload,code){
  const symbol=symbolFor(code),results=Array.isArray(payload?.results)?payload.results:[],result=results.find(item=>item?.symbol===symbol);
  if(!result||result.symbol!==symbol)throw Error('Resposta brapi sem ativo exato');
  return {symbol,result};
}
function normalizeAsset(payload,code,queryTime){
  const {symbol,result}=exactResult(payload,code),price=number(result.regularMarketPrice),delta=number(result.regularMarketChange),percent=number(result.regularMarketChangePercent),stamp=sourceStamp(result.regularMarketTime),queryDay=localDay(queryTime),firstDay=isoDayAdd(queryDay,-(WINDOW_DAYS-1));
  if(!stamp||!finite(price)||price<=0||!finite(delta)||!finite(percent))throw Error('Cotação brapi inválida');
  const raw=Array.isArray(result.historicalDataPrice)?result.historicalDataPrice:[],byDay=new Map();
  for(const item of raw){
    const pointStamp=sourceStamp(item?.date),value=number(item?.adjustedClose??item?.close);
    if(!pointStamp||pointStamp.time>queryTime||!finite(value)||value<=0)throw Error('Histórico brapi inválido');
    if(pointStamp.day<firstDay||pointStamp.day>queryDay)continue;
    if(byDay.has(pointStamp.day))throw Error('Histórico brapi duplicado');
    byDay.set(pointStamp.day,{value,stamp:pointStamp});
  }
  const logo=typeof result.logourl==='string'&&/^https:\/\/icons\.brapi\.dev\//.test(result.logourl)?result.logourl:null;
  const points=[...byDay.values()].sort((a,b)=>a.stamp.time-b.stamp.time);
  return {asset:{code,symbol,source:'brapi',price,delta,percent,quoteBasis:'regular-market',percentBasis:'provider',...(logo?{iconURL:logo,iconSource:'brapi-metadata'}:{})},stamp,chart:{source:'brapi',symbol,window:'7D',windowDays:WINDOW_DAYS,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:firstDay,sourceEndDay:queryDay,points},quoteVerified:true,chartStatus:points.length>=2?'valid-7D-daily':'price-only-7D'};
}
async function fetchAsset(code,env,fetchImpl,queryTime){
  if(typeof env.BRAPI_API_KEY!=='string'||env.BRAPI_API_KEY.length===0)throw Error('BRAPI_API_KEY ausente');
  const result=await fetchImpl(quoteURL(code),{method:'GET',headers:{accept:'application/json',authorization:'Bearer '+env.BRAPI_API_KEY}});
  if(!result?.ok){
    const error=Object.assign(Error('Upstream indisponível'),{upstreamStatus:undefined,upstreamAsset:undefined,upstreamCode:undefined});
    if(Number.isInteger(result?.status)&&result.status>=400&&result.status<=599){error.upstreamStatus=result.status;error.upstreamAsset=code}
    try{const payload=await result.json();if(UPSTREAM_CODES.has(payload?.code))error.upstreamCode=payload.code}catch{}
    throw error;
  }
  return normalizeAsset(await result.json(),code,queryTime);
}
export async function refreshBundle(env,fetchImpl=globalThis.fetch,queryTime=Date.now()){
  const rows=[];
  // Keep the free-plan one-concurrent/one-asset rule explicit.
  for(const code of ASSET_CODES)rows.push(await fetchAsset(code,env,fetchImpl,queryTime));
  return {schema:1,source:'brapi',fetchedAt:queryTime,assets:rows};
}
function validBundle(value){
  return !!value&&value.schema===1&&value.source==='brapi'&&finite(value.fetchedAt)&&Array.isArray(value.assets)&&JSON.stringify(value.assets.map(row=>row?.asset?.code))===JSON.stringify(ASSET_CODES);
}
function cacheIsFresh(value,now){return validBundle(value)&&finite(now)&&now>=value.fetchedAt&&now-value.fetchedAt<CACHE_TTL_MS}

export class MarketCache {
  constructor(ctx,env){
    this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;this.inFlight=null;
    this.sql.exec('CREATE TABLE IF NOT EXISTS market_cache (id INTEGER PRIMARY KEY, fetched_at INTEGER NOT NULL, payload TEXT NOT NULL)');
  }
  async alarm(){return diagnosticAlarm(this.ctx,this.now())}
  now(){return typeof this.env.__TEST_NOW==='number'?this.env.__TEST_NOW:Date.now()}
  fetchImpl(){return this.env.__TEST_FETCH||globalThis.fetch}
  read(){
    const rows=this.sql.exec('SELECT fetched_at, payload FROM market_cache WHERE id = ?',CACHE_ROW_ID).toArray();
    const row=rows[0];
    if(!row)return null;
    try{const value=JSON.parse(row.payload);return validBundle(value)&&value.fetchedAt===row.fetched_at?value:null}catch{return null}
  }
  write(value){this.sql.exec('INSERT INTO market_cache (id, fetched_at, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET fetched_at = excluded.fetched_at, payload = excluded.payload',CACHE_ROW_ID,value.fetchedAt,JSON.stringify(value))}
  async fetch(request){
    if(request.method==='POST'){try{initDiagnostics(this.sql);return await handleDiagnostics(request,this.ctx,this.now())}catch{return response({code:'unavailable'},503)}}
    if(request.method!=='GET')return textResponse('Method Not Allowed',405,{'allow':'GET'});
    const now=this.now(),cached=this.read();
    if(cacheIsFresh(cached,now))return response({...cached,delivery:'cache'});
    if(!this.inFlight){
      const pending=refreshBundle(this.env,this.fetchImpl(),now).then(value=>{this.write(value);return value});
      this.inFlight=pending;
      pending.finally(()=>{if(this.inFlight===pending)this.inFlight=null}).catch(()=>{});
    }
    try{
      const value=await this.inFlight;
      return response({...value,delivery:cached?'upstream-refresh':'upstream'});
    }catch(error){
      if(cached)return response({...cached,delivery:'stale-cache',stale:true});
      const diagnostic=Number.isInteger(error?.upstreamStatus)&&error.upstreamStatus>=400&&error.upstreamStatus<=599&&ASSET_CODES.includes(error?.upstreamAsset)?{upstreamStatus:error.upstreamStatus,upstreamAsset:error.upstreamAsset}:{};
      if(diagnostic.upstreamStatus&&UPSTREAM_CODES.has(error?.upstreamCode))diagnostic.upstreamCode=error.upstreamCode;
      return response({error:'upstream-unavailable',...diagnostic},503);
    }
  }
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/v1/market'||url.search||url.hash)return textResponse('Not Found',404);
  if(request.method!=='GET'&&request.method!=='POST')return textResponse('Method Not Allowed',405,{'allow':'GET, POST'});
  if(typeof env?.WIDGET_TOKEN!=='string'||env.WIDGET_TOKEN.length===0)return response({error:'service-not-configured'},503);
  if(!authorized(request,env.WIDGET_TOKEN))return response({error:'unauthorized'},401,{'www-authenticate':'Bearer'});
  if(request.method==='GET'&&(typeof env.BRAPI_API_KEY!=='string'||env.BRAPI_API_KEY.trim().length===0))return response({error:'service-not-configured'},503);
  if(!env.MARKET_CACHE?.idFromName||!env.MARKET_CACHE?.get)return response({error:'cache-not-configured'},503);
  const id=env.MARKET_CACHE.idFromName('marcos-personal-market');
  return env.MARKET_CACHE.get(id).fetch(request);
}};
