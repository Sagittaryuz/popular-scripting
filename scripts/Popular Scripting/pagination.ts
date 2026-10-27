import { selectSmall } from './pro-model'
export function pageFamily(value:string){if(!['small','medium','large'].includes(value))throw Error('Tamanho inválido');return value}
export function pageKey(family:string){return 'popular-page:'+pageFamily(family)}
export function pageRows(rows:any[],family:string,_legacyCodes:unknown,page:unknown){
  const capacity=pageFamily(family)==='small'?4:8
  const first=family==='small'?selectSmall(rows,_legacyCodes):[]
  const selected=new Set(first.map(row=>row.asset.code))
  const ordered=family==='small'?[...first,...rows.filter(row=>!selected.has(row.asset.code))]:rows
  const count=Math.max(1,Math.ceil(ordered.length/capacity))
  const index=typeof page==='number'&&Number.isSafeInteger(page)&&page>=0?page%count:0
  return {rows:ordered.slice(index*capacity,(index+1)*capacity),count,index,capacity}
}
