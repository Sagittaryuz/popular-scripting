import { AlertRule, crossed, quoteObservation, validateRules } from './pro-model'
export async function evaluateAlerts(rows:any[]){
  if(Storage.get('popular-alerts-enabled')!==true)return
  const rules=validateRules(Storage.get('popular-alerts')??[])
  for(const rule of rules){
    const row=rows.find(r=>r.asset.code===rule.code);if(!row)continue
    const next=quoteObservation(row);if(!next)continue
    const key='popular-alert-baseline:'+rule.id
    const previous=Storage.get<{value:number;at:number;rule:string}>(key),identity=JSON.stringify(rule)
    if(previous?.rule===identity&&next.at<previous.at)continue
    if(crossed(rule,previous?.rule===identity?previous:null,next)){
      await Notification.schedule({title:'Popular · condição atingida',body:row.name+' '+(rule.direction==='above'?'acima':'abaixo')+' de '+rule.threshold+' · '+row.time,
        threadIdentifier:'popular-alerts',tapAction:{type:'runScript',scriptName:'Popular Scripting'}})
    }
    if(!Storage.set(key,{...next,rule:identity}))throw Error('Não foi possível guardar o estado do alerta.')
  }
}
export async function addAlert(rows:any[]){
  const selected=await Dialog.actionSheet({title:'Indicador',actions:rows.map(r=>({label:r.name+' · '+r.asset.code}))});if(selected==null)return
  const row=rows[selected]
  const direction=await Dialog.actionSheet({title:'Avisar ao cruzar',actions:[{label:'Acima do valor'},{label:'Abaixo do valor'}]});if(direction==null)return
  const raw=await Dialog.prompt({title:'Valor limite',message:'Use a unidade exibida: '+row.unit});if(raw==null)return
  if(!/^-?\d+(?:[.,]\d+)?$/.test(raw.trim()))throw Error('Use um número sem separador de milhares.')
  const rule:AlertRule={id:'rule-'+Date.now(),code:row.asset.code,direction:direction===0?'above':'below',threshold:Number(raw.replace(',','.'))}
  const rules=validateRules([...(Storage.get<AlertRule[]>('popular-alerts')??[]),rule])
  Storage.set('popular-alerts',rules);Storage.set('popular-alerts-enabled',true)
  await Notification.schedule({title:'Popular · alerta configurado',body:'Avisos por cruzamento serão verificados nas execuções do script.',threadIdentifier:'popular-alerts'})
  await evaluateAlerts(rows)
}
