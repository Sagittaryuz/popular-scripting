const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'Popular Scripting');
function bundle(file){return buildSync({entryPoints:[path.join(root,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text}
function walk(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(walk)]:[]}
const definitions={};
const sdk={
  AppIntentManager:{register:definition=>{definitions[definition.name]=definition;return params=>({name:definition.name,params})}},
  AppIntentProtocol:{AppIntent:0},
  ControlWidget:{reloadButtons:()=>{}},
  Safari:{openURL:async()=>true},
  Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},
  Button:'Button',Canvas:'Canvas',Circle:'Circle',Image:'Image',Rectangle:'Rectangle',Text:'Text',ZStack:'ZStack'
};
const viewModule={exports:{}},createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
vm.runInNewContext(bundle('view.tsx'),{module:viewModule,exports:viewModule.exports,require:()=>sdk,createElement,Date,Storage:{get:()=>null,set:()=>true},UIImage:{fromBase64String:()=>null}});
const drawModule={exports:{}};
vm.runInNewContext(bundle('draw.js'),{module:drawModule,exports:drawModule.exports,Math,Number,Date,Intl,JSON});
const {GEOMETRY:G,layout}=drawModule.exports;
const codes=['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT'];
const rows=codes.map((code,index)=>({asset:{code},name:'Nome '+code,price:'1,00',percent:index%2?'-0,14%':'+0,82%',movement:index%2?-1:1,unit:'BRL',time:'27/10',chart:null}));
const api={displayChart:chart=>chart,lineCoordinates:()=>[],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]};
const expectedURL='scripting://run/Meu%20Painel?section=market';
function box(node){const {frame,position}=node.props;return {left:position.x-frame.width/2,right:position.x+frame.width/2,top:position.y-frame.height/2,bottom:position.y+frame.height/2}}
function overlap(a,b){return a.left<b.right-1e-8&&a.right>b.left+1e-8&&a.top<b.bottom-1e-8&&a.bottom>b.top+1e-8}
for(const [family,width,height,expected] of [['small',158,158,4],['medium',338,170,8],['large',338,360,8]]){
  const tree=viewModule.exports.PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height});
  const buttons=tree.children.filter(node=>node.type==='Button');
  assert.equal(buttons.length,expected,`${family} exposes one target per visible line`);
  assert.equal(tree.props.widgetURL,expectedURL,'External widget navigation remains available outside row buttons');
  assert(buttons.every(button=>button.props.intent.name==='RefreshAssetsOnTap'),`${family} rows use refresh-only intent`);
  assert(buttons.every(button=>button.props.accessibilityLabel.startsWith('Atualizar indicadores. ')),`${family} rows expose an action label`);
  assert(buttons.every(button=>walk(button).filter(node=>node.type==='Button').length===1),`${family} rows do not nest or overlap button targets`);
  for(let i=0;i<expected;i++){
    const button=buttons[i],rowIndex=i%4,column=Math.floor(i/4),x=column*(G.column+G.columnGap),y=rowIndex*(G.row+G.gap),hitHeight=rowIndex<3?G.row+G.gap:G.row,plan=layout(family,width,height),frame=button.props.frame,position=button.props.position;
    assert.equal(frame.width,G.column*plan.scale,`${family} row ${i} spans its full content column`);
    assert.equal(frame.height,hitHeight*plan.scaleY,`${family} row ${i} keeps its row hit height`);
    assert.equal(position.x,plan.x+(column*(G.column+G.columnGap)+G.column/2)*plan.scale,`${family} row ${i} has the expected horizontal hitbox`);
    assert.equal(position.y,plan.y+(rowIndex*(G.row+G.gap)+hitHeight/2)*plan.scaleY,`${family} row ${i} has the expected vertical hitbox`);
    const content=button.children.find(node=>node.type==='ZStack');
    assert.deepEqual(content.props.frame,frame,`${family} row ${i} content fills its hitbox`);
    const descendants=walk(content),block=descendants.find(node=>node.props?.key==='detail-block'),icon=descendants.find(node=>(node.type==='Canvas'||node.type==='Image')&&Math.abs((node.props?.frame?.width??0)-26*plan.scale)<1e-8&&Math.abs((node.props?.frame?.height??0)-26*plan.scaleY)<1e-8),graph=descendants.find(node=>node.type==='Canvas'&&Math.abs((node.props?.frame?.height??0)-G.graphHeight*plan.scaleY)<1e-8),dot=descendants.find(node=>node.type==='Circle'&&node.props?.key==='market-status-dot');
    assert(block&&icon&&graph&&dot,`${family} row ${i} keeps icon, block, graph and status dot inside the target`);
    assert.equal(dot.props.frame.width,3*plan.scale,`${family} row ${i} keeps the 3 pt status-dot width`);
    assert.equal(dot.props.frame.height,3*plan.scale,`${family} row ${i} keeps the 3 pt status-dot height`);
    assert.equal(dot.props.position.x,65.5*plan.scale,`${family} row ${i} keeps the status dot immediately before the date`);
    assert.equal(dot.props.position.y,(G.line3Top+G.bottom/2)*plan.scaleY,`${family} row ${i} centers the status dot on the date line`);
    const time=descendants.find(node=>node.type==='Text'&&Math.abs((node.props?.frame?.width??0)-48*plan.scale)<1e-8&&Math.abs((node.props?.frame?.height??0)-G.bottom*plan.scaleY)<1e-8);
    assert(time&&dot.props.position.x+dot.props.frame.width/2<time.props.position.x-time.props.frame.width/2,`${family} row ${i} keeps a gap before the date label`);
    assert.equal(icon.props.position.x,13*plan.scale,`${family} row ${i} icon stays inside the local hitbox`);
    assert.equal(icon.props.position.y,(G.iconTop+13)*plan.scaleY,`${family} row ${i} icon stays inside the local hitbox`);
    assert.equal(block.props.position.y,G.blockCenter*plan.scaleY,`${family} row ${i} preserves block centering`);
    assert(Math.abs(position.x-frame.width/2+icon.props.position.x-(plan.x+(x+13)*plan.scale))<1e-8,`${family} row ${i} preserves the prior global icon x`);
    assert(Math.abs(position.y-frame.height/2+icon.props.position.y-(plan.y+(rowIndex*(G.row+G.gap)+G.iconTop+13)*plan.scaleY))<1e-8,`${family} row ${i} preserves the prior global icon y`);
    assert(Math.abs(position.y-frame.height/2+block.props.position.y-(plan.y+(rowIndex*(G.row+G.gap)+G.blockCenter)*plan.scaleY))<1e-8,`${family} row ${i} preserves the prior global block y`);
  }
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)assert.equal(overlap(box(buttons[i]),box(buttons[j])),false,`${family} row hitboxes ${i}/${j} do not overlap`);
}
console.log('PASS row tap targets: four/eight independent full-line buttons, native plain-button feedback path, refresh-only intent, preserved widget URL, bounded hitboxes and no overlap. Physical iOS press animation remains untested.');
