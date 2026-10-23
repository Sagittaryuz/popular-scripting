export type AlertRule={id:string;code:string;direction:'above'|'below';threshold:number}
export function validateRules(raw:any):AlertRule[]{
  if(!Array.isArray(raw)||raw.length>20)throw Error('Máximo de 20 alertas.')
  const ids=new Set<string>()
  return raw.map(r=>{
    if(!r||typeof r.id!=='string'||!/^[\w-]{1,80}$/.test(r.id)||ids.has(r.id)||typeof r.code!=='string'||r.code.length>40||!['above','below'].includes(r.direction)||typeof r.threshold!=='number'||!Number.isFinite(r.threshold))throw Error('Alerta inválido.')
    ids.add(r.id);return {id:r.id,code:r.code,direction:r.direction,threshold:r.threshold}
  })
}
export function selectSmall(rows:any[],codes:unknown){
  if(!Array.isArray(codes)||codes.length!==4||new Set(codes).size!==4)return rows.slice(0,4)
  const selected=codes.map(code=>rows.find(r=>r.asset.code===code));return selected.every(Boolean)?selected:rows.slice(0,4)
}
export function quoteObservation(row:any,now=Date.now()){
  const value=row.asset?.price
  if(typeof value!=='number'||!Number.isFinite(value))return null
  const period=row.referencePeriod||row.economicValidation?.currentPeriod
  let at:number,limit:number
  if(typeof period==='string'&&/^\d{4}-\d{2}$/.test(period)){
    at=Date.parse(period+'-01T00:00:00Z');limit=65*86400000
  }else{
    at=row.stamp?.time;limit=row.economicValidation?.frequency==='weekly'?10*86400000:4*86400000
  }
  if(!Number.isFinite(at)||at>now+60000||now-at>limit)return null
  return {value,at}
}
export function crossed(rule:AlertRule,previous:{value:number;at:number}|null,next:{value:number;at:number}){
  if(!previous||next.at<previous.at||previous.value===next.value)return false
  return rule.direction==='above'?previous.value<=rule.threshold&&next.value>rule.threshold:previous.value>=rule.threshold&&next.value<rule.threshold
}
export function sourceURL(row:any){
  const raw=row.economicValidation?.sourceURL||row.asset?.url||({'USD/BRL':'https://economia.awesomeapi.com.br/last/USD-BRL','SELIC':'https://www.bcb.gov.br/controleinflacao/taxaselic'} as any)[row.asset?.code]
  if(typeof raw!=='string')return 'https://www.bcb.gov.br/'
  try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'https://www.bcb.gov.br/'}catch{return 'https://www.bcb.gov.br/'}
}
const csvCell=(v:unknown)=>{
  let text=String(v??'')
  if(/^[=+@\t\r-]/.test(text)&&!/^-[0-9]+(?:\.[0-9]+)?$/.test(text))text="'"+text
  return '"'+text.replace(/"/g,'""')+'"'
}
export function historyCSV(rows:any[]){
  const output=[['codigo','data_observacao','valor','moeda','unidade','fonte','url']]
  for(const row of rows)for(const point of row.chart?.points??[]){
    if(!Number.isFinite(point.value)||typeof point.stamp?.day!=='string')continue
    output.push([row.asset.code,point.stamp.day,String(point.value),row.asset.currency??'',row.asset.unit??'',row.asset.source??'',sourceURL(row)])
  }
  return '\uFEFF'+output.map(line=>line.map(csvCell).join(';')).join('\r\n')+'\r\n'
}
export function summaryRows(rows:any[]){return rows.map(r=>({code:r.asset.code,name:r.name,price:r.price,variation:r.percent,unit:r.unit,observation:r.time,referencePeriod:r.referencePeriod??null,cached:!!r.cached,source:r.asset.source,url:sourceURL(r)}))}
