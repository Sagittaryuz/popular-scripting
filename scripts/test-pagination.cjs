const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync,transformSync}=require('esbuild');
const dir=path.resolve(__dirname,'Popular Scripting');
function load(name,deps={},globals={}){const m={exports:{}};const code=transformSync(fs.readFileSync(path.join(dir,name),'utf8'),{loader:'ts',format:'cjs'}).code;vm.runInNewContext(code,{module:m,exports:m.exports,require:id=>deps[id],Date,Set,console,...globals});return m.exports}
const code=buildSync({entryPoints:[path.join(dir,'pagination.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,Set});const paging=m.exports;
const rows=Array.from({length:16},(_,i)=>({asset:{code:'a'+i}}));
for(const family of ['small','medium','large']){
 const cap=family==='small'?4:8,seen=[];
 for(let i=0;i<16/cap;i++){const p=paging.pageRows(rows,family,null,i);assert.equal(p.index,i);assert.equal(p.rows.length,cap);seen.push(...p.rows.map(r=>r.asset.code))}
 assert.equal(new Set(seen).size,16);assert.equal(paging.pageRows(rows,family,null,16/cap).index,0);
}
assert.deepEqual(Array.from(paging.pageRows(rows,'small',['a4','a5','a6','a7'],0).rows,r=>r.asset.code),['a0','a1','a2','a3'],'Legacy small-widget selection must not override fixed order');
assert.equal(paging.pageRows([], 'medium',null,20).count,1);assert.throws(()=>paging.pageKey('invalid'));
(async()=>{
 const values=new Map([['popular-pro-rows',rows]]),defs={};let queries=0,reloads=0;
 const storage={get:k=>values.get(k),set:(k,v)=>{values.set(k,v);return true}};
 load('app_intents.tsx',{'./pagination':paging,scripting:{AppIntentManager:{register:d=>{defs[d.name]=d;return ()=>({})}},AppIntentProtocol:{AppIntent:0},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Safari:{openURL:async()=>true}},'./model':{loadModel:async()=>{queries++;return {rows}}},'./alerts':{evaluateAlerts:async()=>{}},'./pro-common':{reloadWidgets:async()=>{reloads++}}},{Storage:storage});
 await defs.NextPopularPage.perform({family:'medium'});assert.equal(values.get('popular-page:medium'),1);assert.equal(queries,1);assert.equal(reloads,1);assert(values.get('popular-page-refresh:medium')>0);
 await defs.NextPopularPage.perform({family:'medium'});assert.equal(values.get('popular-page:medium'),0);
 await assert.rejects(defs.NextPopularPage.perform({family:'invalid'}));
 // Cached page render keeps actual query timestamp and makes no provider requests.
 values.set('popular-last-query',1234);
 const model=load('model.ts',{'./host':{createHost:()=>({})},'./pro-common':{refreshMinutes:()=>1},'./original-engine':{createEngine:()=>({version:'fixture',readOrderingMode:()=> 'fixed',orderingFeedback:()=>({label:'fixture'}),collectRows:async()=>{queries++;return []}})}},{Storage:storage});
 queries=0;const cached=await model.loadModel('medium',false,true);assert.equal(cached.rows.length,16);assert.equal(cached.queriedAt,1234);assert.equal(queries,0);
 const viewCode=buildSync({entryPoints:[path.join(dir,'view.tsx')],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text;
 const viewModule={exports:{}},sdk=new Proxy({AppIntentProtocol:{AppIntent:0},AppIntentManager:{register:d=>params=>({name:d.name,params})},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Safari:{openURL:async()=>true}},{get:(o,k)=>o[k]??k});
 const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
 vm.runInNewContext(viewCode,{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,Storage:storage,UIImage:{fromBase64String:()=>null}});
 const fakeApi={displayChart:()=>({}),lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]};
 const display=rows.map(r=>({...r,name:r.asset.code,price:'1',percent:'0%',movement:0,unit:'BRL',time:'23/10'}));
 for(const index of [0,1]){
  values.set('popular-page:medium',index);
  const tree=viewModule.exports.PopularView({model:{family:'medium',rows:display,api:fakeApi,status:{label:'fixture'},queriedAt:1234},width:338,height:170});
  assert(tree.props.accessibilityLabel.includes('a0,'),'Rendered medium widget must keep the fixed first page');assert(!tree.props.accessibilityLabel.includes('a8,'),'Persisted page state must not replace the fixed eight');assert.equal(tree.props.widgetURL,'scripting://run/Meu%20Painel?section=market');
  const walk=n=>n&&typeof n==='object'?[n,...(n.children||[]).flatMap(walk)]:[],buttons=walk(tree).filter(n=>n.type==='Button');assert.equal(buttons.length,8);assert(buttons.every(n=>n.props.intent.name==='RefreshAssetsOnTap'));assert(buttons.every(n=>n.props.frame.width<338&&n.props.frame.height<170));
 }
  values.set('popular-small-codes',['a4','a5','a6','a7']);values.set('popular-page:small',0);
  const smallTree=viewModule.exports.PopularView({model:{family:'small',rows:display,api:fakeApi,status:{label:'fixture'},queriedAt:1234},width:158,height:158});
  assert(smallTree.props.accessibilityLabel.startsWith('a0,'),'Small widget must start with Selic slot from fixed model order');
  assert(!smallTree.props.accessibilityLabel.includes('a4,'),'Persisted legacy small selection must be ignored');
 console.log('PASS pagination: full universe, distinct pages, wraparound, fixed small order despite legacy selection, family isolation, actual intent with forced data collection, cached render preserves observation time. Tap target preserves navigation.');
})().catch(e=>{console.error(e);process.exitCode=1});
