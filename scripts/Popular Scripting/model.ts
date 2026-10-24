import { createEngine } from './original-engine'
import { createHost } from './host'
import { dashboardStatus, refreshMinutes } from './pro-common'
export const VERSION='0.2.3'
export const MODES=['fixed','gainers','losers','up_first','down_first'] as const
export function engine(family='medium',force=false){
  const queryDue=Date.now()-(Storage.get<number>('popular-last-query')??0)>=refreshMinutes()*60000
  return createEngine(createHost(force),{family,force:force||queryDue})
}
export function setOrdering(mode:string){if(!MODES.includes(mode as any))throw Error('Ordenação inválida');engine().writeOrderingMode(mode)}
export async function loadModel(family='medium',force=false){
  // Collect all eight so a small widget can select any four, not just the legacy first four.
  const api=engine(family==='small'?'medium':family,force),started=Date.now(),rows=await api.collectRows()
  const status=api.orderingFeedback(rows)
  const result={queriedAt:Date.now(),version:VERSION,sourceVersion:api.version,family,mode:api.readOrderingMode(),status,
    rows:rows.map((row:any)=>({...row,name:api.displayName(row.asset),price:api.displayPrice(row.asset.price,row.asset),
      percent:api.displayPercent(api.presentationPercent(row),row.asset),movement:api.presentationPercent(row),
      time:api.timeText(row),unit:api.unitText(row)})),api}
  Storage.set('popular-last-query',Date.now())
  Storage.set('popular-pro-rows',result.rows)
  dashboardStatus('Popular',{at:Date.now(),label:result.rows.length+' indicadores · '+result.status.label})
  Storage.set('last-run',{version:VERSION,sourceVersion:api.version,at:Date.now(),elapsedMS:Date.now()-started,
    mode:result.mode,rows:rows.map(api.quoteAudit),networkFailures:api.failures})
  return result
}
