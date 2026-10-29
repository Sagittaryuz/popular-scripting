const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const root=path.join(__dirname,'Popular Scripting'),entry=path.join(root,'original-engine.js'),code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});
const files=new Map(),fm={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>files.has(file),createDirectory:()=>{},readString:file=>files.get(file),writeString:(file,value)=>files.set(file,value)};
const now=Date.parse('2026-10-29T12:00:00Z'),api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:class{},Data:{},Timer:undefined},{family:'medium',now});
const timed={window:'90D',points:[
  {value:99,stamp:{day:'2026-10-28',label:'11:00',hasTime:true,time:now-25*60*60*1000}},
  {value:100,stamp:{day:'2026-10-28',label:'13:00',hasTime:true,time:now-23*60*60*1000}},
  {value:102,stamp:{day:'2026-10-29',label:'11:00',hasTime:true,time:now-60*60*1000}}
]};
const visible=api.displayChart(timed,now);
assert.equal(timed.points.length,3,'rendering does not mutate the source history');
assert.equal(visible.displayWindow.hours,24);
assert.equal(visible.displayWindow.endTime,now);
assert.equal(visible.displayWindow.startTime,now-24*60*60*1000);
assert.deepEqual(visible.points.map(point=>point.value),[100,102],'only real timestamped points inside 24h are drawn');
assert.equal(visible.displayStatus,'available-24h');
const coords=api.lineCoordinates(timed,64,15);
assert.equal(coords.length,2);
assert(coords.every(point=>point.x>=.75&&point.x<=63.25&&point.y>=.75&&point.y<=14.25));
const sparse={window:'monthly',points:[
  {value:2793.02,stamp:{day:'2026-07-01',hasTime:false,time:Date.parse('2026-07-01T00:00:00Z')}},
  {value:2794.68,stamp:{day:'2026-08-01',hasTime:false,time:Date.parse('2026-08-01T00:00:00Z')}},
  {value:2795.37,stamp:{day:'2026-09-01',hasTime:false,time:Date.parse('2026-09-01T00:00:00Z')}}
]};
const unavailable=api.displayChart(sparse,now);
assert.equal(unavailable.points.length,0,'monthly observations are not relabeled as intraday');
assert.equal(unavailable.displayStatus,'unavailable-24h');
assert.equal(api.lineCoordinates(sparse,64,15).length,0,'sparse data does not become a fabricated curve');
assert.equal(api.monthLayout(sparse,64).labels.length,0,'24h rendering has no month-band labels');
const strips=api.gradientStrips(coords,15,.5);
assert(strips.length>0&&Math.max(...strips.map(strip=>strip.alpha))>.30,'expanded graph fill is visibly stronger than the old .24 maximum');
const source=fs.readFileSync(entry,'utf8');
assert.match(source,/const CHART_DISPLAY_HOURS = 24/);
assert.match(source,/economia\.awesomeapi\.com\.br\/USD-BRL\/100/);
console.log('PASS 24h window: real timestamps only, 25h point excluded, monthly/CUB sparse fallback explicit, no interpolation/zero fill, stronger fill verified.');
