const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {bundle}=require('./test-trading-host.cjs');
const root=path.resolve(__dirname,'..'),previewDir=path.join(root,'validation');
const evidence=JSON.parse(fs.readFileSync(path.join(previewDir,'market-profile-0.2.56-preview.json'),'utf8'));
const order=['IBOV','DOW_JONES','USD/BRL','BRENT'],symbols=['^BVSP','^DJI','BRL=X','BZ=F'];
assert.equal(evidence.version,'0.2.56');assert.equal(evidence.sourceVersion,'2026.11.11.101');
assert.equal(evidence.nativeIPhone,false);assert.match(evidence.simulation,/actual scripting model \+ host \+ JSX\/Canvas/i);
assert.equal(evidence.data.capturedResponses,true);assert.deepEqual(evidence.order,order);
assert.equal(evidence.rows.length,4);
for(const [i,row] of evidence.rows.entries()){
  assert.equal(row.code,order[i]);assert.equal(row.instrument,symbols[i]);assert.equal(row.source,'Yahoo Finance');
  assert(Number.isFinite(row.rawPrice)&&row.rawPrice>0);assert.match(row.price,/\d/);assert(!row.price.includes('…'));
  assert(row.points>=2);assert.equal(row.coverage.basis,'observed-trading-time');assert.equal(row.coverage.complete,true);
  assert.equal(row.coverage.targetMs,86400000);assert(row.coverage.coveredMs>=86400000&&row.coverage.coveredMs<86700000);
  assert.equal(row.coverage.intervalMs,300000);assert(row.coverage.startTime<row.coverage.endTime);
  assert(Number.isFinite(Date.parse(row.quoteTime)));assert.equal(row.coverage.timeZone,'America/Sao_Paulo');
}
assert.equal(evidence.rows[3].name,'Brent futuro');
function verifyPNG(file){
  const png=fs.readFileSync(file);assert(png.length>1000);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let width,height,bpp;const chunks=[];
  for(let offset=8;offset<png.length;){const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8),data=png.subarray(offset+8,offset+8+size);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert([2,6].includes(data[9]));bpp=data[9]===6?4:3;assert.equal(data[12],0);}if(type==='IDAT')chunks.push(data);offset+=12+size;}
  assert(width>=158&&height>=158);const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*bpp,colors=new Set();assert.equal(raw.length,(stride+1)*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
  let prior=Buffer.alloc(stride),offset=0;
  for(let y=0;y<height;y++){const filter=raw[offset++],row=Buffer.alloc(stride);assert(filter<=4);for(let x=0;x<stride;x++){const a=x>=bpp?row[x-bpp]:0,b=prior[x],c=x>=bpp?prior[x-bpp]:0;row[x]=(raw[offset++]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}for(let x=0;x<stride;x+=bpp)if(bpp===3||row[x+3])colors.add(row.subarray(x,x+3).toString('hex'));prior=row;}
  assert(colors.size>30,'raster contains actual varied visible pixels, not an empty canvas');
}
const date=time=>new Date(time).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit'});
for(const family of ['small','medium','large','preview']){
  const result=evidence.families[family];assert.equal(result.rows,4);assert.equal(result.curves,4);
  assert.equal(result.texts.filter(t=>t.key==='name-text').length,4);
  assert(result.texts.filter(t=>t.key==='name-text').every(t=>t.requestedFont>8&&t.h>10),'enlarged names use capsule-height band');
  assert.deepEqual(result.texts.filter(t=>t.key==='price').map(t=>t.text),evidence.rows.map(r=>r.price),'all four fitted prices remain complete in '+family);
  assert.deepEqual(result.texts.filter(t=>t.key==='trading-range').map(t=>t.text),[]);
  assert(!result.texts.some(t=>t.key==='market-status-dot'||/indisponível|Jan-27/.test(t.text)));
  const names=result.texts.filter(t=>t.key==='name-text'),prices=result.texts.filter(t=>t.key==='price'),metas=result.texts.filter(t=>t.key==='asset-meta'),percents=result.texts.filter(t=>t.key==='percent');
  assert(names.every(t=>t.weight==='700'&&t.font>5.5),'names are larger and bold');
  assert(prices.every(t=>t.weight==='700'),'prices are bold');
  assert(metas.every((t,i)=>t.weight==='400'&&percents[i].weight==='400'&&Math.abs(t.requestedFont-percents[i].requestedFont)<.02),'code and variation use same nominal font, proportionally fitted');
  assert(result.texts.filter(t=>!['name-text','asset-meta','percent'].includes(t.key)).every(t=>!t.text.includes('…')),'all data and date labels are intact');
  const icons=result.geometry.filter(g=>g.key==='asset-icon'),charts=result.geometry.filter(g=>g.key==='asset-chart'),capsules=result.geometry.filter(g=>g.key==='price-capsule');
  assert.equal(capsules.length,4);assert(capsules.every(c=>c.frame.width===capsules[0].frame.width));
  icons.forEach((icon,i)=>{const c=capsules[i];assert(Math.abs(c.frame.height*2-icon.frame.height)<1e-8);assert(Math.abs((c.position.y-c.frame.height/2)-(icon.position.y-icon.frame.height/2))<1e-8);});
  assert.equal(icons.length,4);assert.equal(charts.length,4);
  icons.forEach((icon,i)=>{assert(Math.abs(icon.frame.width-icon.frame.height)<1e-8);assert(Math.abs(icon.frame.height-charts[i].frame.height)<1e-8);assert(Math.abs(icon.position.y-charts[i].position.y)<1e-8);});
  verifyPNG(path.join(root,result.output));
}
verifyPNG(path.join(previewDir,'market-profile-0.2.56-preview.png'));
assert(symbols.every(symbol=>evidence.requests.some(r=>decodeURIComponent(new URL(r.url).pathname).endsWith('/'+symbol))));
assert(evidence.requests.every(r=>!r.authenticated));
// Exercise the shipped Canvas implementation, not just a textual source match.
const draw=bundle('draw.js'),points=[{x:0,y:5},{x:1,y:6},{x:3,y:8,breakBefore:true},{x:4,y:7}],segments=[];
const plan=draw.curvePlan({displayChart:()=>({displayWindow:{basis:'observed-trading-time'}}),lineCoordinates:()=>points,monthLayout:()=>({lines:[],labels:[]}),gradientStrips:p=>{segments.push(p);return [{polygon:[...p,{x:p.at(-1).x,y:20},{x:p[0].x,y:20}],alpha:.2}]}},{chart:{}},46);
assert(plan.strips.length===16);assert(plan.strips.every(s=>s.polygon.every(p=>p.x<=1)||s.polygon.every(p=>p.x>=3)),'fill is split at every gap');
const commands=[],ctx={beginPath:()=>commands.push('begin'),moveTo:(x,y)=>commands.push(['move',x,y]),lineTo:(x,y)=>commands.push(['line',x,y]),closePath:()=>{},fill:()=>{},stroke:()=>{}};
draw.drawCurve(ctx,{width:46,height:draw.GEOMETRY.graphHeight},plan,'#00E676');
const line=commands.slice(commands.lastIndexOf('begin')+1);assert.deepEqual(line,[['move',0,5],['line',1,6],['move',3,8],['line',4,7]],'stroke starts a new path at each gap');
const empty=draw.curvePlan({displayChart:()=>({window:'trading-24h',displayWindow:{basis:'observed-trading-time',startTime:null,endTime:null},displayStatus:'unavailable-trading-24h'}),lineCoordinates:()=>[],monthLayout:()=>({lines:[],labels:[]}),gradientStrips:()=>[]},{chart:{}});assert.equal(empty.status,'unavailable-24h','empty trading history never becomes a 7d fallback');
console.log('PASS .54 Skia evidence: four prices/curves, real instruments, complete fitted labels and effective dates in three families, decoded nonempty pixels, Canvas line/fill gaps, explicitly not native iPhone evidence.');
