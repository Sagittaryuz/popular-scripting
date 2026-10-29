const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const root=path.join(__dirname,'Popular Scripting'),entry=path.join(root,'original-engine.js'),code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});
const files=new Map(),fm={documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:file=>files.has(file),createDirectory:()=>{},readString:file=>files.get(file),writeString:(file,value)=>files.set(file,value)};
const now=Date.parse('2026-10-29T12:00:00Z'),api=bundled.exports.createEngine({FileManager:{local:()=>fm},Request:class{},Data:{},Timer:undefined},{family:'medium',now});
const timed={window:'7D',points:[
  {value:98,stamp:{day:'2026-10-21',label:'12:00',hasTime:true,time:now-8*86400000}},
  {value:99,stamp:{day:'2026-10-22',label:'13:00',hasTime:true,time:now-7*86400000+1}},
  {value:100,stamp:{day:'2026-10-25',label:'13:00',hasTime:true,time:now-4*86400000}},
  {value:102,stamp:{day:'2026-10-29',label:'11:00',hasTime:true,time:now-60*60*1000}}
]};
const visible=api.displayChart(timed,now);
assert.equal(timed.points.length,4,'rendering does not mutate the source history');
assert.equal(visible.displayWindow.hours,168);
assert.equal(visible.displayWindow.endTime,now);
assert.equal(visible.displayWindow.startTime,now-7*86400000);
assert.deepEqual(visible.points.map(point=>point.value),[99,100,102],'only real timestamped points inside seven days are drawn');
assert.equal(visible.displayStatus,'available-7d');
const coords=api.lineCoordinates(timed,64,20);
assert.equal(coords.length,3);
assert(coords.every(point=>point.x>=.75&&point.x<=63.25&&point.y>=.75&&point.y<=19.25));
const sparse={window:'monthly',points:[
  {value:2793.02,stamp:{day:'2026-07-01',hasTime:false,time:Date.parse('2026-07-01T00:00:00Z')}},
  {value:2794.68,stamp:{day:'2026-08-01',hasTime:false,time:Date.parse('2026-08-01T00:00:00Z')}},
  {value:2795.37,stamp:{day:'2026-09-01',hasTime:false,time:Date.parse('2026-09-01T00:00:00Z')}}
]};
const unavailable=api.displayChart(sparse,now);
assert.equal(unavailable.points.length,0,'monthly observations are not relabeled as weekly intraday');
assert.equal(unavailable.displayStatus,'unavailable-7d');
assert.equal(api.lineCoordinates(sparse,64,20).length,0,'sparse data does not become a fabricated curve');
assert.equal(api.monthLayout(sparse,64).labels.length,0,'seven-day rendering has no month-band labels');
const source=fs.readFileSync(entry,'utf8');
assert.match(source,/const CHART_DISPLAY_HOURS = 7\*24/);
assert.match(source,/chartHeight: 20/);
assert.match(source,/economia\.awesomeapi\.com\.br\/USD-BRL\/100/);
console.log('PASS 7D window: seven calendar days, real timestamps only, boundary included, older point excluded, monthly fallback explicit, no interpolation/zero fill.');
