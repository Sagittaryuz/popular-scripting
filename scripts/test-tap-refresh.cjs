const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transformSync}=require('esbuild'),dir=path.join(__dirname,'Popular Scripting');

function loadIntent(deps,values,timers){
  const code=transformSync(fs.readFileSync(path.join(dir,'app_intents.tsx'),'utf8'),{loader:'tsx',format:'cjs'}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:id=>deps[id],Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,Promise,Storage:{get:key=>values.get(key),set:(key,value)=>{values.set(key,value);return true}}});
  return module.exports;
}

function loadModelState(values){
  const code=transformSync(fs.readFileSync(path.join(dir,'model.ts'),'utf8'),{loader:'ts',format:'cjs'}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:id=>{
    if(id==='./original-engine')return {createEngine:()=>({})};
    if(id==='./host')return {createHost:()=>({})};
    if(id==='./pro-common')return {dashboardStatus:()=>{},refreshMinutes:()=>1};
    if(id==='./market-status')return {sourceStatusForRow:(row,at)=>({state:'fresh',at})};
    throw Error('unexpected dependency '+id);
  },Date,Storage:{get:key=>values.get(key),set:(key,value)=>{values.set(key,value);return true}}});
  return module.exports;
}

async function tick(){await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));}

function harness(kind){
  const values=new Map(),events=[],definitions={};
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  const nativeSetTimeout=setTimeout,nativeClearTimeout=clearTimeout;
  let scheduled=[],cleared=0;
  const timers={
    setTimeout:(callback,delay)=>{scheduled.push(delay);return nativeSetTimeout(callback,Math.min(delay,5))},
    clearTimeout:timer=>{cleared+=1;return nativeClearTimeout(timer)}
  };
  const rows=Array.from({length:8},(_,index)=>({asset:{code:'CODE'+index}}));
  const sdk={
    AppIntentManager:{register:definition=>{definitions[definition.name]=definition;return ()=>({name:definition.name})}},
    AppIntentProtocol:{AppIntent:0},
    ControlWidget:{reloadButtons:()=>events.push('control')},
    Safari:{openURL:async url=>{events.push(['navigate',url]);return true}},
    Script:{createRunURLScheme:(name,params)=>`scripting://run/${encodeURIComponent(name)}?section=${encodeURIComponent(params.section)}`}
  };
  const deps={
    scripting:sdk,
    './pagination':{pageFamily:value=>value,pageKey:value=>`page:${value}`,pageRows:()=>({index:0,count:1,rows:[]})},
    './model':{
      TAP_REFRESH_CACHE_KEY:'popular-tap-refresh-v1',
      TapRefreshState:undefined,
      markPersistedSourceStatus:(state,at=Date.now())=>{
        const cached=values.get('popular-pro-rows');
        if(!Array.isArray(cached)||!cached.length)return false;
        values.set('popular-pro-rows',cached.map(row=>({...row,sourceStatus:{state,at}})));
        events.push('source-status:'+state);
        return true;
      },
      preparedTapState:()=>{
        const marker=values.get('popular-tap-refresh-v1');
        const rows=values.get('popular-pro-rows'),age=marker&&Date.now()-marker.at;
        return marker&&typeof marker.at==='number'&&age>=0&&age<=5000&&['queried','failed-cache-preserved','timeout-cache-preserved'].includes(marker.state)&&Array.isArray(rows)&&rows.length>=8?'queried':null;
      },
      loadModel:async(_family,_force,_cacheOnly,persistWhen=()=>true)=>{
        events.push('query');
        if(kind==='rejection')throw Error('offline');
        const model=await pending;
        if(persistWhen()){values.set('popular-pro-rows',rows);events.push('persist')}
        else events.push('late-skipped');
        return model;
      }
    },
    './alerts':{evaluateAlerts:async()=>events.push('alerts')},
    './pro-common':{reloadWidgets:async()=>events.push('reload')}
  };
  const intents=loadIntent(deps,values,timers);
  return {values,events,definitions,release,rows,intents,scheduled,get cleared(){return cleared}};
}

async function runSuccessAndDedup(){
  const fixture=harness('success');
  assert.equal(fixture.intents.TAP_REFRESH_TIMEOUT_MS,1500);
  const first=fixture.definitions.RefreshAndOpenMarket.perform();
  const second=fixture.definitions.RefreshAndOpenMarket.perform();
  fixture.release({rows:fixture.rows});
  await Promise.all([first,second]);
  const navigations=fixture.events.filter(event=>Array.isArray(event)&&event[0]==='navigate');
  assert.equal(fixture.events.filter(event=>event==='query').length,1,'Concurrent taps must share one query');
  assert.equal(fixture.events.filter(event=>event==='reload').length,1,'Concurrent taps must share one reload');
  assert.equal(navigations.length,2,'Each tap must navigate exactly once');
  assert.equal(fixture.events.filter(event=>event==='persist').length,1,'One shared result must persist once');
  assert(fixture.events.indexOf('persist')<fixture.events.indexOf('reload'),'Successful data must persist before reload');
  assert(fixture.events.indexOf('reload')<fixture.events.findIndex(event=>Array.isArray(event)&&event[0]==='navigate'),'Reload must precede navigation');
  assert.equal(navigations[0][1],'scripting://run/Meu%20Painel?section=market');
  assert.equal(fixture.scheduled[0],1500,'Tap refresh must use the 1500ms bound');
  assert(fixture.cleared>=1,'The bounded foreground timer must be cleaned up');

  const prepared=fixture.events.length;
  await fixture.definitions.RefreshAndOpenMarket.perform();
  assert.equal(fixture.events.filter(event=>event==='query').length,1,'Prepared result must suppress an immediate duplicate query');
  assert.equal(fixture.events.filter(event=>event==='reload').length,2,'Prepared result still requests a redraw');
  assert.equal(fixture.events.length,prepared+3,'Prepared tap performs reload/control/navigation only');

  fixture.values.set('popular-tap-refresh-v1',{at:Date.now()-5001,state:'queried'});
  const expired=fixture.definitions.RefreshAndOpenMarket.perform();
  await tick();
  await expired;
  assert.equal(fixture.events.filter(event=>event==='query').length,2,'Expired prepared result must query again');
}

