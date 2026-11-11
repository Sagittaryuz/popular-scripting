import { sanitizeDiagnosticBatch, sanitizeDiagnosticEvent, DiagnosticBatch, DiagnosticEvent } from './diagnostics-schema'
import { PRIVATE_MARKET_ENDPOINT, readPrivateMarketTokenState } from './private-market'
// Server deployed; schema tests and private administrative read-back verified.
// Native iPhone delivery still needs its first run. No new destination or token.
export const REMOTE_DIAGNOSTICS_ENABLED=true
const QUEUE_KEY='popular-diagnostics-queue-v1',STATUS_KEY='popular-diagnostics-status-v1'
const TTL=24*3600000,INTERVAL=5*60000,TIMEOUT=1200
let pending:Promise<string>|null=null
function read(key:string){try{return Storage.get<any>(key)}catch{return null}}
function write(key:string,value:unknown){try{Storage.set(key,value)}catch{}}
function validTime(t:unknown):t is number{return typeof t==='number'&&Number.isSafeInteger(t)&&t>1577836800000&&t<4102444800000}
function queue(version:string,engineVersion:string):DiagnosticBatch{
  const previous=sanitizeDiagnosticBatch(read(QUEUE_KEY)),now=Date.now()
  return {schema:1,version,engineVersion,events:previous?.version===version&&previous?.engineVersion===engineVersion?previous.events.filter(e=>e.at<=now&&now-e.at<=TTL):[]}
}
export function recordDiagnostic(version:string,engineVersion:string,event:unknown){
  const item=sanitizeDiagnosticEvent(event);if(!item)return
  const batch=queue(version,engineVersion);batch.events.push(item);batch.events=batch.events.slice(-32)
  const safe=sanitizeDiagnosticBatch(batch);if(safe)write(QUEUE_KEY,safe)
}
const ASSETS:Record<string,string>={IBOV:'IBOV',DOW_JONES:'DOW','USD/BRL':'USD',BRENT:'BRENT'}
const CODES:Record<string,string>={ok:'ok',network:'network',timeout:'timeout',http:'http',json:'parse',identity:'invalid-symbol',price:'unavailable','quote-time':'unavailable','quote-future':'future-timestamp','quote-old':'stale',sessions:'no-points','series-conflict':'unavailable','series-mismatch':'unavailable'}
export function recordProcessingResult(model:any){
  const version=model?.version,engineVersion=model?.sourceVersion,at=Date.now()
  if(!sanitizeDiagnosticBatch({schema:1,version,engineVersion,events:[]}))return
  for(const row of Array.isArray(model?.rows)?model.rows.slice(0,4):[]){
    const asset=ASSETS[row?.asset?.code];if(!asset)continue
    const d=row?.intradayDiagnostic||{},receivedAt=d.localReceiptTime,sourceAt=d.regularMarketTime,cacheOnly=row.intradayDelivery==='cache',usedCache=cacheOnly||row.cached===true
    if(!cacheOnly&&d.code)recordDiagnostic(version,engineVersion,{stage:'response',at,asset,code:CODES[d.code]||'unavailable',httpStatus:d.httpStatus,receivedAt,sourceAt,clockOffsetSeconds:Number.isFinite(d.serverMinusReceiptMS)?Math.round(d.serverMinusReceiptMS/1000):undefined})
    recordDiagnostic(version,engineVersion,{stage:usedCache?'cache':'validate',at,asset,code:usedCache?'cache-used':d.validationClock==='provider-http-date'&&Math.abs(d.serverMinusReceiptMS)>1000?'clock-adjusted':row.chartCoverage?.complete===false?'partial-window':row.quoteVerified?'ok':'unavailable',cache:usedCache?'hit':row.quoteVerified?'written':'miss',pointCount:Array.isArray(row.chart?.points)?row.chart.points.length:0,sourceAt:row.stamp?.time,receivedAt:row.fetchedAt})
  }
  recordDiagnostic(version,engineVersion,{stage:'complete',at,code:'ok'})
}
function status(state:string,at=Date.now(),httpStatus?:number){
  const previous=read(STATUS_KEY)
  write(STATUS_KEY,{state,at,lastAttempt:previous?.lastAttempt??null,lastSent:state==='sent'?at:previous?.lastSent??null,...(httpStatus?{httpStatus}:{})})
}
export function diagnosticStatusText():string{
  if(!REMOTE_DIAGNOSTICS_ENABLED)return 'Logs privados: ativação do servidor pendente.'
  const s=read(STATUS_KEY)
  if(s?.state==='missing-token')return 'Logs privados: configure o acesso privado para habilitar o envio.'
  if(s?.state==='unauthorized')return 'Logs privados: acesso recusado pelo serviço. A cotação e a fila foram preservadas.'
  if(s?.state==='failed')return 'Logs privados: envio indisponível; fila local preservada.'
  if(validTime(s?.lastSent))return 'Logs privados: último envio '+new Date(s.lastSent).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.'
  return 'Logs privados: aguardando o próximo envio.'
}
export async function flushDiagnostics():Promise<string>{
  if(!REMOTE_DIAGNOSTICS_ENABLED)return 'disabled'
  if(pending)return pending
  const batch=sanitizeDiagnosticBatch(read(QUEUE_KEY)),at=Date.now(),prior=read(STATUS_KEY)
  if(!batch||!batch.events.length)return 'empty'
  batch.events=batch.events.filter(e=>e.at<=at&&at-e.at<=TTL);write(QUEUE_KEY,batch)
  if(!batch.events.length)return 'empty'
  if(validTime(prior?.lastAttempt)&&at>=prior.lastAttempt&&at-prior.lastAttempt<INTERVAL)return 'rate-limited'
  const token=readPrivateMarketTokenState();if(!token.value){status('missing-token');return 'missing-token'}
  write(STATUS_KEY,{state:'sending',at,lastAttempt:at,lastSent:validTime(prior?.lastSent)?prior.lastSent:null})
  const sent=new Set(batch.events.map(e=>JSON.stringify(e)))
  pending=(async()=>{
    let timer:ReturnType<typeof setTimeout>|undefined
    try{
      const response:any=await Promise.race([
        fetch(PRIVATE_MARKET_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token.value},body:JSON.stringify(batch),timeout:TIMEOUT/1000,handleRedirect:async()=>null}),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),TIMEOUT)})
      ])
      if(response.status===202){
        const current=sanitizeDiagnosticBatch(read(QUEUE_KEY));if(current&&current.version===batch.version&&current.engineVersion===batch.engineVersion){current.events=current.events.filter(e=>!sent.has(JSON.stringify(e)));write(QUEUE_KEY,current)}
        status('sent');return 'sent'
      }
      const state=response.status===401?'unauthorized':'failed';status(state,Date.now(),Number.isInteger(response.status)?response.status:undefined);return state
    }catch{status('failed');return 'failed'}finally{if(timer!==undefined)clearTimeout(timer)}
  })().finally(()=>{pending=null})
  return pending
}
