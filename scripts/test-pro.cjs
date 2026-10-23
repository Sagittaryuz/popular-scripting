const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const {buildSync,transformSync}=require('esbuild');
const dir=path.join(__dirname,'Popular Scripting');
function load(name,globals={}){const code=buildSync({entryPoints:[path.join(dir,name)],bundle:true,write:false,platform:'node',format:'cjs',external:['scripting']}).outputFiles[0].text;const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,Date,URL,Set,console,require:()=>({}),...globals});return module.exports}
const api=load('pro-model.ts'),now=Date.now();
const row=(price,at=now)=>({asset:{code:'USD/BRL',price,currency:'BRL',unit:'BRL/USD',source:'AwesomeAPI'},stamp:{time:at,day:new Date(at).toISOString().slice(0,10)},name:'Dólar',time:'observação',chart:{points:[{value:price,stamp:{day:'2026-10-23'}}]}});
const rule={id:'r',code:'USD/BRL',direction:'above',threshold:5};
assert.equal(api.crossed(rule,null,{value:6,at:now}),false);
assert.equal(api.crossed(rule,{value:4,at:now-1},{value:6,at:now}),true);
assert.equal(api.crossed(rule,{value:6,at:now-1},{value:7,at:now}),false);
assert.equal(api.crossed(rule,{value:4,at:now},{value:6,at:now-1}),false);
assert.equal(api.quoteObservation(row(null)),null);assert.equal(api.quoteObservation(row(6,now-10*86400000)),null);assert.equal(api.quoteObservation(row(6,now+3600000)),null);
assert.throws(()=>api.validateRules([{...rule,threshold:Infinity}]));assert.throws(()=>api.validateRules([rule,rule]));
const rows=['a','b','c','d','e','f','g','h'].map(code=>({asset:{code}}));
assert.equal(api.selectSmall(rows,['e','f','g','h'])[0].asset.code,'e');assert.equal(api.selectSmall(rows,['e','e','g','h'])[0].asset.code,'a');
assert(api.historyCSV([row(5)]).includes('"5"'));assert(api.historyCSV([{...row(5),asset:{...row(5).asset,code:'=HYPERLINK("x")'}}]).includes("'=HYPERLINK"));
(async()=>{
 const modelCode=transformSync(require('node:fs').readFileSync(path.join(dir,'model.ts'),'utf8'),{loader:'ts',format:'cjs'}).code;
 const modelModule={exports:{}};let collectionFamily;
 const nativeRows=rows.map(r=>({...r,asset:{...r.asset,price:1}}));
 vm.runInNewContext(modelCode,{module:modelModule,exports:modelModule.exports,Date,Storage:{get:()=>0,set:()=>true},require:id=>{
  if(id==='./host')return {createHost:()=>({})};
  if(id==='./pro-common')return {refreshMinutes:()=>1,dashboardStatus:()=>{}};
  return {createEngine:(_,options)=>{collectionFamily=options.family;return {collectRows:async()=>nativeRows,orderingFeedback:()=>({label:'fixture'}),readOrderingMode:()=> 'fixed',displayName:a=>a.code,displayPrice:()=> '1',displayPercent:()=> '0',presentationPercent:()=>0,timeText:()=>'',unitText:()=>'',quoteAudit:r=>r.asset.code,failures:[]}}};
 }});
 const small=await modelModule.exports.loadModel('small');assert.equal(collectionFamily,'medium');assert.equal(small.family,'small');assert.equal(small.rows.length,8);assert.equal(api.selectSmall(small.rows,['e','f','g','h'])[0].asset.code,'e');
 const values=new Map([['popular-alerts-enabled',true],['popular-alerts',[rule]]]);let sent=0;
 const alerts=load('alerts.ts',{Storage:{get:k=>values.get(k)??null,set:(k,v)=>{values.set(k,v);return true}},Notification:{schedule:async()=>{sent++}}});
 await alerts.evaluateAlerts([row(4)]);assert.equal(sent,0);
 await alerts.evaluateAlerts([row(6)]);assert.equal(sent,1);
 await alerts.evaluateAlerts([row(6)]);assert.equal(sent,1);
 await alerts.evaluateAlerts([row(4,now-10*86400000)]);await alerts.evaluateAlerts([row(6)]);assert.equal(sent,1,'Old sample cannot rearm alert');
 await alerts.evaluateAlerts([row(4)]);await alerts.evaluateAlerts([row(6)]);assert.equal(sent,2,'New crossing rearms once');
 console.log('PASS Pro: indicator selection, rule validation, freshness, old/future data, crossing/rearming/deduplication and safe CSV. Native notification delivery remains untested.');
})().catch(e=>{console.error(e);process.exitCode=1});
