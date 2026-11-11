const assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path'),{buildSync}=require('esbuild');
function load(name){const mod={exports:{}};vm.runInNewContext(buildSync({entryPoints:[path.join(__dirname,name+'.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,{module:mod,exports:mod.exports,Response,Request,URL,TextDecoder,Uint8Array});return mod.exports}
const {createDiagnosticClient}=load('client'),{createDiagnosticHandler}=load('server');
async function main(){
let now=1794412800000,rows=[],saved=null,read=false,write=false,writes=0,gets=0;
const handler=createDiagnosticHandler({now:()=>now,authorize:async(_r,s)=>s==='read'?read:write,storage:{appendAndPrune:async(row,cutoff,limit)=>{rows=rows.filter(r=>r.receivedAt>=cutoff).concat(row).slice(-limit);writes++},readSince:async()=>{gets++;return rows}}});
const request=(method,body,pathname='/v1/diagnostics')=>new Request('https://fixture.invalid'+pathname,{method,headers:{'Content-Type':'application/json'},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
assert.equal((await handler(request('GET'))).status,401);assert.equal((await handler(request('POST',{}))).status,401);assert.equal(writes+gets,0);
let sends=0;const config={version:'0.2.51',engineVersion:'2026.11.11.100',now:()=>now,storage:{get:()=>saved,set:b=>{saved=b}},send:async batch=>{sends++;return (await handler(request('POST',batch))).status===202}};
const disabled=createDiagnosticClient(config);disabled.record({stage:'start',at:now});assert.equal(await disabled.flush(),'disabled');assert.equal(saved,null);assert.equal(sends,0);
const client=createDiagnosticClient({...config,enabled:true});client.record({stage:'validate',at:now,code:'future-timestamp',token:'SECRET',body:'SECRET',pointCount:288});assert.equal(JSON.stringify(saved).includes('SECRET'),false);
assert.equal(await client.flush(),'failed');assert.equal(client.snapshot().events.length,1);assert.equal(await client.flush(),'rate-limited');
write=true;now+=300001;assert.equal(await client.flush(),'sent');assert.equal(client.snapshot().events.length,0);assert.equal(rows.length,1);assert.equal((await handler(request('GET'))).status,401,'write authorization cannot read');
read=true;let response=await handler(request('GET'));assert.equal(response.status,200);assert.equal((await response.json()).records.length,1);
assert.equal((await handler(request('POST','x'.repeat(17000)))).status,413);assert.equal((await handler(request('POST','{'))).status,400);assert.equal((await handler(request('POST',{}))).status,400);assert.equal((await handler(request('GET',null,'/v1/diagnostics?token=x'))).status,404);
for(let i=0;i<100;i++)client.record({stage:'cache',at:now,pointCount:i});assert.equal(client.snapshot().events.length,32);
now+=7*86400000+1;assert.equal((await (await handler(request('GET'))).json()).records.length,0);
let release;const concurrent=createDiagnosticClient({...config,enabled:true,storage:undefined,send:()=>new Promise(r=>release=r)});concurrent.record({stage:'start',at:now});const pending=concurrent.flush();assert.equal(await concurrent.flush(),'busy');concurrent.record({stage:'complete',at:now});release(true);assert.equal(await pending,'sent');assert.equal(concurrent.snapshot().events.length,1);
const unavailable=createDiagnosticHandler({authorize:async()=>{throw Error('SECRET')},storage:{}});assert.equal(await (await unavailable(request('GET'))).text(),'{"code":"unavailable"}');
console.log('PASS synthetic client/server flow: disabled default, sanitation, bounded queue, rate limiting, failure retention, concurrent flush, scoped auth, size cap, TTL, private read-back, safe errors. No live deployment.');
}main().catch(e=>{console.error(e);process.exitCode=1});
