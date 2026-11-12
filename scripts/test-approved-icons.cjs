const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const dir=path.join(__dirname,'Popular Scripting'),sdk={Button:'Button',Canvas:'Canvas',Circle:'Circle',Image:'Image',Rectangle:'Rectangle',SVG:'SVG',Text:'Text',ZStack:'ZStack',Script:{createRunURLScheme:()=>''},AppIntentManager:{register:()=>()=>({})},AppIntentProtocol:{AppIntent:0},ControlWidget:{},Safari:{}};
const createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
function load(file){const module={exports:{}};vm.runInNewContext(buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text,{module,exports:module.exports,require:()=>sdk,createElement,Date,Storage:{get:()=>null},UIImage:{fromBase64String:base64=>({base64})}});return module.exports;}
const {approvedIcons}=load('approved-icons.js'),{PopularView}=load('view.tsx'),codes=['IBOV','DOW_JONES','USD/BRL','BRENT'];
const walk=n=>n&&typeof n==='object'?[n,...n.children.flatMap(walk)]:[];
(async()=>{
assert.deepEqual(Object.keys(approvedIcons).sort(),[...codes].sort());
for(const code of codes){const image=await loadImage(Buffer.from(approvedIcons[code],'base64'));assert.equal(image.width,156);assert.equal(image.height,156);const c=createCanvas(156,156),g=c.getContext('2d');g.drawImage(image,0,0);assert.equal(g.getImageData(0,0,1,1).data[3],0);assert(g.getImageData(78,78,1,1).data[3]>240);}
const rows=codes.map(code=>({asset:{code,iconSVGCode:'<svg xmlns="http://www.w3.org/2000/svg"><circle r="13"/></svg>',iconData:'x'.repeat(100)},name:code,price:'1',percent:'1%',time:'12:00',movement:1,chart:null}));
for(const [family,width,height] of [['small',158,158],['medium',338,170],['large',338,360]]){
const tree=PopularView({model:{family,rows,api:{displayChart:()=>null,lineCoordinates:()=>[],monthLayout:()=>({lines:[],labels:[]})},status:{label:''}},width,height}),nodes=walk(tree),icons=nodes.filter(n=>n.props.key==='asset-image');
assert.equal(icons.length,4);assert(!nodes.some(n=>String(n.props.key||'').startsWith('asset-remote')));
icons.forEach((n,i)=>{assert.equal(n.props.image.base64,approvedIcons[codes[i]]);assert.equal(n.props.frame.width,n.props.frame.height);assert(n.props.frame.width<=26);});
}
console.log('PASS four approved transparent 156px images, 26pt isotropic slot and priority over remote artwork');
})().catch(e=>{console.error(e);process.exit(1)});
