const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const {buildSync}=require('esbuild'),dir=path.resolve(__dirname,'Popular Scripting');
function bundle(file){return buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text}
function loadDraw(){const module={exports:{}};vm.runInNewContext(bundle('draw.js'),{module,exports:module.exports,Math,Number,Date,Intl,JSON});return module.exports}
function walk(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(walk)]:[]}
const draw=loadDraw(),G=draw.GEOMETRY;
assert.equal(G.row,36,'row height stays fixed');
assert.equal(G.icon,20,'icons are reduced');
assert.equal(G.iconTop+G.icon/2,G.blockCenter,'icon and right-hand group share the row center');
assert.equal(G.nameTop+G.nameHeight,G.iconTop,'the title sits immediately above the icon');
assert(G.graphHeight>5.5,'the chart receives visibly more height');
assert.equal(G.graphTop+G.graphHeight/2,G.line2Top+G.middle/2,'chart and variation share the centered middle line');
assert.equal(G.line3Top+G.bottom,G.blockTop+G.blockHeight,'bottom metadata remains bottom aligned');

const sdk={AppIntentManager:{register:definition=>()=>({name:definition.name})},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>{}},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Button:'Button',Canvas:'Canvas',Circle:'Circle',HStack:'HStack',Image:'Image',Rectangle:'Rectangle',Text:'Text',ZStack:'ZStack'};
const viewModule={exports:{}},values=new Map([['popular-page:small',9],['popular-page:medium',9],['popular-page:large',9]]);
const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
vm.runInNewContext(bundle('view.tsx'),{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,Storage:{get:key=>values.get(key)},UIImage:{fromBase64String:()=>null}});
const codes=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'];
const rows=codes.map((code,index)=>({asset:{code},name:index===0?'Selic com nome suficientemente longo para testar a reserva':'Nome '+code,price:index===3?'-115,22':String(100+index),percent:index===6?'-3,03%':'+1,14 pp',unit:code,time:index===5?'—':'27/10',movement:index%2?-1:1,chart:null}));
const api={displayChart:chart=>chart,lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]};
for(const [family,width,height,expected] of [['small',158,170,4],['medium',338,170,8],['large',338,360,8]]){
  const tree=viewModule.exports.PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height}),buttons=tree.children.filter(node=>node.type==='Button');
  assert.equal(buttons.length,expected,`${family} keeps the fixed indicator count`);
  const plan=draw.layout(family,width,height);
  for(let i=0;i<expected;i++){
    const content=buttons[i].children.find(node=>node.type==='ZStack'),desc=walk(content),block=desc.find(node=>node.props?.key==='detail-block'),nameLine=desc.find(node=>node.type==='HStack'&&node.props?.key==='name-status-line'),nameText=desc.find(node=>node.type==='Text'&&node.props?.key==='name-text'),codeText=desc.find(node=>node.type==='Text'&&Math.abs((node.props?.frame?.width??0)-G.code*plan.scale)<1e-8&&node.props?.frame?.alignment==='center');
    const icon=desc.find(n=>(n.type==='Canvas'||n.type==='Image')&&Math.abs((n.props?.frame?.width??0)-G.icon*plan.scale)<1e-8&&Math.abs((n.props?.frame?.height??0)-G.icon*plan.scaleY)<1e-8);
    const texts=walk(block).filter(n=>n.type==='Text'),price=texts.find(n=>Math.abs((n.props?.frame?.width??0)-G.price*plan.scale)<1e-8),percent=texts.find(n=>Math.abs((n.props?.frame?.width??0)-G.percent*plan.scale)<1e-8),unit=texts.find(n=>Math.abs((n.props?.frame?.width??0)-G.unit*plan.scale)<1e-8),time=texts.find(n=>Math.abs((n.props?.frame?.width??0)-G.time*plan.scale)<1e-8),graph=desc.find(n=>n.type==='Canvas'&&Math.abs((n.props?.frame?.height??0)-G.graphHeight*plan.scaleY)<1e-8);
    assert(block&&nameLine&&nameText&&codeText&&icon&&price&&percent&&unit&&time&&graph,`${family} row ${i} contains title, icon, code, value, graph and metadata`);
    assert.equal(nameLine.props.frame.width,G.name*plan.scale,`${family} title has the dedicated upper span`);
    assert.equal(nameLine.props.frame.alignment,'leading');
    assert.equal(nameLine.props.spacing,2);
    assert.equal(nameLine.children.filter(n=>n.type==='Circle'&&n.props?.key==='market-status-dot').length,1);
    const top=n=>n.props.position.y-n.props.frame.height/2,bottom=n=>n.props.position.y+n.props.frame.height/2;
    assert(Math.abs(top(nameLine)-G.nameTop*plan.scaleY)<1e-8,`${family} title is above the icon`);
    assert(Math.abs(bottom(nameLine)-(G.nameTop+G.nameHeight)*plan.scaleY)<1e-8);
    assert(Math.abs(icon.props.position.y-G.blockCenter*plan.scaleY)<1e-8,`${family} icon remains vertically centered`);
    assert(Math.abs(icon.props.position.x-(G.iconLeft+G.icon/2)*plan.scale)<1e-8,`${family} icon is centered in the left strip`);
    assert(Math.abs((G.iconLeft+G.icon/2)-G.iconColumn/2)<1e-8,`${family} icon strip is centered`);
    assert(Math.abs(top(codeText)-(G.codeTop)*plan.scaleY)<1e-8,`${family} short code starts below the icon`);
    assert(top(codeText)>=bottom(icon)-1e-8,`${family} short code does not overlap its icon`);
    assert.equal(codeText.props.frame.width,G.code*plan.scale,`${family} short code has a dedicated left-column box`);
    assert.equal(codeText.props.frame.alignment,'center');
    assert(Math.abs(top(price)-top(nameLine))<1e-8,`${family} price remains top aligned with title`);
    assert(Math.abs(graph.props.position.y-(G.graphTop+G.graphHeight/2)*plan.scaleY)<1e-8,`${family} graph uses the expanded middle band`);
    assert(Math.abs(graph.props.position.y-icon.props.position.y)<1e-8,`${family} graph center stays aligned with the icon`);
    assert(Math.abs(percent.props.position.y-(G.line2Top+G.middle/2)*plan.scaleY)<1e-8,`${family} variation is centered with graph`);
    assert(Math.abs(bottom(unit)-bottom(time))<1e-8,`${family} metadata is bottom aligned`);
    assert(Math.abs(bottom(unit)-(G.line3Top+G.bottom)*plan.scaleY)<1e-8,`${family} metadata stays inside row`);
    const blockLeft=block.props.position.x-block.props.frame.width/2;
    assert(nameLine.props.position.x+nameLine.props.frame.width/2<blockLeft+price.props.position.x-price.props.frame.width/2,`${family} title and quote columns do not collide`);
    assert(tree.props.accessibilityLabel.includes('Selic com nome suficientemente longo'));
  }
}
console.log('PASS 0.2.26 geometry: name/icon/short-code stack, centered left strip, expanded graph band, top/middle/bottom alignment, long/negative/missing fixtures covered. Native iPhone render pending.');
