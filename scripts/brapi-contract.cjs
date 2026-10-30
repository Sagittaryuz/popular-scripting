'use strict';

// Contract-only preparation for a future private server adapter.
// This module deliberately has no network transport and no credential value.
// The Scripting client must not call authenticated brapi endpoints directly.

const BRAPI_BASE='https://brapi.dev';
const SYMBOLS=Object.freeze({BBAS3:'BBAS3',BBDC4:'BBDC4',IBOV:'^BVSP'});
const WINDOW_DAYS=7;
const FREE_PLAN=Object.freeze({monthlyRequests:15000,concurrentRequests:1,maxAssetsPerRequest:1,refreshMinutes:30,maxHistoryMonths:3});

function finite(value){return typeof value==='number'&&Number.isFinite(value)}
function number(value){
  const parsed=typeof value==='number'?value:Number(String(value??'').trim().replace(',','.'));
  return finite(parsed)?parsed:null;
}
function localDay(time){
  if(!finite(time)||time<=0)return null;
  return new Date(time).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
}
function isoDayAdd(day,amount){
  if(typeof day!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day))return null;
  const time=Date.parse(day+'T12:00:00Z');
  if(!finite(time))return null;
  return new Date(time+amount*86400000).toISOString().slice(0,10);
}
function codeSymbol(code){
  if(!Object.prototype.hasOwnProperty.call(SYMBOLS,code))throw Error('Ativo brapi não permitido: '+code);
  return SYMBOLS[code];
}
function secureURL(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port)throw Error('Endpoint brapi inválido');
  return url;
}
function queryURL(path,query){
  const url=new URL(path,BRAPI_BASE);
  for(const [key,value] of Object.entries(query||{}))url.searchParams.set(key,String(value));
  return url.toString();
}

// This describes what a private backend would call. It is not a client request
// and never contains the value of BRAPI_API_KEY.
function serverRequestPlan(code){
  const symbol=codeSymbol(code);
  return Object.freeze({
    code,symbol,transport:'server-only',clientMayCallUpstream:false,plan:'free',budget:FREE_PLAN,scheduling:'serialize-upstream-calls',
    credential:{location:'server-environment',name:'BRAPI_API_KEY',header:'Authorization',scheme:'Bearer',valueIncluded:false},
    upstream:{method:'GET',url:queryURL('/api/quote/'+encodeURIComponent(symbol),{range:'7d',interval:'1d'}),includes:['quote','history','logo']},
    requestsPerRefresh:1
  });
}

function resultFor(payload,code){
  const symbol=codeSymbol(code),results=Array.isArray(payload?.results)?payload.results:[];
  const result=results.find(item=>item?.requestedSymbol===symbol||item?.symbol===symbol);
  const returned=result?.symbol||result?.data?.symbol,requested=result?.requestedSymbol||result?.data?.requestedSymbol||returned;
  if(!result||requested!==symbol||returned!==symbol)throw Error('Resposta brapi sem resultado exato para '+code);
  return {symbol,result,data:result.data&&typeof result.data==='object'?result.data:result};
}

function sourceStamp(value){
  const time=typeof value==='number'?value*1000:Date.parse(String(value??''));
  if(!finite(time)||time<=0)return null;
  const day=localDay(time);
  return day?{day,time,hasTime:true,label:day.slice(8)+'/'+day.slice(5,7)}:null;
}

function parseQuote(payload,code){
  const {symbol,data}=resultFor(payload,code),stamp=sourceStamp(data?.regularMarketTime);
  const price=number(data?.regularMarketPrice),delta=number(data?.regularMarketChange),percent=number(data?.regularMarketChangePercent);
  if(!data||!stamp||!finite(price)||price<=0||!finite(delta)||!finite(percent))throw Error('Cotação brapi incompleta para '+code);
  const iconURL=typeof data.logourl==='string'?data.logourl:typeof data.logo==='string'?data.logo:null;
  if(iconURL&&(!/^https:\/\//.test(iconURL)||secureURL(iconURL).hostname!=='icons.brapi.dev'))throw Error('Logo brapi fora do domínio documentado');
  return {code,symbol,source:'brapi',price,delta,percent,stamp,quoteBasis:'regular-market',percentBasis:'provider',...(iconURL?{iconURL,iconSource:'brapi-metadata'}:{})};
}

function parseHistory(payload,code,time=Date.now()){
  const {symbol,data}=resultFor(payload,code),queryDay=localDay(time),firstDay=isoDayAdd(queryDay,-(WINDOW_DAYS-1));
  const raw=data?.historicalDataPrice;
  if(!Array.isArray(raw))throw Error('Histórico brapi ausente para '+code);
  const byDay=new Map();
  for(const item of raw){
    const stamp=sourceStamp(item?.date),value=number(item?.adjustedClose??item?.close);
    if(!stamp||stamp.time>time||!finite(value)||value<=0)throw Error('Ponto histórico brapi inválido para '+code);
    if(stamp.day<firstDay||stamp.day>queryDay)continue;
    if(byDay.has(stamp.day))throw Error('Ponto histórico brapi duplicado para '+code);
    byDay.set(stamp.day,{value,stamp});
  }
  const points=[...byDay.values()].sort((a,b)=>a.stamp.time-b.stamp.time);
  return {code,symbol,source:'brapi',window:'7D',windowDays:WINDOW_DAYS,timeBasis:'trade-timestamp',closedOnly:true,sourceStartDay:firstDay,sourceEndDay:queryDay,points,chartStatus:points.length>=2?'valid-7D-daily':'price-only-7D'};
}

function parseLogoList(payload,codes=['BBAS3','BBDC4']){
  const wanted=new Set(codes),map={};
  for(const item of Array.isArray(payload?.stocks)?payload.stocks:[]){
    const code=String(item?.stock||'').trim();
    if(!wanted.has(code)||map[code]||typeof item?.logo!=='string')continue;
    const url=secureURL(item.logo.trim());
    if(url.hostname!=='icons.brapi.dev')throw Error('Logo brapi fora do domínio documentado');
    map[code]={iconURL:url.toString(),iconSource:'brapi-metadata'};
  }
  return map;
}

function mergeQuoteHistory(quotePayload,historyPayload,code,time=Date.now(),logoPayload=null){
  const quote=parseQuote(quotePayload,code),chart=parseHistory(historyPayload,code,time),logos=logoPayload?parseLogoList(logoPayload,[code]):{};
  const icon=quote.iconURL?{iconURL:quote.iconURL,iconSource:quote.iconSource}:logos[code]||{};
  return {asset:{code,source:'brapi',price:quote.price,delta:quote.delta,percent:quote.percent,quoteBasis:quote.quoteBasis,percentBasis:quote.percentBasis,...icon},stamp:quote.stamp,chart,quoteVerified:true,chartStatus:chart.chartStatus};
}

module.exports={BRAPI_BASE,SYMBOLS,WINDOW_DAYS,FREE_PLAN,serverRequestPlan,parseQuote,parseHistory,parseLogoList,mergeQuoteHistory,localDay,isoDayAdd};
