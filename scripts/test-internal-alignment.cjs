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
assert.equal(G.line2Top+G.middle/2,18,'Line 2 center is the approved icon center');
assert.equal(G.graphTop+G.graphHeight/2,18,'Graph center follows line 2 center');
assert.equal(5+G.icon/2,18,'Icon center remains at y=18');
assert.equal(G.line1Top+G.top,G.line2Top,'Line 1 ends at line 2 upper boundary');
assert(G.line3Top>=G.line2Top+G.middle,'Line 3 is below line 2');
assert.equal(G.line3Top+G.bottom,G.row,'Line 3 keeps the approved row bottom');

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
  const rowNodes=tree.children.filter(node=>node.type==='ZStack'&&node.props?.frame?.width===width&&node.props?.frame?.height===height);
  assert.equal(rowNodes.length,expected,`${family} keeps ${expected} visible rows`);
  const plan=draw.layout(family,width,height);
  for(let i=0;i<expected;i++){
    const rowNode=rowNodes[i],desc=walk(rowNode),texts=desc.filter(n=>n.type==='Text'),namePrice=texts.filter(n=>Math.abs(n.props.frame.height-G.top*plan.scaleY)<1e-8),middle=texts.filter(n=>Math.abs(n.props.frame.height-G.middle*plan.scaleY)<1e-8),bottomTexts=texts.filter(n=>Math.abs(n.props.frame.height-G.bottom*plan.scaleY)<1e-8),name=namePrice[0],price=namePrice[1],percent=middle[0],unit=bottomTexts[0],time=bottomTexts[1],graph=desc.find(n=>n.type==='Canvas'&&Math.abs((n.props?.frame?.height??0)-G.graphHeight*plan.scaleY)<1e-8);
    assert(name&&price&&percent&&unit&&time&&graph,`${family} row ${i} exposes all three alignment lines`);
    const y=(i%4)*(G.row+G.gap),top=n=>n.props.position.y-n.props.frame.height/2,bottom=n=>n.props.position.y+n.props.frame.height/2;
    assert(Math.abs(top(name)-top(price))<1e-8,`${family} row ${i} name/value top aligned`);
    assert(Math.abs(bottom(unit)-bottom(time))<1e-8,`${family} row ${i} code/date bottom aligned`);
    const iconCenter=plan.y+(y+5+G.icon/2)*plan.scaleY;
    assert(Math.abs(percent.props.position.y-iconCenter)<1e-8,`${family} row ${i} variation centered on icon`);
    assert(Math.abs(graph.props.position.y-iconCenter)<1e-8,`${family} row ${i} graph centered on icon`);
  }
  assert(tree.props.accessibilityLabel.includes('Selic com nome suficientemente longo'),`${family} retains long names`);
  assert(tree.props.accessibilityLabel.includes('-115,22'),`${family} retains negative values`);
  if(expected===8)assert(tree.props.accessibilityLabel.includes('—'),`${family} retains missing-date/value marker`);
}
console.log('PASS internal alignment: line 2 anchored to icon center; line 1 top-aligned; line 3 bottom-aligned; small/medium/large and long/negative/missing fixtures covered. Native iPhone render pending.');
