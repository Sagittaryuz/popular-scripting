import { Widget, Text } from 'scripting'
import { loadModel, VERSION } from './model'
import { PopularView } from './view'
async function main(){
  const families:Record<string,string>={systemSmall:'small',systemMedium:'medium',systemLarge:'large'}
  const family=families[Widget.family]
  if(!family){Widget.present(<Text widgetBackground="#1E1E1E" foregroundStyle="white">Selecione pequeno, médio ou grande.</Text>);return}
  try{
    const model=await loadModel(family),{width,height}=Widget.displaySize
    Storage.set('widget-diagnostic',{version:VERSION,phase:'present-requested',at:Date.now(),family})
    Widget.present(<PopularView model={model} width={width} height={height}/>,{policy:'after',date:new Date(Date.now()+5*60000)})
  }catch{
    Storage.set('widget-diagnostic',{version:VERSION,phase:'failed',at:Date.now(),family})
    Widget.present(<Text widgetBackground="#1E1E1E" foregroundStyle="white">Popular {VERSION}: falha ao preparar os indicadores. Abra o projeto no Scripting.</Text>)
  }
}
main()
