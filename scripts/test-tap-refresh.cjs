const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transformSync}=require('esbuild'),dir=path.join(__dirname,'Popular Scripting');

function load(deps,values,timers){
  const code=transformSync(fs.readFileSync(path.join(dir,'app_intents.tsx'),'utf8'),{loader:'tsx',format:'cjs'}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:id=>deps[id],Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,Promise,Storage:{get:key=>values.get(key),set:(key,value)=>{values.set(key,value);return true}}});
  return module.exports;
}

async function tick(){await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));}

async function runCase(kind){
  const values=new Map(),events=[],definitions={};
  let release;
  const nativeSetTimeout=setTimeout,nativeClearTimeout=clearTimeout;
  let scheduled=0,cleared=0;
  const timers={
    setTimeout:(callback,delay)=>{scheduled+=1;return nativeSetTimeout(callback,Math.min(delay,5))},
    clearTimeout:timer=>{cleared+=1;return nativeClearTimeout(timer)}
  };
  const pending=new Promise(resolve=>{release=resolve});
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
    './model':{loadModel:async()=>{
      events.push('query');
      if(kind==='rejection')throw Error('offline');
      if(kind==='timeout')return new Promise(()=>{});
      return pending.then(model=>{events.push('persist');return model});
    }},
    './alerts':{evaluateAlerts:async()=>events.push('alerts')},
    './pro-common':{reloadWidgets:async()=>events.push('reload')}
  };
  load(deps,values,timers);
  const operation=definitions.RefreshAndOpenMarket.perform();
  await tick();
  if(kind==='success')release({rows:[]});
  await operation;

  const navigations=events.filter(event=>Array.isArray(event)&&event[0]==='navigate');
  assert.equal(navigations.length,1,'Each tap must navigate exactly once');
  assert.equal(navigations[0][1],'scripting://run/Meu%20Painel?section=market');
  const navigationIndex=events.findIndex(event=>Array.isArray(event)&&event[0]==='navigate');
  const reloadIndex=events.indexOf('reload');
  assert(reloadIndex>=0,'Tap must request a redraw for every outcome');
  assert(reloadIndex<navigationIndex,'Cache/data redraw must be requested before navigation');
  assert.equal(events.indexOf('control'),reloadIndex+1,'Control widgets must be cleaned up with the same reload request');
  assert.equal(navigationIndex,events.length-1,'No second navigation or refresh loop may follow the destination request');
  assert(scheduled>=1,'The bounded foreground timer must be scheduled');
  assert(cleared>=1,'The bounded foreground timer must be cleaned up');

  if(kind==='success'){
    assert.equal(values.get('manual-refresh').state,'queried');
    assert(events.indexOf('persist')<reloadIndex,'Successful data must persist before reload');
    assert(reloadIndex<navigationIndex,'Successful reload must precede navigation');
  }else if(kind==='rejection'){
    assert.equal(values.get('manual-refresh').state,'failed-cache-preserved');
    assert.equal(events.includes('persist'),false,'Rejected refresh must not invent a persisted model');
  }else{
    assert.equal(values.get('manual-refresh').state,'timeout-cache-preserved');
    assert.equal(events.includes('persist'),false,'Timed out refresh must not fabricate persistence');
  }
}

(async()=>{
  await runCase('success');
  await runCase('timeout');
  await runCase('rejection');
  console.log('PASS tap refresh: success/rejection await cache reload before one navigation; timeout reloads cache before one navigation; timers are cleaned up.');
})().catch(error=>{console.error(error);process.exitCode=1});
