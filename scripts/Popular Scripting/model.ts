import { createEngine } from './original-engine'
import { createHost } from './host'
import { dashboardStatus, refreshMinutes } from './pro-common'
import { sourceStatusForRow } from './market-status'
export const VERSION='0.2.40'
export const TAP_REFRESH_CACHE_KEY='popular-tap-refresh-v1'
export const TAP_REFRESH_CACHE_MS=5000
// Published, reversible test profile: keep the former eight-indicator list
// below so one config change can restore it without losing its definition.
export const PUBLISHED_TEST_ASSETS=true
export const PUBLISHED_TEST_PROFILE='ibov-dow-usd-brent-7d' as const
const PRIVATE_MARKET_STATUS_LABELS:Record<string,string>={
  'not-run':'não consultada',
  'token-missing':'token ausente no Keychain',
  'token-invalid':'token inválido no Keychain',
  'keychain-unavailable':'Keychain indisponível',
  fresh:'resposta válida do Worker',
  cache:'resposta válida em cache privado',
  'stale-cache':'resposta antiga em cache privado',
  'worker-unauthorized':'Worker rejeitou a autorização (401)',
  'worker-forbidden':'Worker recusou a consulta (403)',
  'worker-rate-limited':'Worker limitou a consulta (429)',
  'worker-unavailable':'Worker/fonte indisponível (5xx)',
  'invalid-response':'resposta do Worker não passou na validação',
  'endpoint-missing':'endpoint privado ausente',
  'network-error':'falha de rede ou timeout'
}
export function privateMarketStatusText(status:any):string{
  const code=String(status?.code||'not-run'),cached=status?.cached===true
  const http=code.match(/^worker-http-(\d{3})$/)
  const label=PRIVATE_MARKET_STATUS_LABELS[code]||(http?'Worker respondeu HTTP '+http[1]:'estado não reconhecido')
  const upstreamStatus=Number.isInteger(status?.upstreamStatus)&&status.upstreamStatus>=400&&status.upstreamStatus<=599?status.upstreamStatus:null
  const upstreamAsset=['BBAS3','BBDC4','IBOV'].includes(status?.upstreamAsset)?status.upstreamAsset:null
  const upstreamCodes=['BAD_REQUEST','VALIDATION_ERROR','QUOTES_PER_REQUEST_EXCEEDED','INVALID_RANGE','INVALID_INTERVAL','MISSING_TOKEN','INVALID_TOKEN','FEATURE_NOT_AVAILABLE','MODULES_NOT_AVAILABLE','NOT_FOUND']
  const upstreamCode=upstreamCodes.includes(status?.upstreamCode)?status.upstreamCode:null
  const upstreamParts=[upstreamStatus==null?'':'origem upstream HTTP '+upstreamStatus,upstreamAsset||'',upstreamCode?'código upstream '+upstreamCode:''].filter(Boolean)
  const upstream=upstreamParts.length?' · '+upstreamParts.join(' · '):''
  if(code.startsWith('cache-fallback-'))return 'Fonte privada: cache privado preservado; nova consulta indisponível'+upstream
  return 'Fonte privada: '+label+upstream+(cached?' · cache privado':'')
}
export type TapRefreshState='queried'|'failed-cache-preserved'|'timeout-cache-preserved'
export function preparedTapState(now=Date.now()):TapRefreshState|null{
  const marker=Storage.get<{at:number;state:TapRefreshState}>(TAP_REFRESH_CACHE_KEY),rows=Storage.get<any[]>('popular-pro-rows')
  if(!marker||typeof marker.at!=='number'||!Number.isFinite(marker.at)||now<marker.at||now-marker.at>TAP_REFRESH_CACHE_MS||!['queried','failed-cache-preserved','timeout-cache-preserved'].includes(marker.state))return null
  return Array.isArray(rows)&&rows.length>0&&rows.slice(0,8).every(row=>typeof row?.asset?.code==='string')?marker.state:null
}
export const FIXED_INDICATOR_CODES=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'] as const
export const MODES=['fixed'] as const
function fixedIndicatorRows(rows:any[]){
  const codes=new Set(FIXED_INDICATOR_CODES),indexed=new Map(rows.map(row=>[row?.asset?.code,row]))
  return [...FIXED_INDICATOR_CODES.map(code=>indexed.get(code)).filter(Boolean),...rows.filter(row=>!codes.has(row?.asset?.code))]
}
export function engine(family='medium',force=false){
  const queryDue=Date.now()-(Storage.get<number>('popular-last-query')??0)>=refreshMinutes()*60000
  return createEngine(createHost(force),{family,force:force||queryDue,localTestAssets:PUBLISHED_TEST_ASSETS,localTestProfile:PUBLISHED_TEST_PROFILE})
}
export function setOrdering(mode:string){if(!MODES.includes(mode as any))throw Error('Ordenação inválida');engine().writeOrderingMode(mode)}
export function markPersistedSourceStatus(state:'cached'|'failed',at=Date.now()){
  const rows=Storage.get<any[]>('popular-pro-rows')
  if(!Array.isArray(rows)||!rows.length)return false
  const sourceStatus={state,at,reason:state==='cached'?'cache-preserved-after-source-fallback':'refresh-failed-or-timed-out'}
  Storage.set('popular-pro-rows',rows.map(row=>row?.asset?.code?{...row,sourceStatus}:row))
  return true
}
export async function loadModel(family='medium',force=false,cacheOnly=false,persistWhen:()=>boolean=()=>true){
  // The former path collects all eight; the published test profile collects
  // exactly its four configured rows so a small widget and wide first column
  // cannot be replaced by legacy selection/cache state.
  const api=engine(family==='small'?'medium':family,force),started=Date.now()
  const cached=Storage.get<any[]>('popular-pro-rows')
  // The published test profile must not be shadowed by a pre-existing cache
  // from the former production list, including the cache-only widget path.
  if(!PUBLISHED_TEST_ASSETS&&cacheOnly&&Array.isArray(cached)&&cached.length&&cached.every(r=>typeof r?.asset?.code==='string')){
    const ordered=fixedIndicatorRows(cached)
    return {version:VERSION,sourceVersion:api.version,family,mode:'fixed',status:api.orderingFeedback(ordered.slice(0,8)),
      rows:ordered,queriedAt:Storage.get<number>('popular-last-query')??0,api}
  }
  const [rows,extra]=await Promise.all([api.collectRows(),api.collectAdditionalRows?.().catch(()=>[])??Promise.resolve([])])
  const orderedRows=PUBLISHED_TEST_ASSETS?rows:fixedIndicatorRows(rows)
  const baseCodes=new Set(orderedRows.map((r:any)=>r.asset.code))
  const saved=Storage.get<any[]>('popular-extra-rows')
  const additions=PUBLISHED_TEST_ASSETS?[]:(extra.length?extra:Array.isArray(saved)?saved.map(r=>({...r,cached:true})):[]).filter((r:any)=>r?.asset&&typeof r.asset.code==='string'&&!baseCodes.has(r.asset.code)).slice(0,8)
  if(extra.length&&persistWhen())Storage.set('popular-extra-rows',additions)
  const combined=PUBLISHED_TEST_ASSETS?[...orderedRows,...additions]:fixedIndicatorRows([...orderedRows,...additions])
  const status=api.orderingFeedback(orderedRows)
  const queriedAt=Date.now()
  const result={queriedAt,version:VERSION,sourceVersion:api.version,family,mode:'fixed',status,privateMarketStatus:api.privateMarketStatus,
    rows:combined.map((row:any)=>({...row,sourceStatus:sourceStatusForRow(row,queriedAt),name:api.displayName(row.asset),price:api.displayPrice(row.asset.price,row.asset),
      percent:api.displayPercent(api.presentationPercent(row),row.asset),movement:api.presentationPercent(row),
      time:api.timeText(row),unit:api.unitText(row)})),api}
  if(!persistWhen())return result
  Storage.set('popular-last-query',Date.now())
  Storage.set('popular-pro-rows',result.rows)
  // Bounded local data only; homepage UI lives in its own Git repository.
  try{Storage.set('sagittaryuz-dashboard-v1:Popular',{schema:1,source:'Popular',at:result.queriedAt,version:VERSION,rows:result.rows.slice(0,16).map((row:any)=>({name:row.name,price:row.price,percent:row.percent,movement:row.movement,time:row.time,points:(row.chart?.points??[]).slice(-24).map((p:any)=>p.value).filter(Number.isFinite)}))},{shared:true})}catch{}
  dashboardStatus('Popular',{at:Date.now(),label:result.rows.length+' indicadores · '+result.status.label})
  Storage.set('last-run',{version:VERSION,sourceVersion:api.version,at:Date.now(),elapsedMS:Date.now()-started,
    mode:result.mode,rows:combined.map(api.quoteAudit),networkFailures:api.failures,privateMarketStatus:api.privateMarketStatus})
  return result
}
