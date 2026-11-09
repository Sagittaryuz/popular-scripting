// Executes the actual Scripting model, host, JSX view and Canvas callbacks.
// Linux Skia and fitted native-Text approximations are NOT iPhone evidence.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','DejaVu Sans');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'scripts/Popular Scripting'),version=JSON.parse(fs.readFileSync(path.join(dir,'script.json'),'utf8')).version;
function bundle(file){return buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'node',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text}
function walk(n){return n&&typeof n==='object'?[n,...(n.children||[]).flatMap(walk)]:[]}
const sdk={AppIntentManager:{register:d=>()=>({name:d.name})},AppIntentProtocol:{AppIntent:0},ControlWidget:{reloadButtons:()=>{}},Safari:{openURL:async()=>true},Script:{createRunURLScheme:()=> 'scripting://run/Meu%20Painel?section=market'},Button:'Button',Canvas:'Canvas',Circle:'Circle',Image:'Image',Rectangle:'Rectangle',Text:'Text',ZStack:'ZStack'};
const symbols=['^BVSP','^DJI','BRL=X','BZ=F'],names=['ibov','dji','usdbrl','brent'];
async function capture(target){fs.mkdirSync(target,{recursive:true});const report=[];await Promise.all(symbols.map(async(symbol,i)=>{const started=Date.now(),response=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?range=5d&interval=5m',{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200);const text=await response.text();JSON.parse(text);fs.writeFileSync(path.join(target,names[i]+'.json'),text);report.push({symbol,status:response.status,elapsedMs:Date.now()-started,checkedAt:new Date().toISOString()});}));fs.writeFileSync(path.join(target,'transport.json'),JSON.stringify(report,null,2));}
async function run(){
 const captureDir=process.argv[2]||path.join(root,'validation/live-capture');if(process.argv.includes('--capture'))await capture(captureDir);
 const fixtures=Object.fromEntries(symbols.map((symbol,i)=>[symbol,JSON.parse(fs.readFileSync(path.join(captureDir,names[i]+'.json')))]));
 const now=Date.now(),values=new Map(),requests=[],Storage={get:k=>values.get(k),set:(k,v)=>{values.set(k,v);return true},contains:k=>values.has(k)};
 const globals={Date,URL,Intl,Map,Set,JSON,Math,Number,Array,console:{log(){}},setTimeout,clearTimeout,Storage,Keychain:{contains:()=>false,get:()=>null},Data:{},require:()=>sdk,fetch:async(url,options)=>{requests.push({url,headers:options.headers,timeout:options.timeout});const symbol=decodeURIComponent(new URL(url).pathname.split('/').at(-1));assert(fixtures[symbol]);return{status:200,ok:true,text:async()=>JSON.stringify(fixtures[symbol]),headers:{get:()=> 'application/json'}}}};
 const m={exports:{}};vm.runInNewContext(bundle('model.ts'),{...globals,module:m,exports:m.exports});
 const model=await m.exports.loadModel('medium',true);assert.equal(model.version,version);assert.equal(model.rows.length,4);assert(model.rows.every(r=>r.asset.price>0&&r.chartCoverage.complete));assert.equal(requests.length,4);assert(model.rows.every(r=>r.asset.source==='Yahoo Finance'));
 const imageMap=new Map(),imageJobs=[],createElement=(type,props,...children)=>typeof type==='function'?type({...props,children:children.flat(Infinity).filter(Boolean)}):({type,props:props||{},children:children.flat(Infinity).filter(Boolean)});
 const v={exports:{}};vm.runInNewContext(bundle('view.tsx'),{...globals,module:v,exports:v.exports,createElement,UIImage:{fromBase64String:s=>{if(!imageMap.has(s)){const item={};imageMap.set(s,item);imageJobs.push(loadImage(Buffer.from(s,'base64')).then(image=>item.image=image));}return imageMap.get(s)}}});
 assert.equal(v.exports.tradingRangeLabel({basis:'observed-trading-time',startTime:null,endTime:null,coveredMs:0}),'','empty history never creates an epoch date label');
 const rendered={};fs.mkdirSync(path.join(root,'validation'),{recursive:true});
 for(const [family,width,height] of [['small',158,158],['medium',338,170],['large',338,360]]){
  const tree=v.exports.PopularView({model:{...model,family},width,height});await Promise.all(imageJobs);
  const nodes=walk(tree),charts=nodes.filter(n=>n.type==='Canvas'&&n.props.key==='asset-chart'),labels=nodes.filter(n=>n.type==='Text'&&n.props.key==='trading-range');assert.equal(charts.length,4);assert.equal(labels.length,4);assert(!nodes.some(n=>n.props?.key==='missing'));assert(nodes.some(n=>n.children?.includes('Brent futuro')));
  const scale=4,canvas=createCanvas(width*scale,height*scale),g=canvas.getContext('2d');g.scale(scale,scale);g.fillStyle='#1e1e1e';g.fillRect(0,0,width,height);const texts=[];
  function paint(n,ox=0,oy=0,pw=width,ph=height){
   if(!n||typeof n!=='object')return;const p=n.props||{},w=p.frame?.width??pw,h=p.frame?.height??ph,x=ox+(p.position?p.position.x-w/2:0),y=oy+(p.position?p.position.y-h/2:0);
   g.save();if(p.clipped){g.beginPath();g.rect(x,y,w,h);g.clip();}
   if(n.type==='Image'&&p.image?.image)g.drawImage(p.image.image,x,y,w,h);
   if(n.type==='Rectangle'){g.fillStyle=p.fill||'#fff';g.fillRect(x,y,w,h);}
   if(n.type==='Canvas'){g.translate(x,y);g.beginPath();g.rect(0,0,w,h);g.clip();p.draw(g,{width:w,height:h});}
   if(n.type==='Text'){
    let text=n.children.join(''),font=typeof p.font==='number'?p.font:8;const min=font*(p.minScaleFactor??1),weight=p.fontWeight==='semibold'?'600':'400',set=()=>g.font=weight+' '+font+'px "DejaVu Sans"';set();font=Math.max(min,Math.min(font,font*w*.98/Math.max(.1,g.measureText(text).width),h*.85));set();
    if(g.measureText(text).width>w+.05){while(text.length&&g.measureText(text+'…').width>w)text=text.slice(0,-1);text+='…';}
    g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle=p.foregroundStyle||'#fff';g.textBaseline='middle';const tw=g.measureText(text).width,tx=p.frame?.alignment==='trailing'?x+w-tw:p.frame?.alignment==='leading'?x:x+(w-tw)/2;g.fillText(text,tx,y+h/2);texts.push({key:p.key,text,font,x,y,w,h});
   }
   if(!['Text','Canvas','Image','Rectangle'].includes(n.type))for(const child of n.children||[])paint(child,x,y,w,h);
   g.restore();
  }
  paint(tree);const output=path.join(root,`validation/market-profile-${version}-${family}.png`);fs.writeFileSync(output,canvas.toBuffer('image/png'));rendered[family]={output:path.relative(root,output),rows:4,curves:charts.length,texts};
 }
 fs.copyFileSync(path.join(root,`validation/market-profile-${version}-medium.png`),path.join(root,`validation/market-profile-${version}-preview.png`));
 const report={version,sourceVersion:model.sourceVersion,nativeIPhone:false,simulation:'Actual Scripting model + host + JSX/Canvas, Linux Skia; native Text approximation',data:{live:false,capturedResponses:true,source:'Replay of real responses from the capture directory; not native iPhone evidence',capturedAt:fs.existsSync(path.join(captureDir,'transport.json'))?JSON.parse(fs.readFileSync(path.join(captureDir,'transport.json'))).map(r=>({symbol:r.symbol,status:r.status,receivedAt:r.receivedAt||r.checkedAt})):[],captureDirectory:path.basename(captureDir),renderedAt:new Date(now).toISOString(),window:'24 hours observed trading intervals, no gap interpolation'},order:model.rows.map(r=>r.asset.code),rows:model.rows.map(r=>({code:r.asset.code,name:r.name,price:r.price,rawPrice:r.asset.price,percent:r.percent,time:r.time,instrument:r.asset.instrument,source:r.asset.source,quoteTime:new Date(r.stamp.time).toISOString(),coverage:r.chartCoverage,points:r.chart.points.length})),families:rendered,requests:requests.map(r=>({url:r.url,timeout:r.timeout,authenticated:Object.keys(r.headers).some(k=>k.toLowerCase()==='authorization')}))};
 fs.writeFileSync(path.join(root,`validation/market-profile-${version}-preview.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version,rows:report.rows,nativeIPhone:false,families:Object.keys(rendered)},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1});
