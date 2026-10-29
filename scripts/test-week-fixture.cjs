const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),renderer=path.join(__dirname,'render-widget-preview.cjs'),preview=path.join(root,'validation/widget-preview-0.2.30-local.svg');
const source=fs.readFileSync(renderer,'utf8'),svg=fs.readFileSync(preview,'utf8');
const codes=['BBAS3','BBDC4','IBOV','BTC/USD'],names=['Banco do Brasil','Bradesco PN','Ibovespa','Bitcoin'];
let previous=-1;
for(const code of codes){
  const index=source.indexOf("code: '"+code+"'");
  assert(index>previous,code+' fixture order');
  previous=index;
  assert.equal(svg.split(code).length-1,2,code+' appears once per widget, never duplicated in the wide fixture');
}
for(const name of names)assert.equal((svg.match(new RegExp(name,'g'))||[]).length,2,name+' appears once per widget');
assert.match(source,/'7d indisponível'/);
assert.match(source,/curves: \[\]/);
assert.match(source,/window: \{ label: '7D', hours: 168, calendarDays: 7 \}/);
assert(!/price: '\\d/.test(source),'fixture must not embed a price');
assert(!/available: true/.test(source),'fixture must not embed a synthetic curve');
assert(!svg.includes('24h indisponível'));
assert(svg.includes('7d indisponível'));
console.log('PASS local fixture: BBAS3, BBDC4, IBOV, BTC/USD in order; four unique rows in small/wide; no price or curve fixture; 7D fallback visible.');
