import { pageFamily, pageKey, pageRows } from './pagination'
import { AppIntentManager, AppIntentProtocol, ControlWidget, Safari, Script } from 'scripting'
import { loadModel, markPersistedSourceStatus, preparedTapState, TAP_REFRESH_CACHE_KEY, TapRefreshState } from './model'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'

const MARKET_URL=Script.createRunURLScheme('Meu Painel',{section:'market'})
export const TAP_REFRESH_TIMEOUT_MS=1500

async function requestWidgetReload(){
  try{await reloadWidgets()}catch{}
  try{if(typeof ControlWidget.reloadButtons==='function')ControlWidget.reloadButtons()}catch{}
}

async function refreshPopularData(isActive:()=>boolean=()=>true,reload=true):Promise<'queried'|'failed-cache-preserved'|'late-ignored'>{
  let state:'queried'|'failed-cache-preserved'='failed-cache-preserved'
  try{
    for(const family of ['small','medium','large'])Storage.set('popular-page-refresh:'+family,0)
    const model=await loadModel('medium',true,false,isActive)
    if(!isActive())return 'late-ignored'
    Storage.set('manual-refresh',{at:Date.now(),state:'queried'})
    await evaluateAlerts(model.rows)
    state='queried'
  }catch{
    try{markPersistedSourceStatus('failed')}catch{}
    if(isActive())Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})
  }
  finally{if(reload&&isActive())await requestWidgetReload()}
  return isActive()?state:'late-ignored'
}

export const RefreshPopular=AppIntentManager.register({name:'RefreshPopular',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await refreshPopularData()}})

function waitForRefresh(refresh:Promise<'queried'|'failed-cache-preserved'|'late-ignored'>){
  let timer:any=null
  const timeout=new Promise<{timedOut:true}>(resolve=>{timer=setTimeout(()=>resolve({timedOut:true}),TAP_REFRESH_TIMEOUT_MS)})
  return Promise.race([refresh.then(state=>({timedOut:false as const,state})),timeout]).finally(()=>{if(timer!=null)clearTimeout(timer)})
}

let tapRefreshPending:Promise<TapRefreshState>|null=null
function markTapRefresh(state:TapRefreshState){Storage.set(TAP_REFRESH_CACHE_KEY,{at:Date.now(),state})}
async function refreshForTap():Promise<TapRefreshState>{
  const recent=preparedTapState();
  if(recent){await requestWidgetReload();return recent}
  if(tapRefreshPending)return tapRefreshPending
  const active={value:true}
  const operation=(async()=>{
    const refresh=refreshPopularData(()=>active.value,false)
    let outcome:{timedOut:false;state:'queried'|'failed-cache-preserved'|'late-ignored'}|{timedOut:true}
    try{outcome=await waitForRefresh(refresh)}catch{outcome={timedOut:true}}
    let state:TapRefreshState
    if(outcome.timedOut){
      active.value=false
      state='timeout-cache-preserved'
      try{markPersistedSourceStatus('failed')}catch{}
      Storage.set('manual-refresh',{at:Date.now(),state})
    }else {
      state=outcome.state==='late-ignored'?'timeout-cache-preserved':outcome.state
      if(state!=='queried')try{markPersistedSourceStatus('failed')}catch{}
    }
    markTapRefresh(state)
    await requestWidgetReload()
    void refresh.catch(()=>{})
    return state
  })()
  tapRefreshPending=operation.finally(()=>{tapRefreshPending=null})
  return tapRefreshPending
}

// Row taps use the same bounded/deduplicated refresh as the market entry, but
// deliberately do not leave the widget or open another app.
export const RefreshAssetsOnTap=AppIntentManager.register({name:'RefreshAssetsOnTap',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  await refreshForTap()
}})

// A widget tap gives the refresh a short foreground opportunity before
// switching apps. Concurrent taps share one refresh; a prepared result is reused
// briefly; a slow result is prevented from replacing the model after timeout.
export const RefreshAndOpenMarket=AppIntentManager.register({name:'RefreshAndOpenMarket',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
  await refreshForTap()
  try{await Safari.openURL(MARKET_URL)}catch{}
}})

export const NextPopularPage=AppIntentManager.register({name:'NextPopularPage',protocol:AppIntentProtocol.AppIntent,perform:async({family}:{family:string})=>{
  const valid=pageFamily(family)
  let rows=Storage.get<any[]>('popular-pro-rows')??[]
  try{const model=await loadModel(valid,true);rows=model.rows;await evaluateAlerts(rows);Storage.set('manual-refresh',{at:Date.now(),state:'queried'})}
  catch{
    try{markPersistedSourceStatus('failed')}catch{}
    Storage.set('manual-refresh',{at:Date.now(),state:'failed-cache-preserved'})
  }
  const page=pageRows(rows,valid,Storage.get('popular-small-codes'),Storage.get(pageKey(valid)))
  if(!Storage.set(pageKey(valid),(page.index+1)%page.count))throw Error('Não foi possível guardar a página.')
  Storage.set('popular-page-refresh:'+valid,Date.now())
  await reloadWidgets()
}})
