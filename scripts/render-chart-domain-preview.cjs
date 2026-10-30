const fs=require('node:fs'),path=require('node:path');

// Deterministic visual evidence for the chart-domain fix. This uses timestamp
// fixtures only; it mirrors the published row geometry but is not Scripting's
// native renderer and never fetches live quotes.
const root=path.resolve(__dirname,'..'),version='0.2.38',output=path.join(root,`validation/chart-domain-${version}-comparison.svg`),jsonOutput=path.join(root,`validation/chart-domain-${version}-comparison.json`);
const ROW=36,ROW_STEP=ROW+2/3,COLUMN=146,COLUMN_GAP=12,COL2_X=30,COL3_X=70,GRAPH_WIDTH=46,GRAPH_TOP=8,GRAPH_HEIGHT=20,SMALL={width:158,height:158},MEDIUM={width:338,height:170};
const now=Date.parse('2026-10-30T01:00:00Z'),windowStart=now-7*24*60*60*1000;
const rows=[
  {name:'Banco do Brasil',code:'BBAS3',times:['2026-10-27T12:00:00Z','2026-10-28T12:00:00Z','2026-10-29T20:00:00Z'],values:[100,101,103],color:'#00E676'},
  {name:'Bradesco PN',code:'BBDC4',times:['2026-10-27T12:00:00Z','2026-10-28T12:00:00Z','2026-10-29T20:00:00Z'],values:[104,102,103],color:'#FF1744'},
  {name:'Ibovespa',code:'IBOV',times:['2026-10-27T12:00:00Z','2026-10-28T12:00:00Z','2026-10-29T20:00:00Z'],values:[101,103,100],color:'#FF1744'},
  {name:'Bitcoin',code:'BTC/USD',times:['2026-10-23T12:00:00Z','2026-10-25T00:00:00Z','2026-10-27T12:00:00Z','2026-10-29T20:00:00Z'],values:[98,101,99,104],color:'#00E676'}
].map(row=>({...row,points:row.times.map((time,index)=>({time:Date.parse(time),value:row.values[index]}))}));
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const text=(x,y,value,size=5,fill='#96969C',anchor='start',weight='400')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="-apple-system,Arial,sans-serif" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(value)}</text>`;
function coords(row,mode){
  const first=mode==='before'?windowStart:row.points[0].time,last=mode==='before'?now:row.points.at(-1).time,duration=last-first,min=Math.min(...row.points.map(point=>point.value)),max=Math.max(...row.points.map(point=>point.value));
  return row.points.map(point=>({x:.75+(point.time-first)/duration*(GRAPH_WIDTH-1.5),y:.75+(max===min?.5:1-(point.value-min)/(max-min))*(GRAPH_HEIGHT-1.5)}));
}
function curve(row,rowTop,mode,offset){
  const points=coords(row,mode),prefix=points.map((point,index)=>`${index?'L':'M'}${offset+COL3_X+point.x} ${rowTop+GRAPH_TOP+point.y}`).join(' '),first=points[0],last=points.at(-1),area=`${prefix} L${offset+COL3_X+last.x} ${rowTop+GRAPH_TOP+GRAPH_HEIGHT} L${offset+COL3_X+first.x} ${rowTop+GRAPH_TOP+GRAPH_HEIGHT} Z`;
  return `<path d="${area}" fill="${row.color}" opacity=".28"/><path d="${prefix}" fill="none" stroke="${row.color}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function widget(x,y,size,mode,label){
  const lines=[`<rect x="${x}" y="${y}" width="${size.width}" height="${size.height}" rx="10" fill="#1E1E1E" stroke="#34343A"/>`,text(x+8,y+15,label,8,'#D1D1D6','start','600')];
  const top=y+20;
  for(let i=0;i<rows.length;i++){
    const row=rows[i],rowTop=top+i*ROW_STEP,points=coords(row,mode);
    lines.push(text(x+COL2_X,rowTop+15,row.name,4.3,'#FFFFFF','start','600'));
    lines.push(text(x+COL2_X,rowTop+25,`${row.code} | fixture`,3.5,'#96969C'));
    lines.push(`<circle cx="${x+13}" cy="${rowTop+18}" r="10" fill="#34343A"/>`);
    lines.push(text(x+13,rowTop+20,row.code==='BTC/USD'?'BTC':row.code.slice(0,2),3.8,'#FFFFFF','middle','700'));
    lines.push(`<line x1="${x+COL3_X}" y1="${rowTop+GRAPH_TOP}" x2="${x+COL3_X}" y2="${rowTop+GRAPH_TOP+GRAPH_HEIGHT}" stroke="#FFFFFF" stroke-opacity=".22" stroke-dasharray="1 1"/>`);
    lines.push(`<line x1="${x+COL3_X+GRAPH_WIDTH}" y1="${rowTop+GRAPH_TOP}" x2="${x+COL3_X+GRAPH_WIDTH}" y2="${rowTop+GRAPH_TOP+GRAPH_HEIGHT}" stroke="#FFFFFF" stroke-opacity=".22" stroke-dasharray="1 1"/>`);
    lines.push(curve(row,rowTop,mode,x));
    lines.push(text(x+COL3_X+GRAPH_WIDTH+25,rowTop+15,'fixture',3.8,'#FFFFFF','end','600'));
    lines.push(text(x+COL3_X+GRAPH_WIDTH+25,rowTop+25,'7D',3.5,row.color,'end','600'));
    if(i<rows.length-1)lines.push(`<line x1="${x+8}" y1="${rowTop+ROW+0.33}" x2="${x+size.width-8}" y2="${rowTop+ROW+0.33}" stroke="#FFFFFF" stroke-opacity=".13"/>`);
  }
  return lines.join('');
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="740" height="430" viewBox="0 0 740 430"><title>Popular Scripting ${version} chart domain comparison</title><desc>Fixture-only comparison at native widget sizes. Before uses the global seven-day window and leaves sparse B3 curves narrow. After uses each series' first and last real visible timestamps while preserving intermediate elapsed-time spacing. No live prices or points are included.</desc><rect width="740" height="430" rx="20" fill="#0F0F12"/>${widget(18,24,SMALL,'before','ANTES · small 158×158')}${widget(190,24,SMALL,'after','DEPOIS · small 158×158')}${widget(362,24,MEDIUM,'before','ANTES · medium 338×170')}${widget(362,220,MEDIUM,'after','DEPOIS · medium 338×170')}${text(18,402,'Fixture de timestamps · pontos e valores sintéticos · bordas úteis marcadas',10,'#96969C')}${text(18,418,'Não substitui o render nativo do Scripting nem prova teste físico no iPhone.',9,'#96969C')}</svg>\n`;
const evidence={version,output:path.relative(root,output),sizes:{small:'158x158',medium:'338x170'},domainBefore:'global 7D window',domainAfter:'each visible series first/last timestamp',edgeX:[.75,45.25],rows:rows.map(row=>({code:row.code,points:row.points.length,first:row.times[0],last:row.times.at(-1)})),values:'synthetic fixture only',liveData:false,nativeIPhone:false};
fs.writeFileSync(output,svg);fs.writeFileSync(jsonOutput,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({...evidence,jsonOutput:path.relative(root,jsonOutput)}));
