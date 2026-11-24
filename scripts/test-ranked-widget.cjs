const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const {buildSync}=require('esbuild');
const {symbols}=require('./test-trading-host.cjs');
const codes=['IBOV','DOW_JONES','USD/BRL','BRENT'];
const currency=['BRL','USD','BRL','USD'],kind=['INDEX','INDEX','CURRENCY','FUTURE'],bases=[170000,48000,5.3,94];
const now=Date.parse('2026-11-09T09:00:00Z');
function fixture(i,rate){
  const timestamp=[],close=[],tradingPeriods=[];
  for(const day of ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06']){
    const start=Date.parse(day+'T13:00:00Z')/1000;
    tradingPeriods.push([{start,end:start+6*3600}]);
    for(let j=0;j<=72;j++){
      timestamp.push(start+j*300);
      close.push(bases[i]*(1+timestamp.length*rate));
    }
  }
  return {chart:{result:[{meta:{symbol:symbols[i],currency:currency[i],instrumentType:kind[i],dataGranularity:'5m',
    regularMarketPrice:close.at(-1),regularMarketTime:timestamp.at(-1),previousClose:bases[i],tradingPeriods},
    timestamp,indicators:{quote:[{close}]}}],error:null}};
}
const code=buildSync({entryPoints:[path.join(__dirname,'Popular Scripting','widget.tsx')],bundle:true,write:false,format:'cjs',
  platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text;
const element=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):
  {type,props:props||{},children:children.flat(Infinity).filter(Boolean)};
const nodes=n=>n&&typeof n==='object'?[n,...(n.children||[]).flatMap(nodes)]:[];
async function render({family,rates,cache=new Map(),at=now}){
  const [width,height]={systemSmall:[158,158],systemMedium:[338,170],systemLarge:[338,360]}[family];
  const responses=rates.map((rate,i)=>rate===null?null:fixture(i,rate));
  let show,networkCalls=0;
  const presented=new Promise(resolve=>{show=resolve});
  const sdk={Widget:{family,displaySize:{width,height},present:show},AppIntentManager:{register:d=>()=>({name:d.name})},
    AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>{}},Safari:{openURL:async()=>true},
    Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Button:'Button',Canvas:'Canvas',Circle:'Circle',
    Image:'Image',Rectangle:'Rectangle',SVG:'SVG',Text:'Text',ZStack:'ZStack'};
  const module={exports:{}},Storage={get:k=>cache.get(k),contains:k=>cache.has(k),set:(k,v)=>{cache.set(k,v);return true}};
  const Clock=class extends Date{constructor(...args){super(...(args.length?args:[at]))}static now(){return at}};
  vm.runInNewContext(code,{module,exports:module.exports,require:()=>sdk,createElement:element,Storage,URL,Date:Clock,Intl,
    setTimeout,clearTimeout,console,Data:{},Keychain:{contains:()=>false,get:()=>null},UIImage:{fromBase64String:()=>null},
    fetch:async url=>{
      networkCalls++;
      const response=responses[symbols.indexOf(decodeURIComponent(new URL(url).pathname.split('/').at(-1)))];
      if(!response)throw Error('synthetic offline or unavailable');
      return {ok:true,status:200,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(response)};
    }});
  let timer;
  try{
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Widget.present timed out')),5000)});
    const tree=await Promise.race([presented,deadline]);
    assert.equal(tree.type,'ZStack','native widget entry point did not present an error');
    const buttons=tree.children.filter(n=>n.type==='Button');
    const rows=cache.get('popular-pro-rows');
    assert.equal(rows.length,4);
    assert.deepEqual(Array.from(buttons,n=>n.props.key),Array.from(rows,r=>r.asset.code),'displayed order matches persisted order');
    assert.deepEqual(Array.from(cache.get('sagittaryuz-dashboard-v1:Popular').rows,r=>r.name),Array.from(rows,r=>r.name),'shared summary follows presentation');
    assert(buttons.every(n=>n.props.intent.name==='RefreshAssetsOnTap'));
    const y=buttons.map(n=>n.props.position.y);
    assert(y.every((p,i)=>i===0||p>y[i-1]),'the order runs visually from top to bottom');
    for(const [i,r] of Array.from(rows.entries())){
      const percentNode=nodes(buttons[i]).find(n=>n.props?.key==='percent');
      const priceNode=nodes(buttons[i]).find(n=>n.props?.key==='price');
      const color=r.movement>0?'#00E676':r.movement<0?'#FF1744':r.movement===0?'#FFD600':'#96969C';
      assert.equal(percentNode.children[0],r.percent);
      assert.equal(priceNode.children[0],r.price);
      assert.equal(percentNode.props.foregroundStyle,color);
      assert(buttons[i].props.accessibilityLabel.includes(r.time));
      assert(buttons[i].props.accessibilityLabel.includes(r.percent));
      assert.equal(nodes(buttons[i]).filter(n=>n.props?.key==='asset-chart').length,1);
    }
    assert(networkCalls>=4,'exercised transport for the four tracked assets');
    return rows;
  }finally{clearTimeout(timer)}
}
const order=rows=>Array.from(rows,r=>r.asset.code);
const values=rows=>Array.from(rows,r=>[r.asset.code,r.asset.price,r.movement,r.time,r.chart?.points?.length]);
async function test(){
  for(const family of ['systemSmall','systemMedium','systemLarge']){
    const cache=new Map(),rates=[0.0001,0,-0.0005,0.0003];
    const rows=await render({family,rates,cache});
    assert.deepEqual(order(rows),[codes[3],codes[0],codes[1],codes[2]]);
    assert(rows[0].movement>rows[1].movement&&rows[1].movement>0&&rows[2].movement===0&&rows[3].movement<0);
    assert(Math.abs(rows[3].movement)>rows[0].movement,'signed ranking is not absolute ranking');
    assert(rows.every(r=>r.chartCoverage.complete));
    if(family==='systemSmall'){
      const offline=await render({family,rates:[null,null,null,null],cache,at:now+40*60000});
      assert.deepEqual(values(offline),values(rows),'warm network failure keeps coherent tuples and ordering');
    }
  }
  const rounded=await render({family:'systemSmall',rates:[0.0000013,0,0,0.0000014]});
  assert.equal(rounded[0].percent,rounded[1].percent,'different raw returns may have the same rounded label');
  assert.deepEqual(order(rounded),[codes[3],codes[0],codes[1],codes[2]],'unrounded values determine order');
  const partial=await render({family:'systemSmall',rates:[-0.0002,0,0,null]});
  assert.deepEqual(order(partial),[codes[1],codes[2],codes[0],codes[3]],'exact ties stable; unavailable below a negative value');
  assert.equal(partial[3].movement,null);
  assert.doesNotMatch(partial[3].percent,/0,00/,'missing return never looks like actual zero');
  console.log('PASS native widget entry: all families, signed descending, ties, unavailable with cold cache, coherent warm offline data, charts/colors/taps kept.');
}
test().catch(error=>{console.error(error);process.exitCode=1});
