const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transformSync}=require('esbuild'),dir=path.join(__dirname,'Popular Scripting');
function load(deps,values){
  const code=transformSync(fs.readFileSync(path.join(dir,'app_intents.tsx'),'utf8'),{loader:'tsx',format:'cjs'}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:id=>deps[id],Date,Storage:{get:key=>values.get(key),set:(key,value)=>{values.set(key,value);return true}}});
  return module.exports;
}
async function tick(){await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));}
async function runCase(offline){
  const values=new Map(),events=[],definitions={};let release;
  const pending=new Promise(resolve=>{release=resolve});
  const sdk={AppIntentManager:{register:definition=>{definitions[definition.name]=definition;return ()=>({name:definition.name})}},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>events.push('control')},Safari:{openURL:async url=>{events.push(['navigate',url]);return true}},Script:{createRunURLScheme:(name,params)=>`scripting://run/${encodeURIComponent(name)}?section=${encodeURIComponent(params.section)}`}};
  const deps={scripting:sdk,'./pagination':{pageFamily:value=>value,pageKey:value=>`page:${value}`,pageRows:()=>({index:0,count:1,rows:[]})},'./model':{loadModel:async()=>{events.push('query');if(offline)throw Error('offline');return pending}},'./alerts':{evaluateAlerts:async()=>events.push('alerts')},'./pro-common':{reloadWidgets:async()=>events.push('reload')}};
  load(deps,values);
  const operation=definitions.RefreshAndOpenMarket.perform();
  await tick();
  const navigationIndex=events.findIndex(event=>Array.isArray(event)&&event[0]==='navigate');
  assert(navigationIndex>=0,'Every widget tap must retain the Meu Painel navigation');
  assert.equal(events[navigationIndex][1],'scripting://run/Meu%20Painel?section=market');
  if(!offline){assert.equal(events[0],'query');assert.equal(navigationIndex,1,'Navigation is not held by the data request');release({rows:[]})}
  await operation;
  assert(events.includes('reload'),'Tap must request a redraw even when data is unavailable');
  assert.equal(values.get('manual-refresh').state,offline?'failed-cache-preserved':'queried');
  assert(events.indexOf('reload')>navigationIndex,'Redraw happens after navigation was requested');
}
(async()=>{await runCase(false);await runCase(true);console.log('PASS tap refresh: query, navigation, redraw and offline cache preservation are independent; no retry loop.');})().catch(error=>{console.error(error);process.exitCode=1});
