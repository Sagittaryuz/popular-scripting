const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {buildSync}=require('esbuild'),dir=path.resolve(__dirname,'Popular Scripting');

function bundle(file,options={}){
  return buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement',...options}).outputFiles[0].text;
}
function loadDraw(){
  const module={exports:{}};
  vm.runInNewContext(bundle('draw.js'),{module,exports:module.exports,Math,Number,Date,Intl,JSON});
  return module.exports;
}
function walk(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(walk)]:[]}

const draw=loadDraw(),G=draw.GEOMETRY;
assert.equal(G.row,36,'Approved row height is unchanged');
assert.equal(G.icon,26,'Approved icon diameter is unchanged');
assert.equal(G.blockTop,0,'The recovered 0.2.13 block starts at the row top');
assert.equal(G.blockHeight,G.row,'The grouped block keeps the full approved row height');
assert.equal(G.blockTop+G.blockHeight/2,G.iconTop+G.icon/2,'The total block center equals the icon center');
assert.equal(G.iconTop+G.icon/2,18,'Icon center remains at y=18');
assert.equal(G.line1Top,G.blockTop,'Line 1 keeps the recovered top offset');
assert.equal(G.graphTop,G.blockTop+G.top,'Graph keeps the recovered line 2 offset');
assert.equal(G.monthTop,G.blockTop+23,'Month band keeps the recovered offset');
assert.equal(G.line2Top,G.blockTop+G.top,'Variation keeps the recovered line 2 offset');
assert.equal(G.line3Top,G.blockTop+28,'Line 3 keeps the recovered offset');
assert.equal(G.line3Top+G.bottom,G.blockTop+G.blockHeight,'Line 3 keeps the approved row bottom');
assert.notEqual(G.line2Top+G.middle/2,G.blockCenter,'Line 2 is not independently recentered');

const sdk={
  AppIntentManager:{register:definition=>()=>({name:definition.name})},
  AppIntentProtocol:{AppIntent:0},
  ControlWidget:{reloadButtons:()=>{}},
  Safari:{openURL:async()=>true},
  Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},
  Button:'Button',Canvas:'Canvas',Image:'Image',Rectangle:'Rectangle',Text:'Text',ZStack:'ZStack'
};
const viewModule={exports:{}};
const values=new Map([['popular-page:small',9],['popular-page:medium',9],['popular-page:large',9],['popular-small-codes',['IPCA','CUB_GO','DIESEL_S10','BRENT']]]);
const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
vm.runInNewContext(bundle('view.tsx'),{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,Storage:{get:key=>values.get(key)},UIImage:{fromBase64String:()=>null}});

const codes=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'];
const rows=codes.map((code,index)=>({asset:{code},name:index===0?'Selic com nome suficientemente longo para testar a reserva':'Nome '+code,price:index===3?'-115,22':index===5?'—':String(100+index),percent:index===6?'-3,03%':'+1,14 pp',unit:code,time:index===5?'—':'27/10',movement:index%2? -1:1,chart:null}));
const api={displayChart:chart=>chart,lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]};
for(const [family,width,height,expected] of [['small',158,170,4],['medium',338,170,8],['large',338,360,8]]){
  const tree=viewModule.exports.PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height});
  const rowButtons=tree.children.filter(node=>node.type==='Button');
  assert.equal(rowButtons.length,expected,`${family} keeps ${expected} visible rows`);
  assert(rowButtons.every(button=>button.props.intent.name==='RefreshAssetsOnTap'),`${family} rows use the refresh-only intent`);
  const plan=draw.layout(family,width,height);
  for(let i=0;i<expected;i++){
    const rowNode=rowButtons[i].children.find(node=>node.type==='ZStack'),blocks=rowNode.children.filter(node=>node.type==='ZStack'&&node.props?.key==='detail-block'),block=blocks[0];
    assert.equal(blocks.length,1,`${family} row ${i} groups the three lines in one block`);
    assert.equal(block.props.frame.width,G.blockWidth*plan.scale,`${family} row ${i} block width is unchanged`);
    assert.equal(block.props.frame.height,G.blockHeight*plan.scaleY,`${family} row ${i} block height is unchanged`);
    const icon=walk(rowNode).find(n=>(n.type==='Canvas'||n.type==='Image')&&Math.abs((n.props?.frame?.width??0)-G.icon*plan.scale)<1e-8&&Math.abs((n.props?.frame?.height??0)-G.icon*plan.scaleY)<1e-8);
    assert(icon,`${family} row ${i} keeps its icon node`);
    assert(Math.abs(block.props.position.y-icon.props.position.y)<1e-8,`${family} row ${i} total block center equals icon center`);
    assert(Math.abs(block.props.position.y-G.blockCenter*plan.scaleY)<1e-8,`${family} row ${i} block has one common vertical displacement`);
    const desc=walk(block),texts=desc.filter(n=>n.type==='Text'),namePrice=texts.filter(n=>Math.abs(n.props.frame.height-G.top*plan.scaleY)<1e-8),middle=texts.filter(n=>Math.abs(n.props.frame.height-G.middle*plan.scaleY)<1e-8),bottomTexts=texts.filter(n=>Math.abs(n.props.frame.height-G.bottom*plan.scaleY)<1e-8),name=namePrice[0],price=namePrice[1],percent=middle[0],unit=bottomTexts[0],time=bottomTexts[1],graph=desc.find(n=>n.type==='Canvas'&&Math.abs((n.props?.frame?.height??0)-G.graphHeight*plan.scaleY)<1e-8);
    assert(name&&price&&percent&&unit&&time&&graph,`${family} row ${i} exposes all three alignment lines`);
    const top=n=>n.props.position.y-n.props.frame.height/2,bottom=n=>n.props.position.y+n.props.frame.height/2;
    assert(Math.abs(top(name)-G.line1Top*plan.scaleY)<1e-8,`${family} row ${i} name stays at the recovered block top`);
    assert(Math.abs(top(price)-top(name))<1e-8,`${family} row ${i} name/value top aligned`);
    assert(Math.abs(bottom(unit)-(G.line3Top+G.bottom)*plan.scaleY)<1e-8,`${family} row ${i} code stays at the recovered block bottom`);
    assert(Math.abs(bottom(unit)-bottom(time))<1e-8,`${family} row ${i} code/date bottom aligned`);
    assert(Math.abs(percent.props.position.y-(G.line2Top+G.middle/2)*plan.scaleY)<1e-8,`${family} row ${i} variation keeps the recovered line 2 position`);
    assert(Math.abs(graph.props.position.y-(G.graphTop+G.graphHeight/2)*plan.scaleY)<1e-8,`${family} row ${i} graph keeps the recovered line 2 position`);
    assert(top(name)>=G.blockTop*plan.scaleY&&bottom(unit)<=(G.blockTop+G.blockHeight)*plan.scaleY,`${family} row ${i} grouped content is not clipped`);
  }
  assert(tree.props.accessibilityLabel.includes('Selic com nome suficientemente longo'),`${family} retains long names`);
  assert(tree.props.accessibilityLabel.includes('-115,22'),`${family} retains negative values`);
  if(expected===8)assert(tree.props.accessibilityLabel.includes('—'),`${family} retains missing-date/value marker`);
}
console.log('PASS grouped alignment: recovered 0.2.13 line offsets, one total block centered on the icon, small/medium/large and long/negative/missing fixtures covered. Native iPhone render pending.');
