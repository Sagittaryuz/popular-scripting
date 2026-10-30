const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm')
const {buildSync}=require('esbuild'),dir=path.resolve(__dirname,'Popular Scripting')
function bundle(file){return buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text}
function loadDraw(){const module={exports:{}};vm.runInNewContext(bundle('draw.js'),{module,exports:module.exports,Math,Number,Date,Intl,JSON});return module.exports}
function walk(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(walk)]:[]}
const draw=loadDraw(),G=draw.GEOMETRY
assert.equal(G.row,36,'row height stays fixed')
assert.equal(G.icon,26,'icons return to the pre-0.2.25 diameter')
assert.equal(G.col1,28,'icon column keeps the 26 pt badge with a measured margin')
assert.equal(G.col2,40,'identity column is widened for readable code/date text')
assert(G.col2>G.col1,'identity column is wider than the icon column when text needs it')
assert.equal(G.nameTextMax+G.statusSpacing+G.statusDot+G.statusTrailingGap,G.name,'name reservation leaves explicit dot spacing and trailing room')
assert.equal(G.col1+G.col2+G.col3+G.col4+G.colGap*3,G.column,'four columns fill the useful row width')
assert.equal(G.iconLeft+G.icon/2,G.col1/2,'icon is centered in its column')
assert.equal(G.graphX,G.col1+G.colGap+G.col2+G.colGap,'graph starts after icon and identity columns')
assert(G.graphHeight>5.5,'the chart receives the requested height')
assert.equal((G.line1Top+(G.line2Top+G.middle))/2,G.blockCenter,'value/variation block is centered on the row')
assert(G.line3Top>G.line1Top+G.top,'compact unit is below the value')
assert(G.line3Top+G.bottom<G.line2Top,'compact unit stays above the variation')
assert.equal(G.nameX,G.dateX,'name and code/date share the same identity column')
assert.equal(G.name,G.date,'name and code/date use the same width')
const sdk={AppIntentManager:{register:definition=>()=>({name:definition.name})},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>{}},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Button:'Button',Canvas:'Canvas',Circle:'Circle',HStack:'HStack',Image:'Image',Rectangle:'Rectangle',Text:'Text',ZStack:'ZStack'}
const viewModule={exports:{}},values=new Map([['popular-page:small',9],['popular-page:medium',9],['popular-page:large',9]])
const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)})
vm.runInNewContext(bundle('view.tsx'),{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,Storage:{get:key=>values.get(key)},UIImage:{fromBase64String:()=>null}})
const codes=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']
const rows=codes.map((code,index)=>({asset:{code},name:index===0?'Selic com nome suficientemente long para testar a reserva':'Nome '+code,price:index===3?'-115,22':String(100+index),percent:index===6?'-3,03%':'+1,14 pp',unit:code,time:index===5?'—':'27/10',movement:index%2?-1:1,chart:null}))
const api={displayChart:chart=>chart,lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]}
for(const [family,width,height,expected] of [['small',158,170,4],['medium',338,170,8],['large',338,360,8]]){
  const tree=viewModule.exports.PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height}),buttons=tree.children.filter(node=>node.type==='Button')
  assert.equal(buttons.length,expected,family+' keeps the fixed indicator count')
  const plan=draw.layout(family,width,height)
  for(let i=0;i<expected;i++){
    const content=buttons[i].children.find(node=>node.type==='ZStack'),desc=walk(content)
    const nameLine=desc.find(node=>node.type==='HStack'&&node.props?.key==='name-status-line'),nameText=desc.find(node=>node.type==='Text'&&node.props?.key==='name-text'),meta=desc.find(node=>node.type==='Text'&&node.props?.key==='asset-meta'),icon=desc.find(node=>node.props?.key==='asset-icon'||node.props?.key==='asset-image'||node.props?.key==='asset-fallback'),price=desc.find(node=>node.type==='Text'&&node.props?.key==='price'),percent=desc.find(node=>node.type==='Text'&&node.props?.key==='percent'),unit=desc.find(node=>node.type==='Text'&&node.props?.key==='unit'),graph=desc.find(node=>node.type==='Canvas'&&node.props?.key==='asset-chart')
    assert(nameLine&&nameText&&meta&&icon&&price&&percent&&unit&&graph,family+' row '+i+' contains measured column elements')
    if(i===0){
      assert(nameText.props.font<4.8*plan.scale,family+' long name drops below the old truncating font floor')
      assert(nameText.props.frame.width<=G.nameTextMax*plan.scale+1e-8,family+' long name stays inside the reserved text width')
      assert.equal(nameText.props.minScaleFactor,.72,family+' long name has bounded native fallback scaling')
    }
    const top=n=>n.props.position.y-n.props.frame.height/2,bottom=n=>n.props.position.y+n.props.frame.height/2
    assert(Math.abs(top(nameLine)-G.nameTop*plan.scaleY)<1e-8,family+' name starts at top')
    assert(Math.abs(icon.props.position.y-G.blockCenter*plan.scaleY)<1e-8,family+' icon is vertically centered')
    assert(Math.abs(meta.props.position.y-(G.dateTop+G.dateHeight/2)*plan.scaleY)<1e-8,family+' code/date uses its lower line')
    assert(Math.abs(graph.props.position.y-(G.graphTop+G.graphHeight/2)*plan.scaleY)<1e-8,family+' graph has the usable height')
    assert(Math.abs(graph.props.position.y-icon.props.position.y)<1e-8,family+' graph center stays aligned with the icon')
    assert(Math.abs(((top(price)+bottom(percent))/2)-G.blockCenter*plan.scaleY)<1e-8,family+' value/variation block is centered')
    assert(top(unit)>=bottom(price)-1e-8&&bottom(unit)<=top(percent)+1e-8,family+' compact unit sits between value and variation')
    assert(Math.abs(top(price)-G.line1Top*plan.scaleY)<1e-8,family+' quote stays at the top')
    assert(nameLine.props.position.x+nameLine.props.frame.width/2<=graph.props.position.x-graph.props.frame.width/2-1e-8,family+' name cell does not collide with graph')
    assert(meta.props.frame.width===G.date*plan.scale,family+' code/date has the identity width')
    assert(tree.props.accessibilityLabel.includes('Selic com nome suficientemente long'))
  }
}
console.log('PASS 0.2.37 geometry: widened identity column, explicit name/dot reservation, grouped centered text blocks, 26 pt icons, graph/quote separation and long/missing fixtures covered. Native iPhone render pending.')
