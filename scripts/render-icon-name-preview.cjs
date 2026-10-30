const fs=require('node:fs'),path=require('node:path');

// Deterministic visual evidence for 0.2.39. It mirrors the current four-column
// geometry and node ordering, but uses synthetic SVG/logo/curve fixtures only.
// It never fetches or embeds live quotes, API responses, or downloaded logos.
const root=path.resolve(__dirname,'..'),version='0.2.39';
const output=path.join(root,`validation/icon-name-${version}-preview.svg`),jsonOutput=path.join(root,`validation/icon-name-${version}-preview.json`);
const ROW=36,ROW_STEP=ROW+2/3,COLUMN=146,COL_GAP=2,COL1=28,COL2=40,COL3=46,COL4=26;
const COL1_X=0,COL2_X=COL1+COL_GAP,COL3_X=COL2_X+COL2+COL_GAP,COL4_X=COL3_X+COL3+COL_GAP;
const ICON=26,ICON_LEFT=(COL1-ICON)/2,NAME_TOP=9,NAME_HEIGHT=8,META_TOP=19,META_HEIGHT=8,GRAPH_TOP=8,GRAPH_HEIGHT=20,NAME_FONT=5.5;
const SMALL={width:158,height:158},MEDIUM={width:338,height:170};
const rows=[
  {code:'BBAS3',name:'Banco do Brasil',meta:'BBAS3 | 29/10',color:'#00E676',logo:'bb'},
  {code:'BBDC4',name:'Bradesco PN',meta:'BBDC4 | 29/10',color:'#FF1744',logo:'bd'},
  {code:'IBOV',name:'Ibovespa',meta:'IBOV | 29/10',color:'#FF1744',logo:'ib'},
  {code:'BTC/USD',name:'Bitcoin',meta:'BTC/USD | 29/10',color:'#00E676',logo:'btc'}
];
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const text=(x,y,value,size=5,fill='#96969C',anchor='start',weight='400')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="-apple-system,Arial,sans-serif" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(value)}</text>`;
function ellipsis(value,max=40){
  const width=[...value].reduce((sum,char)=>sum+(/[MW@#]/.test(char)?3.8:/[ilI1.,' ]/.test(char)?1.8:3.1),0);
  if(width<=max)return value;
  let output='';
  for(const char of value){if(output.length&&[...output,char,'…'].reduce((sum,item)=>sum+(/[MW@#]/.test(item)?3.8:/[ilI1.,' ]/.test(item)?1.8:3.1),0)>max)break;output+=char;}
  return output.replace(/\s+$/,'')+'…';
}
function logo(row,cx,cy){
  if(row.logo==='bb')return `<circle cx="${cx}" cy="${cy}" r="13" fill="#007F4E"/><path d="M${cx-7} ${cy-6}h14v3h-14zm0 5h14v3h-14zm0 5h10v3h-10z" fill="#fff"/>`;
  if(row.logo==='bd')return `<circle cx="${cx}" cy="${cy}" r="13" fill="#C91429"/><path d="M${cx-7} ${cy-6}h14v3h-14zm0 5h10v3h-10zm0 5h14v3h-14z" fill="#fff"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="13" fill="#34343A"/>${text(cx,cy+2.1,row.logo==='ib'?'IB':'BTC',row.logo==='ib'?7:5.4,'#FFFFFF','middle','700')}`;
}
function curve(row,rowTop,offset){
  const x=offset+COL3_X,y=rowTop+GRAPH_TOP,points=[[.75,14.5],[18,10],[31,12],[45.25,4.5]],line=points.map(([px,py],i)=>`${i?'L':'M'}${x+px} ${y+py}`).join(' '),fill=`${line} L${x+45.25} ${y+GRAPH_HEIGHT} L${x+.75} ${y+GRAPH_HEIGHT} Z`;
  return `<path d="${fill}" fill="${row.color}" opacity=".30"/><path d="${line}" fill="none" stroke="${row.color}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function rowMarkup(row,rowTop,offset){
  const cx=offset+ICON_LEFT+ICON/2,cy=rowTop+18,identity=ellipsis(row.name),quoteRight=offset+COL4_X+COL4;
  return [
    `<g aria-label="${esc(row.code)} fixture">`,
    logo(row,cx,cy),
    text(offset+COL2_X,rowTop+NAME_TOP+6.2,identity,NAME_FONT,'#FFFFFF','start','600'),
    text(offset+COL2_X,rowTop+META_TOP+6, row.meta,5.3),
    `<path d="M${offset+COL3_X} ${rowTop+GRAPH_TOP}V${rowTop+GRAPH_TOP+GRAPH_HEIGHT}M${offset+COL3_X+COL3} ${rowTop+GRAPH_TOP}V${rowTop+GRAPH_TOP+GRAPH_HEIGHT}" stroke="#FFFFFF" stroke-opacity=".20" stroke-dasharray="1 1"/>`,
    curve(row,rowTop,offset),
    text(quoteRight,rowTop+15,'—',6.8,'#FFFFFF','end','600'),
    text(quoteRight,rowTop+23,'—',5,row.color,'end','600'),
    `</g>`
  ].join('');
}
function widget(x,y,size,label,columns){
  const contentWidth=columns===1?COLUMN:304,contentX=x+(size.width-contentWidth)/2,top=y+10,lines=[];
  lines.push(`<rect x="${x}" y="${y}" width="${size.width}" height="${size.height}" rx="10" fill="#1E1E1E" stroke="#34343A"/>`);
  lines.push(text(x+8,y-5,label,8,'#D1D1D6','start','600'));
  for(let i=0;i<rows.length;i++){
    const column=columns===2?Math.floor(i/4):0,index=i%4,offset=contentX+column*(COLUMN+12),rowTop=top+index*ROW_STEP;
    lines.push(rowMarkup(rows[i],rowTop,offset));
    if(index<3)lines.push(`<line x1="${x+8}" y1="${rowTop+ROW+.33}" x2="${x+size.width-8}" y2="${rowTop+ROW+.33}" stroke="#FFFFFF" stroke-opacity=".13"/>`);
  }
  return lines.join('');
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="245" viewBox="0 0 540 245"><title>Popular Scripting ${version} icon and identity preview</title><desc>Fixture-only preview of the current renderer geometry. API SVG bodies are synthetic safe fixtures for BBAS3 and BBDC4; IBOV and BTC use visible initials because no logo body is supplied. All names use the same 5.5 point semibold text and the full identity column, with native one-line ellipsis expected for overflow. The market status dot is intentionally absent. Values and curves are synthetic layout fixtures, not live data.</desc><rect width="540" height="245" rx="18" fill="#0F0F12"/>${widget(12,34,SMALL,'small · 2×2 · 158×158',1)}${widget(190,34,MEDIUM,'medium/large · 4×2 · 338×170',2)}${text(12,214,'Fixture visual · API SVG body: BBAS3/BBDC4 · fallback initials: IBOV/BTC/USD · sem ponto',7,'#96969C')}${text(12,228,'Curvas/valores sintéticos apenas; não substitui render nativo nem teste físico no iPhone.',7,'#96969C')}</svg>\n`;
const evidence={version,output:path.relative(root,output),jsonOutput:path.relative(root,jsonOutput),sizes:{small:'158x158',medium:'338x170',large:'338x360 same row tree'},identity:{columnWidth:COL2,font:NAME_FONT,weight:'semibold',lineLimit:1,minScaleFactor:1,ellipsis:true,statusDot:false},icons:{apiSVGFixtures:['BBAS3','BBDC4'],visibleFallbackInitials:['IBOV','BTC/USD'],ibovLogo:'not supplied; no ETF substitute'},data:{live:false,values:'synthetic placeholders',curves:'synthetic geometry only',window:'7D layout preserved'},nativeIPhone:false};
fs.writeFileSync(output,svg);fs.writeFileSync(jsonOutput,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));
