import { pageFamily, pageKey, pageRows } from './pagination'
import { AppIntentManager, AppIntentProtocol, ControlWidget, Safari, Script } from 'scripting'
import { loadModel } from './model'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'

const MARKET_URL=Script.createRunURLScheme('Meu Painel',{section:'market'})
export const TAP_REFRESH_TIMEOUT_MS=1800

async function requestWidgetReload(){
  try{await reloadWidgets()}catch{}
  try{if(typeof ControlWidget.reloadButtons==='function')ControlWidget.reloadButtons()}catch{}
}

async function refreshPopularData():Promise<'queried'|'failed-cache-preserved'>{
  let state:'queried'|'failed-cache-preserved'='failed-cache-preserved'
  try{
    for(const family of ['small','medium','large'])Storage.set('popular-page-refresh:'+family,0)
    const model=await loadModel('medium',true)
    Storage.set('manual-refresh',{at:Date.now(),state:'queried'})
    await evaluateAlerts(model.rows)
    state='queried'
  }catch{Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})}
  finally{await requestWidgetReload()}
  return state
}

export const RefreshPopular=AppIntentManager.register({name:'RefreshPopular',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await refreshPopularData()}})

function waitForRefresh(refresh:Promise<'queried'|'failed-cache-preserved'>){
  let timer:any=null
  const timeout=new Promise<{timedOut:true}>(resolve=>{timer=setTimeout(()=>resolve({timedOut:true}),TAP_REFRESH_TIMEOUT_MS)})
  return Promise.race([refresh.then(state=>({timedOut:false as const,state})),timeout]).finally(()=>{if(timer!=null)clearTimeout(timer)})
}

// A widget tap gives the refresh a short foreground opportunity before
// switching apps. Offline/rejected work reaches its cache-preserving finally
// path; a slow request times out, requests a cache redraw, and still navigates.
export const RefreshAndOpenMarket=AppIntentManager.register({name:'RefreshAndOpenMarket',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  const refresh=refreshPopularData()
  let outcome:{timedOut:false,state:'queried'|'failed-cache-preserved'}|{timedOut:true}
  try{outcome=await waitForRefresh(refresh)}catch{outcome={timedOut:true}}
  if(outcome.timedOut){
    Storage.set('manual-refresh',{at:Date.now(),state:'timeout-cache-preserved'})
    await requestWidgetReload()
    void refresh.catch(()=>{})
  }
  try{await Safari.openURL(MARKET_URL)}catch{}
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
