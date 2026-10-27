const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transformSync,buildSync}=require('esbuild');
const dir=path.resolve(__dirname,'Popular Scripting');
function load(name,deps,values=new Map()){
 const code=transformSync(fs.readFileSync(path.join(dir,name),'utf8'),{loader:name.endsWith('tsx')?'tsx':'ts',format:'cjs',jsxFactory:'createElement'}).code;
 const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require:name=>deps[name],Date,Storage:{get:k=>values.get(k),set:(k,v)=>{values.set(k,v);return true}}});return module.exports;
}
(async()=>{
 for(const fail of [false,true]){
  const values=new Map(),events=[],definitions={};
 const sdk={AppIntentManager:{register:d=>{definitions[d.name]=d;return ()=>({name:d.name})}},AppIntentProtocol:{AppIntent:0},Widget:{reloadAll:()=>events.push('reload')},ControlWidget:{reloadButtons:()=>events.push('control')},Safari:{openURL:async()=>{events.push('navigate');return true}},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'}};
  const deps={scripting:sdk,'./selection':{},'./pagination':{}};
  deps['./model']={loadModel:async(family,force)=>{assert.equal(family,'medium');assert.equal(force,true);events.push('query');if(fail)throw Error('offline');return {rows:[]}}};
  deps['./alerts']={evaluateAlerts:async()=>events.push('alerts')};deps['./pro-common']={reloadWidgets:async()=>events.push('reload')};
  load('app_intents.tsx',deps,values);
  await definitions['RefreshPopular'].perform();
  assert(events.includes('reload'),'Refresh failure must still request redraw');
  assert.equal(events[0],'query');assert.equal(values.get('manual-refresh').state,fail?'failed-cache-preserved':'queried');
 }
 const code=buildSync({entryPoints:[path.join(dir,'view.tsx')],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text;
 const native={AppIntentManager:{register:d=>()=>({name:d.name})},AppIntentProtocol:{AppIntent:0},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'}};
 const sdk=new Proxy(native,{get:(target,name)=>target[name]??name}),module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:()=>sdk,createElement:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props,children:children.flat(Infinity).filter(Boolean)}),Date,Storage:{get:()=>null},UIImage:{fromBase64String:()=>null}});
 for(const [family,width,height] of [['small',158,170],['medium',338,170],['large',338,360]]){
  const tree=module.exports.PopularView({model:{family,queriedAt:new Date(2026,9,24,9,5).getTime(),rows:[],status:{label:'fixture'}},width,height});
  const walk=n=>n&&typeof n==='object'?[n,...n.children.flatMap(walk)]:[];
  const allButtons=walk(tree).filter(n=>n.type==='Button');assert.equal(allButtons.length,1,'Whole-widget refresh and pagination share one target');
  const tap=allButtons.find(n=>n.props.intent.name==='RefreshAndOpenMarket');assert(tap);assert.equal(tap.props.frame.height,height);assert.equal(tap.props.frame.width,width);
  assert.equal(tap.props.accessibilityLabel,'Atualizar indicadores e abrir Mercado no Meu Painel');
 }
 const draw=load('draw.js',{});
 for(const [family,width,height] of [['small',158,158],['medium',338,170],['large',338,360]]){
  const bottom=height,plan=draw.layout(family,width,bottom),min=family==='large'?-32:0,max=family==='large'?169:146;
  const top=plan.y+min*plan.scaleY,lower=bottom-(plan.y+max*plan.scaleY);
  assert(top>=3.99&&lower>=3.99);assert(Math.abs(top-lower)<1e-8,'All content, including large title/footnote, is centered above footer');
 }
 let globalReloads=0;
 const common=load('pro-common.ts',{scripting:{Widget:{reloadAll:()=>{globalReloads++},reloadUserWidgets:()=>{throw Error('User-only API must not be chosen')}}}});
 await common.reloadWidgets();assert.equal(globalReloads,1,'Actual helper requests all Scripting widgets');
 console.log('PASS manual refresh: actual intent requests current data, preserves offline status and reloads on success/failure. Tap target preserves navigation.');
})().catch(e=>{console.error(e);process.exitCode=1});
