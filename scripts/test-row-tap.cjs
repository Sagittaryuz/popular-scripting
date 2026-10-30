const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild')
const root=path.resolve(__dirname,'Popular Scripting')
function bundle(file){return buildSync({entryPoints:[path.join(root,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text}
function walk(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(walk)]:[]}
const definitions={},sdk={AppIntentManager:{register:definition=>{definitions[definition.name]=definition;return params=>({name:definition.name,params})}},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>{}},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Button:'Button',Canvas:'Canvas',Circle:'Circle',Image:'Image',Rectangle:'Rectangle',SVG:'SVG',Text:'Text',ZStack:'ZStack'}
const viewModule={exports:{}},createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)})
vm.runInNewContext(bundle('view.tsx'),{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,URL,Storage:{get:()=>null,set:()=>true},UIImage:{fromBase64String:()=>null}})
const drawModule={exports:{}};vm.runInNewContext(bundle('draw.js'),{module:drawModule,exports:drawModule.exports,Math,Number,Date,Intl,JSON})
const {GEOMETRY:G,layout}=drawModule.exports,codes=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']
const inlineSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><circle cx="13" cy="13" r="13" fill="#345"/></svg>'
const rows=codes.map((code,index)=>({asset:{code,...(code==='IBOV'?{iconSVGCode:inlineSVG}:{})},name:'Nome '+code,price:'1,00',percent:index%2?'-0,14%':'+0,82%',movement:index%2?-1:1,unit:'BRL',time:'27/10',chart:null}))
const api={displayChart:chart=>chart,lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]}
const expectedURL='scripting://run/Meu%20Painel?section=market'
function box(node){const {frame,position}=node.props;return {left:position.x-frame.width/2,right:position.x+frame.width/2,top:position.y-frame.height/2,bottom:position.y+frame.height/2}}
function overlap(a,b){return a.left<b.right-1e-8&&a.right>b.left+1e-8&&a.top<b.bottom-1e-8&&a.bottom>b.top+1e-8}
for(const [family,width,height,expected] of [['small',158,158,4],['medium',338,170,8],['large',338,360,8]]){
  const tree=viewModule.exports.PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height}),buttons=tree.children.filter(node=>node.type==='Button'),plan=layout(family,width,height)
  assert.equal(buttons.length,expected,family+' exposes one target per visible line')
  assert.equal(tree.props.widgetURL,expectedURL)
  assert(buttons.every(button=>button.props.intent.name==='RefreshAssetsOnTap'))
  for(let i=0;i<expected;i++){
    const button=buttons[i],rowIndex=i%4,content=button.children.find(node=>node.type==='ZStack'),desc=walk(content)
    const nameText=desc.find(node=>node.type==='Text'&&node.props?.key==='name-text')
    const meta=desc.find(node=>node.type==='Text'&&node.props?.key==='asset-meta')
    const icon=desc.find(node=>node.props?.key==='asset-icon'||node.props?.key==='asset-image'||node.props?.key==='asset-fallback')
    const remoteMask=desc.find(node=>node.type==='ZStack'&&node.props?.key==='asset-remote-svg-mask'),iconBox=remoteMask||icon
    if(rows[i].asset.code==='IBOV'){
      const remoteChildren=remoteMask?.children||[]
      const fallback=content.children.find(node=>node.type==='Canvas'&&node.props?.key==='asset-icon'),remoteSVG=remoteChildren.find(node=>node.type==='SVG'&&node.props?.key==='asset-inline-svg')
      assert(remoteMask&&fallback&&remoteSVG,'an API SVG fixture keeps the IBOV fallback beside the inline renderer')
      assert(!remoteChildren.some(node=>node.type==='Canvas'&&node.props?.key==='asset-icon'),'the fallback is outside the SVG mask so a blank renderer cannot hide it')
      assert.equal(remoteSVG.props.code,inlineSVG)
    }
    const graph=desc.find(node=>node.type==='Canvas'&&node.props?.key==='asset-chart')
    const price=desc.find(node=>node.type==='Text'&&node.props?.key==='price')
    const percent=desc.find(node=>node.type==='Text'&&node.props?.key==='percent')
    const unit=desc.find(node=>node.type==='Text'&&node.props?.key==='unit')
    assert(nameText&&meta&&icon&&graph&&price&&percent&&!unit,family+' row '+i+' contains the four columns without a unit line')
    assert(!desc.some(node=>node.type==='Circle'&&node.props?.key==='market-status-dot'),family+' row '+i+' has no status dot consuming identity width')
    if(rows[i].asset.code==='USD/BRL')assert.equal(icon.type,'Canvas')
    assert.equal(nameText.props.frame.width,G.name*plan.scale)
    assert.equal(nameText.props.frame.alignment,'leading')
    assert.equal(nameText.props.minScaleFactor,1)
    assert.equal(meta.props.frame.width,G.date*plan.scale)
    assert.equal(meta.props.position.x-nameText.props.position.x,(G.dateX+G.date/2-(G.nameX+G.name/2))*plan.scale)
    assert.equal(iconBox.props.frame.width,G.icon*plan.scale)
    assert.equal(iconBox.props.frame.height,G.icon*plan.scaleY)
    assert.equal(iconBox.props.position.x,(G.iconLeft+G.icon/2)*plan.scale)
    assert.equal(iconBox.props.position.y,G.blockCenter*plan.scaleY)
    assert.equal(graph.props.frame.width,G.graph*plan.scale)
    assert.equal(graph.props.frame.height,G.graphHeight*plan.scaleY)
    assert.equal(graph.props.position.x,(G.graphX+G.graph/2)*plan.scale)
    assert.equal(price.props.frame.width,G.price*plan.scale)
    assert.equal(percent.props.frame.width,G.percent*plan.scale)
    assert.equal(price.props.font,14*plan.scale)
    assert.equal(price.props.frame.alignment,'trailing')
    assert.equal(percent.props.frame.alignment,'trailing')
    assert(nameText.props.position.x+nameText.props.frame.width/2<=graph.props.position.x-graph.props.frame.width/2-1e-8,family+' identity column does not enter graph')
    assert(meta.props.position.x-meta.props.frame.width/2>=nameText.props.position.x-nameText.props.frame.width/2-1e-8)
    assert.equal(button.props.frame.width,G.column*plan.scale)
    assert.equal(button.props.frame.height,(rowIndex<3?G.row+G.gap:G.row)*plan.scaleY)
    assert(button.props.accessibilityLabel.startsWith('Atualizar indicadores. '))
    assert.equal(content.props.frame.width,button.props.frame.width)
    assert.equal(content.props.frame.height,button.props.frame.height)
  }
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)assert.equal(overlap(box(buttons[i]),box(buttons[j])),false,family+' row hitboxes '+i+'/'+j+' do not overlap')
}
console.log('PASS four-column row targets: icon/identity/graph/quote columns remain independent in small/medium/large. Physical iOS press animation remains untested.')
