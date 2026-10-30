const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const entry=path.join(__dirname,'Popular Scripting','original-engine.js');
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const bundled={exports:{}};
vm.runInNewContext(code,{module:bundled,exports:bundled.exports,console,Date,URL,Intl,Math,JSON,Set,Map});
const now=Date.parse('2026-10-30T01:00:00Z'),api=bundled.exports.createEngine({FileManager:{local:()=>({documentsDirectory:()=>'/documents',joinPath:(...parts)=>parts.join('/'),fileExists:()=>false,createDirectory:()=>{},readString:()=>null,writeString:()=>{}})},Request:class{},Data:{},Timer:undefined},{family:'medium',now});
const point=(stamp,value)=>({value,stamp});
const t=(iso,label=iso.slice(11,16))=>({day:iso.slice(0,10),time:Date.parse(iso),hasTime:true,label});
const xValues=chart=>api.lineCoordinates(chart,46,20).map(point=>point.x);
const firstLast=coordinates=>[coordinates[0],coordinates.at(-1)];

const sparseDaily={window:'7D',points:[
  point(t('2026-10-24T12:00:00Z'),100),
  point(t('2026-10-27T12:00:00Z'),101),
  point(t('2026-10-29T20:00:00Z'),103)
]};
const sparseDailyBefore=[...sparseDaily.points];
const dailyVisible=api.displayChart(sparseDaily,now),dailyCoordinates=api.lineCoordinates(sparseDaily,46,20);
assert.equal(dailyVisible.points.length,3,'all real observations inside seven days remain eligible');
assert.deepEqual(firstLast(dailyCoordinates).map(point=>point.x),[.75,45.25],'sparse daily series reaches both useful horizontal limits');
assert.equal(sparseDaily.points[0].stamp.time,sparseDailyBefore[0].stamp.time,'normalization does not mutate source timestamps');
assert.deepEqual(dailyCoordinates.map(point=>point.x),[.75,25.78125,45.25],'intermediate daily spacing preserves elapsed-time ratio');

const eod={window:'7D',timeBasis:'eod-civil-day',sourceStartDay:'2026-10-23',sourceEndDay:'2026-10-29',points:[
  point({day:'2026-10-24',time:Date.parse('2026-10-24T12:00:00Z'),hasTime:false,label:'24/10'},100),
  point({day:'2026-10-27',time:Date.parse('2026-10-27T12:00:00Z'),hasTime:false,label:'27/10'},102),
  point({day:'2026-10-29',time:Date.parse('2026-10-29T12:00:00Z'),hasTime:false,label:'29/10'},101)
]};
assert.deepEqual(firstLast(api.lineCoordinates(eod,46,20)).map(point=>point.x),[.75,45.25],'EOD series also fills the useful span without weekend fill');
assert.equal(api.displayChart(eod,now).points.length,3,'EOD filtering keeps only supplied civil-date observations');

const onePoint={window:'7D',points:[point(t('2026-10-29T20:00:00Z'),100)]};
assert.equal(xValues(onePoint).length,0,'one real point is not stretched into a fabricated curve');
const nullPoint={window:'7D',points:[point(t('2026-10-24T12:00:00Z'),100),point(t('2026-10-27T12:00:00Z'),null),point(t('2026-10-29T20:00:00Z'),103)]};
assert.equal(xValues(nullPoint).length,0,'a null observation does not create a false segment or point');

const outsideWindow={window:'7D',points:[point(t('2026-10-20T12:00:00Z'),98),...sparseDaily.points]};
const outsideVisible=api.displayChart(outsideWindow,now);
assert.equal(outsideVisible.points.length,3,'older observations remain excluded by the existing seven-day filter');
assert.deepEqual(firstLast(api.lineCoordinates(outsideWindow,46,20)).map(point=>point.x),[.75,45.25],'filtering before normalization prevents an old point from changing the domain');

console.log(JSON.stringify({version:'0.2.38',domain:'visible-series-first-last',width:46,edgeX:[.75,45.25],dailyIntermediateX:dailyCoordinates[1].x,onePoint:'no curve',nullPoint:'no curve',weekendFill:false,nativeIPhone:false}));
