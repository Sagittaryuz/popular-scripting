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
for(const [width,height] of [[158,158],[158,170],[338,170],[338,360]]){
 const box=footerLayout(width,height);assert.equal(box.x,width/2);assert.equal(box.y+box.height/2,height-4);assert(box.width<=width-28);
 const tree=RefreshFooter({width,height,at:new Date(2026,9,24,9,5).getTime(),intent:'fixture',label:'Atualizar'});
 assert.equal(tree.type,'Button');assert.equal(tree.props.intent,'fixture');assert(tree.props.accessibilityLabel.includes('09:05h | 24/10'));
 const ops=[],ctx={beginPath(){},moveTo:(...p)=>ops.push(p),lineTo:(...p)=>ops.push(p),closePath(){},fill(){}};
 drawRefreshTrapezoid(ctx,{width:box.width,height:box.height});
 assert.equal(ctx.fillStyle,'#B3262E');assert.equal(ops.length,4);assert(ops[0][0]>0&&ops[1][0]<box.width,'Trapezoid narrows toward the top');assert.equal(ops[2][0],box.width);assert.equal(ops[3][0],0);
 const text=tree.children[0].children[1].children[0];assert.equal(text.props.foregroundStyle,'#D1D1D6');
}
console.log('PASS footer: local timestamp, invalid date, red trapezoid, light gray label, centered bottom button and four widget sizes. Native rendering pending.');
