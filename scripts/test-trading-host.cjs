const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
function bundle(file,globals={}){
  const module={exports:{}};
  const code=buildSync({entryPoints:[path.join(__dirname,'Popular Scripting',file)],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
  vm.runInNewContext(code,{module,exports:module.exports,URL,console,Date,Intl,Math,JSON,Set,Map,setTimeout,clearTimeout,...globals});return module.exports;
}
function hostHarness(payloadForURL,foreground=true,clock){
  const calls=[],storage=new Map();
  const host=bundle('host.ts',{...(clock?{Date:class extends Date{static now(){return clock.now}}}:{}),Data:{},Storage:{contains:k=>storage.has(k),get:k=>storage.get(k),set:(k,v)=>{storage.set(k,v);return true}},Keychain:{contains:()=>false},fetch:async(url,options)=>{calls.push({url,options});const payload=await payloadForURL(url);return {ok:true,status:200,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(payload)}}});
  return {host:host.createHost(foreground),allowedURL:host.allowedURL,calls,storage};
}
const symbols=['^BVSP','^DJI','BRL=X','BZ=F'];
const endpoint=(symbol,range='5d')=>'https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?range='+range+'&interval=5m';
async function test(){
  for(const foreground of [true,false]){
    const h=hostHarness(()=>({ok:true}),foreground);
    for(const symbol of symbols)for(const range of ['5d','1mo']){const r=new h.host.Request(endpoint(symbol,range));r.timeoutInterval=99;assert.equal((await r.loadJSON()).ok,true);assert(h.calls.at(-1).options.timeout<=(foreground?20:7));assert(h.calls.at(-1).options.timeout>(foreground?19:6));}
    const denied=[endpoint('AAPL'),endpoint('^DJI').replace('query1.','query2.'),endpoint('^DJI').replace('query1.finance.yahoo.com','finance.yahoo.com'),endpoint('^DJI').replace('/v8/finance/chart/','/v7/finance/quote/'),endpoint('^DJI').replace('interval=5m','interval=1d'),endpoint('^DJI').replace('range=5d','range=1y'),endpoint('^DJI')+'&crumb=secret',endpoint('^DJI')+'#fragment',endpoint('^DJI')+'&range=1mo','http'+endpoint('^DJI').slice(5),endpoint('^DJI').replace('https://','https://user:pass@')];
    for(const url of denied){const before=h.calls.length;await assert.rejects(()=>new h.host.Request(url).loadJSON());assert.equal(h.calls.length,before,'denied endpoint must never reach transport');}
    for(const headers of [{Authorization:'Bearer fixture'},{authorization:'Bearer fixture'},{Cookie:'fixture'},{cookie:'fixture'},{'Proxy-Authorization':'fixture'}]){const r=new h.host.Request(endpoint('^DJI'));r.headers=headers;const before=h.calls.length;await assert.rejects(()=>r.loadJSON());assert.equal(h.calls.length,before,'credentials must not reach Yahoo');}
    const post=new h.host.Request(endpoint('^DJI'));post.method='POST';await assert.rejects(()=>post.loadJSON());
    const redirect=h.calls[0].options.handleRedirect;
    await assert.rejects(()=>redirect({url:endpoint('AAPL')}),'unsupported redirected symbol is blocked');
    assert.equal(await redirect({url:'https://api.kraken.com/0/public/Ticker'}),null,'cross-origin redirect is blocked');
    const old=new h.host.Request('https://api.kraken.com/0/public/Ticker');old.timeoutInterval=99;await old.loadJSON();assert(h.calls.at(-1).options.timeout<=(foreground?6:3),'old source timeout cap remains unchanged');
  }
  for(const foreground of [true,false]){
    const clock={now:100000},h=hostHarness(()=>({ok:true}),foreground,clock);
    clock.now+=(foreground?30000:8000)-500;
    const r=new h.host.Request(endpoint('^DJI'));r.timeoutInterval=99;await r.loadJSON();
    assert.equal(h.calls[0].options.timeout,.5,'request is capped by remaining total budget');
    clock.now+=501;await assert.rejects(()=>new h.host.Request(endpoint('^BVSP')).loadJSON(),/Orçamento/);
    assert.equal(h.calls.length,1,'expired budget never reaches transport');
  }
  console.log('PASS real bundled host: four Yahoo symbols and two ranges, restrictive URLs, GET only, credentials blocked before transport, redirects and old-source budgets.');
}
module.exports={bundle,hostHarness,endpoint,symbols};
if(require.main===module)test().catch(e=>{console.error(e);process.exitCode=1});
