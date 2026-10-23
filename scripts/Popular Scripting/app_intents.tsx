import { AppIntentManager, AppIntentProtocol, ControlWidget } from 'scripting'
import { loadModel } from './model'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'
export const RefreshPopular=AppIntentManager.register({name:'RefreshPopular',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  const model=await loadModel('medium',true);await reloadWidgets();await evaluateAlerts(model.rows);ControlWidget.reloadButtons()
}})
