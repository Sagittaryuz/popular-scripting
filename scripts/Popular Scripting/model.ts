import { createEngine } from './original-engine'
import { createHost } from './host'
import { dashboardStatus, refreshMinutes } from './pro-common'
export const VERSION='0.2.14'
export const FIXED_INDICATOR_CODES=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'] as const
export const MODES=['fixed'] as const
function fixedIndicatorRows(rows:any[]){
  const codes=new Set(FIXED_INDICATOR_CODES),indexed=new Map(rows.map(row=>[row?.asset?.code,row]))
  return [...FIXED_INDICATOR_CODES.map(code=>indexed.get(code)).filter(Boolean),...rows.filter(row=>!codes.has(row?.asset?.code))]
}
export function engine(family='medium',force=false){
  const queryDue=Date.now()-(Storage.get<number>('popular-last-query')??0)>=refreshMinutes()*60000
  return createEngine(createHost(force),{family,force:force||queryDue})
}
export function setOrdering(mode:string){if(!MODES.includes(mode as any))throw Error('Ordenação inválida');engine().writeOrderingMode(mode)}
export async function loadModel(family='medium',force=false,cacheOnly=false){
  // Collect all eight so a small widget can select any four, not just the legacy first four.
  const api=engine(family==='small'?'medium':family,force),started=Date.now()
  const cached=Storage.get<any[]>('popular-pro-rows')
  if(cacheOnly&&Array.isArray(cached)&&cached.length&&cached.every(r=>typeof r?.asset?.code==='string')){
    const ordered=fixedIndicatorRows(cached)
    return {version:VERSION,sourceVersion:api.version,family,mode:'fixed',status:api.orderingFeedback(ordered.slice(0,8)),
      rows:ordered,queriedAt:Storage.get<number>('popular-last-query')??0,api}
  }
  const [rows,extra]=await Promise.all([api.collectRows(),api.collectAdditionalRows?.().catch(()=>[])??Promise.resolve([])])
  const orderedRows=fixedIndicatorRows(rows)
  const baseCodes=new Set(orderedRows.map((r:any)=>r.asset.code))
  const saved=Storage.get<any[]>('popular-extra-rows')
  const additions=(extra.length?extra:Array.isArray(saved)?saved.map(r=>({...r,cached:true})):[]).filter((r:any)=>r?.asset&&typeof r.asset.code==='string'&&!baseCodes.has(r.asset.code)).slice(0,8)
  if(extra.length)Storage.set('popular-extra-rows',additions)
  const combined=fixedIndicatorRows([...orderedRows,...additions])
  const status=api.orderingFeedback(orderedRows)
  const result={queriedAt:Date.now(),version:VERSION,sourceVersion:api.version,family,mode:'fixed',status,
    rows:combined.map((row:any)=>({...row,name:api.displayName(row.asset),price:api.displayPrice(row.asset.price,row.asset),
      percent:api.displayPercent(api.presentationPercent(row),row.asset),movement:api.presentationPercent(row),
      time:api.timeText(row),unit:api.unitText(row)})),api}
  Storage.set('popular-last-query',Date.now())
  Storage.set('popular-pro-rows',result.rows)
  // Bounded local data only; homepage UI lives in its own Git repository.
  try{Storage.set('sagittaryuz-dashboard-v1:Popular',{schema:1,source:'Popular',at:result.queriedAt,version:VERSION,rows:result.rows.slice(0,16).map((row:any)=>({name:row.name,price:row.price,percent:row.percent,movement:row.movement,time:row.time,points:(row.chart?.points??[]).slice(-24).map((p:any)=>p.value).filter(Number.isFinite)}))},{shared:true})}catch{}
  dashboardStatus('Popular',{at:Date.now(),label:result.rows.length+' indicadores · '+result.status.label})
  Storage.set('last-run',{version:VERSION,sourceVersion:api.version,at:Date.now(),elapsedMS:Date.now()-started,
    mode:result.mode,rows:combined.map(api.quoteAudit),networkFailures:api.failures})
  return result
}