async function runRejection(){
  const fixture=harness('rejection');
  fixture.values.set('popular-pro-rows',fixture.rows.map(row=>({...row,sourceStatus:{state:'fresh',at:Date.now()}})));
  await fixture.definitions.RefreshAndOpenMarket.perform();
  assert.equal(fixture.values.get('manual-refresh').state,'failed-cache-preserved');
  assert.equal(fixture.events.includes('persist'),false,'Rejected refresh must not invent a persisted model');
  assert(fixture.events.includes('source-status:failed'),'Rejected refresh must gray preserved rows');
  assert(fixture.values.get('popular-pro-rows').every(row=>row.sourceStatus.state==='failed'),'Rejected refresh must mark every preserved row failed');
  assert.equal(fixture.events.filter(event=>event==='reload').length,1,'Rejected refresh still redraws the cache');
  assert.equal(fixture.events.filter(event=>Array.isArray(event)&&event[0]==='navigate').length,1);
}

async function runRowTapNoNavigation(){
  const fixture=harness('success');
  const operation=fixture.definitions.RefreshAssetsOnTap.perform();
  fixture.release({rows:fixture.rows});
  await operation;
  assert.equal(fixture.events.filter(event=>event==='query').length,1,'Row tap must request the bounded refresh');
  assert.equal(fixture.events.filter(event=>event==='reload').length,1,'Row tap must request a redraw');
  assert.equal(fixture.events.some(event=>Array.isArray(event)&&event[0]==='navigate'),false,'Row tap must not navigate to another app');
}

async function runTimeoutLateResult(){
  const fixture=harness('timeout');
  fixture.values.set('popular-pro-rows',fixture.rows.map(row=>({...row,sourceStatus:{state:'fresh',at:Date.now()}})));
  await fixture.definitions.RefreshAndOpenMarket.perform();
  assert.equal(fixture.values.get('manual-refresh').state,'timeout-cache-preserved');
  assert.equal(fixture.events.includes('persist'),false,'Timed out refresh must not fabricate persistence');
  assert(fixture.events.includes('source-status:failed'),'Timeout must gray preserved rows');
  assert(fixture.values.get('popular-pro-rows').every(row=>row.sourceStatus.state==='failed'),'Timeout must mark every preserved row failed');
  assert.equal(fixture.events.filter(event=>event==='reload').length,1,'Timeout must redraw the existing cache once');
  assert.equal(fixture.events.filter(event=>Array.isArray(event)&&event[0]==='navigate').length,1);
  fixture.release({rows:fixture.rows});
  await tick();
  assert.equal(fixture.events.includes('late-skipped'),true,'Late result must be excluded after timeout');
  assert.equal(fixture.events.filter(event=>event==='reload').length,1,'Late result must not request a second reload');
}

function runMarkerValidation(){
  const values=new Map(),model=loadModelState(values),now=Date.now();
  const rows=Array.from({length:8},(_,index)=>({asset:{code:'CODE'+index}}));
  values.set('popular-pro-rows',rows);
  values.set('popular-tap-refresh-v1',{at:now-100,state:'queried'});
  assert.equal(model.preparedTapState(now),'queried');
  values.set('popular-tap-refresh-v1',{at:now-5001,state:'queried'});
  assert.equal(model.preparedTapState(now),null,'Expired marker must not be reused');
  values.set('popular-tap-refresh-v1',{at:now-100,state:'unknown'});
  assert.equal(model.preparedTapState(now),null,'Unknown marker state must not be trusted');
  values.set('popular-tap-refresh-v1',{at:now-100,state:'queried'});
  values.set('popular-pro-rows',[{asset:{}}]);
  assert.equal(model.preparedTapState(now),null,'Incomplete model cache must not be treated as prepared');
  values.set('popular-tap-refresh-v1',{at:now+1,state:'queried'});
  values.set('popular-pro-rows',rows);
  assert.equal(model.preparedTapState(now),null,'Future marker must not be trusted');
}

(async()=>{
  await runSuccessAndDedup();
  await runRejection();
  await runRowTapNoNavigation();
  await runTimeoutLateResult();
  runMarkerValidation();
  console.log('PASS tap refresh: 1500ms bound, concurrent deduplication, five-second prepared cache, invalid markers, offline preservation, one navigation per tap and late-result exclusion. Native iPhone remains untested.');
})().catch(error=>{console.error(error);process.exitCode=1});
