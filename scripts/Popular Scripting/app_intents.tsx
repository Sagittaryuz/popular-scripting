import { AppIntentManager, AppIntentProtocol, ControlWidget } from 'scripting'
import { loadModel } from './model'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'
export const RefreshPopular=AppIntentManager.register({name:'RefreshPopular',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  try{
    const model=await loadModel('medium',true)
    Storage.set('manual-refresh',{at:Date.now(),state:'queried'})
    await evaluateAlerts(model.rows)
  }catch{Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})}
  finally{await reloadWidgets();if(typeof ControlWidget.reloadButtons==='function')ControlWidget.reloadButtons()}
}})
