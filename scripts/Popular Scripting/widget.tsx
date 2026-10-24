import { Widget, Text } from 'scripting'
import { loadModel, VERSION } from './model'
import { PopularView } from './view'
import { refreshMinutes } from './pro-common'
import { evaluateAlerts } from './alerts'
async function main(){
  const families:Record<string,string>={systemSmall:'small',systemMedium:'medium',systemLarge:'large'}
  const family=families[Widget.family]
  if(!family){Widget.present(<Text widgetBackground="#1E1E1E" foregroundStyle="white">Selecione pequeno, médio ou grande.</Text>);return}
  try{
    const changed=Storage.get<number>('popular-page-refresh:'+family)??0,age=Date.now()-changed
    const model=await loadModel(family,false,age>=0&&age<15000),{width,height}=Widget.displaySize
    Storage.set('widget-diagnostic',{version:VERSION,phase:'present-requested',at:Date.now(),family})
    Widget.present(<PopularView model={model} width={width} height={height}/>,{policy:'after',date:new Date(Date.now()+refreshMinutes()*60000)})
    try{await evaluateAlerts(model.rows)}catch{}
  }catch{
    Storage.set('widget-diagnostic',{version:VERSION,phase:'failed',at:Date.now(),family})
    Widget.present(<Text widgetBackground="#1E1E1E" foregroundStyle="white">Popular {VERSION}: falha ao preparar os indicadores. Abra o projeto no Scripting.</Text>)
  }
}
main()
