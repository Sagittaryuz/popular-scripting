import { pageFamily, pageKey, pageRows } from './pagination'
import { AppIntentManager, AppIntentProtocol, ControlWidget, Safari, Script } from 'scripting'
import { loadModel } from './model'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'

const MARKET_URL=Script.createRunURLScheme('Meu Painel',{section:'market'})

async function refreshPopularData(){
  try{
    for(const family of ['small','medium','large'])Storage.set('popular-page-refresh:'+family,0)
    const model=await loadModel('medium',true)
    Storage.set('manual-refresh',{at:Date.now(),state:'queried'})
    await evaluateAlerts(model.rows)
  }catch{Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})}
  finally{await reloadWidgets();if(typeof ControlWidget.reloadButtons==='function')ControlWidget.reloadButtons()}
}

export const RefreshPopular=AppIntentManager.register({name:'RefreshPopular',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await refreshPopularData()}})

// A widget tap requests the refresh and immediately preserves the existing
// Meu Painel destination. The query is deliberately not awaited before the
// URL is opened: network/offline state must never hold navigation hostage.
// Therefore completion before the external app appears is not guaranteed;
// when the AppIntent remains alive, refreshPopularData persists first and its
// finally block requests the redraw afterward.
export const RefreshAndOpenMarket=AppIntentManager.register({name:'RefreshAndOpenMarket',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  const refresh=refreshPopularData()
  try{await Safari.openURL(MARKET_URL)}catch{}
  try{await refresh}catch{}
}})

export const NextPopularPage=AppIntentManager.register({name:'NextPopularPage',protocol:AppIntentProtocol.AppIntent,perform:async({family}:{family:string})=>{
  const valid=pageFamily(family)
  let rows=Storage.get<any[]>('popular-pro-rows')??[]
  try{const model=await loadModel(valid,true);rows=model.rows;await evaluateAlerts(rows);Storage.set('manual-refresh',{at:Date.now(),state:'queried'})}
  catch{Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})}
  const page=pageRows(rows,valid,Storage.get('popular-small-codes'),Storage.get(pageKey(valid)))
  if(!Storage.set(pageKey(valid),(page.index+1)%page.count))throw Error('Não foi possível guardar a página.')
  Storage.set('popular-page-refresh:'+valid,Date.now())
  await reloadWidgets()
}})
