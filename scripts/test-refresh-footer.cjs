const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const {buildSync}=require('esbuild');
const dir=path.resolve(__dirname,'Popular Scripting'),m={exports:{}};
const sdk=new Proxy({},{get:(_,name)=>name});
const code=buildSync({entryPoints:[path.join(dir,'refresh-footer.tsx')],bundle:true,write:false,platform:'node',format:'cjs',external:['scripting'],jsxFactory:'createElement'}).outputFiles[0].text;
vm.runInNewContext(code,{module:m,exports:m.exports,require:()=>sdk,Date,createElement:(type,props,...children)=>({type,props,children})});
const {footerLayout,footerLabel,drawRefreshTrapezoid,RefreshFooter}=m.exports;
assert.equal(footerLabel(new Date(2026,9,24,9,5).getTime()),'09:05h | 24/10');
assert.equal(footerLabel(new Date(2027,0,1,0,0).getTime()),'00:00h | 01/01');
assert.equal(footerLabel('invalid'),'--:--h | --/--');
if(process.env.TZ==='America/Sao_Paulo')assert.equal(footerLabel('2026-10-24T12:05:00Z'),'09:05h | 24/10','UTC snapshot displayed in the local Brazil timezone');
for(const [width,height] of [[158,158],[158,170],[338,170],[338,360]]){
 const box=footerLayout(width,height);assert.equal(box.height,13,'Half of the former 26-point silhouette');assert.equal(box.x,width/2);assert.equal(box.y+box.height/2,height-4);assert(box.width<=width-28);
 const tree=RefreshFooter({width,height,at:new Date(2026,9,24,9,5).getTime(),intent:'fixture',label:'Atualizar'});
 assert.equal(tree.type,'Button');assert.equal(tree.props.intent,'fixture');assert(tree.props.accessibilityLabel.includes('09:05h | 24/10'));
 const curves=[],colors=[],rectangles=[];let clipped=false,saves=0;
 const ctx={save(){saves++},restore(){saves--},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo:(...p)=>curves.push(p),closePath(){},clip(){clipped=true},fillRect:(...p)=>{assert(clipped);rectangles.push(p);colors.push(ctx.fillStyle)}};
 drawRefreshTrapezoid(ctx,{width:box.width,height:box.height});
 assert.equal(curves.length,4,'All four corners softened');assert(curves.flat().every(Number.isFinite));assert.equal(saves,0);
 assert.equal(rectangles.length,26);assert.equal(colors[0],'rgb(155,43,55)');assert.equal(colors.at(-1),'rgb(82,23,32)');assert(new Set(colors).size>20,'Visible smooth gradient');

 const text=tree.children[0].children[1].children[0];assert.equal(text.props.foregroundStyle,'#D1D1D6');
}
console.log('PASS footer: local timestamp, invalid date, half-height curved trapezoid, clipped red gradient, light gray label, centered bottom button and four widget sizes. Native rendering pending.');
