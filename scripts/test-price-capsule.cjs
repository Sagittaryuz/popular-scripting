const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const dir=path.join(__dirname,'Popular Scripting');
const sdk={Button:'Button',Canvas:'Canvas',Circle:'Circle',Image:'Image',Rectangle:'Rectangle',SVG:'SVG',Text:'Text',ZStack:'ZStack',AppIntentManager:{register:d=>()=>({name:d.name})},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons(){}},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'}};
const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
function load(file){const module={exports:{}};vm.runInNewContext(buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text,{module,exports:module.exports,require:()=>sdk,createElement,Date,Storage:{get:()=>null},UIImage:{fromBase64String:()=>null}});return module.exports;}
const {PopularView}=load('view.tsx'),{GEOMETRY:G,PRICE_CAPSULE:P,movementColor}=load('draw.js');
const rows=['IBOV','DOW_JONES','USD/BRL','BRENT','SELIC','IPCA','CUB_GO','DIESEL_S10'].map((code,i)=>({asset:{code},name:code,price:['169,2K','41.123','5,58','—','-115,22','0,00','123,45','8,37'][i],percent:'+1,23%',time:'12:30',movement:[1,-1,0,null,1,-1,0,1][i],chart:{}}));
const api={displayChart:chart=>chart,lineCoordinates:()=>[{x:0,y:26},{x:32,y:0}],monthLayout:()=>({labels:[],lines:[]}),gradientStrips:()=>[]};
const top=n=>n.props.position.y-n.props.frame.height/2,bottom=n=>n.props.position.y+n.props.frame.height/2,left=n=>n.props.position.x-n.props.frame.width/2,right=n=>n.props.position.x+n.props.frame.width/2;
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label);
function draw(node){const calls=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>{o[k]=v;calls.push([k,v]);return true}});node.props.draw(ctx,node.props.frame);return {ctx,calls};}
function luminance(hex){const c=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
const measurements=[];
for(const [family,width,height] of [['small',158,158],['medium',338,170],['large',338,360],['medium',332,158],['small',138,138]]){
 const tree=PopularView({model:{family,rows,api,status:{label:'fixture'}},width,height}),buttons=tree.children.filter(n=>n.type==='Button'),widths=[];
 for(const [i,button] of buttons.entries()){
  const nodes=button.children[0].children,find=key=>nodes.find(n=>n.props?.key===key),capsule=find('price-capsule'),price=find('price'),icon=find('asset-icon')||find('asset-fallback'),chart=find('asset-chart'),percent=find('percent');
  assert(capsule&&price&&icon&&chart&&percent);widths.push(capsule.props.frame.width);
  near(capsule.props.frame.height,icon.props.frame.height/2,'capsule is half the actual icon height');
  near(top(capsule),top(icon),'capsule and icon share their top');
  near(capsule.props.frame.width,icon.props.frame.width*P.width/G.icon,'capsule uses the common fixed width');
  near(top(price),top(capsule),'price and capsule share the frame top');near(bottom(price),bottom(capsule),'price and capsule share frame bottom');
  assert(left(price)>left(capsule)&&right(price)<right(capsule),'price has internal horizontal padding');
  assert(bottom(capsule)<=top(percent)+1e-8,'percentage remains in lower half below capsule');
  assert(left(capsule)>right(chart),'capsule does not cover chart');
  assert(nodes.indexOf(capsule)<nodes.indexOf(price),'capsule is drawn behind the price');
  assert.equal(price.children.join(''),rows[i].price,'price is not reformatted or replaced to fit');
  assert.equal(price.props.frame.alignment,'center');
  const background=draw(capsule),curve=draw(chart),color=movementColor(rows[i]);
  assert.equal(background.ctx.fillStyle,color,'capsule has full chart color');assert.equal(curve.ctx.strokeStyle,color,'curve uses same color');
  assert(!background.calls.some(c=>['ellipse','arc','arcTo'].includes(c[0])),'no native-incompatible arc primitives');
  const perimeter=background.calls.filter(c=>c[0]==='moveTo'||c[0]==='lineTo').map(c=>c.slice(1));
  assert.equal(perimeter.length,51,'continuous closed perimeter with two explicit semicircles');
  for(const [x,y] of perimeter){assert(x>=-1e-8&&x<=capsule.props.frame.width+1e-8);assert(y>=-1e-8&&y<=capsule.props.frame.height+1e-8);}
  const a=luminance(color.slice(1)),b=luminance(price.props.foregroundStyle.slice(1));assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'text contrast passes 4.5:1 for all movement colors');
 }
 assert(widths.every(w=>w===widths[0]),'all assets use equal capsule widths');measurements.push({family,width,height,rows:buttons.length,capsuleWidth:widths[0]});
}
assert.equal(P.height,13);assert.equal(P.width,36);assert.equal(P.top,G.iconTop);
console.log('PASS price capsules: half icon height, common top/width, chart colors, round ends, centered inset text, contrast, no chart/variation overlap, positive/negative/neutral/missing and 5 sizes.',measurements);

// Rasterize the shipped function through a deliberately line-only context.
// Native arc semantics cannot affect this path. Test the interior and symmetry,
// not just the existence of draw calls (which missed the .53 iPhone defect).
const {createCanvas}=require('@napi-rs/canvas');
const {drawPriceCapsule}=load('draw.js');
for(const scale of [1,2,3,4]){
 const w=P.width*scale,h=P.height*scale,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 const lineOnly={beginPath:()=>ctx.beginPath(),moveTo:(...a)=>ctx.moveTo(...a),lineTo:(...a)=>ctx.lineTo(...a),closePath:()=>ctx.closePath(),fill:()=>ctx.fill(),set fillStyle(v){ctx.fillStyle=v}};
 drawPriceCapsule(lineOnly,{width:w,height:h},'#00E676');
 const data=ctx.getImageData(0,0,w,h).data,alpha=(x,y)=>data[(y*w+x)*4+3];
 for(let y=1;y<h-1;y++)for(let x=Math.ceil(h/2);x<w-Math.ceil(h/2);x++)assert.equal(alpha(x,y),255,'central rectangle solid, no diagonal cutout');
 assert(alpha(0,0)<20&&alpha(w-1,0)<20,'rounded corners stay transparent');
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)assert(Math.abs(alpha(x,y)-alpha(w-1-x,y))<40,'left/right antialias tolerance');
}
console.log('PASS line-only capsule raster: solid center, rounded corners and symmetry at 1x–4x.');
