import { createEngine } from './original-engine'
import { createHost } from './host'
export const VERSION='0.1.2'
export const MODES=['fixed','gainers','losers','up_first','down_first'] as const
export function engine(family='medium',force=false){return createEngine(createHost(),{family,force})}
export function setOrdering(mode:string){if(!MODES.includes(mode as any))throw Error('Ordenação inválida');engine().writeOrderingMode(mode)}
export async function loadModel(family='medium',force=false){
  const api=engine(family,force),started=Date.now(),rows=await api.collectRows()
  const status=api.orderingFeedback(rows)
  const result={version:VERSION,sourceVersion:api.version,family,mode:api.readOrderingMode(),status,
    rows:rows.map((row:any)=>({...row,name:api.displayName(row.asset),price:api.displayPrice(row.asset.price,row.asset),
      percent:api.displayPercent(api.presentationPercent(row),row.asset),movement:api.presentationPercent(row),
      time:api.timeText(row),unit:api.unitText(row)})),api}
  Storage.set('last-run',{version:VERSION,sourceVersion:api.version,at:Date.now(),elapsedMS:Date.now()-started,
    mode:result.mode,rows:rows.map(api.quoteAudit),networkFailures:api.failures.length})
  return result
}
