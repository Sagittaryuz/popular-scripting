const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');

// Fixture-only visual evidence for the active 0.2.41 profile. Values and
// curves are deliberately placeholders; the preview proves the four-row
// order, equal identity typography, no status dot, and a visible pictogram in
// every slot. It never embeds live quotes or downloaded logos.
const root=path.resolve(__dirname,'..'),version='0.2.41';
const svgOutput=path.join(root,`validation/market-profile-${version}-preview.svg`),pngOutput=path.join(root,`validation/market-profile-${version}-preview.png`),jsonOutput=path.join(root,`validation/market-profile-${version}-preview.json`);
const ROW=36,ROW_STEP=ROW+2/3,COLUMN=146,COLUMN_GAP=12,COL_GAP=2,COL1=28,COL2=40,COL3=46,COL4=26,COL2_X=COL1+COL_GAP,COL3_X=COL2_X+COL2+COL_GAP,COL4_X=COL3_X+COL3+COL_GAP,ICON=26,ICON_LEFT=(COL1-ICON)/2,NAME_TOP=9,META_TOP=19,GRAPH_TOP=8,GRAPH_HEIGHT=20,NAME_FONT=5.5;
const rows=[
  {code:'IBOV',name:'Ibovespa',meta:'IBOV | 30/10',badge:'INDEX',color:'#FF1744',curve:true},
  {code:'DOW_JONES',name:'Dow Jones',meta:'DOW | fonte',badge:'MARKET',color:'#96969C',curve:false},
  {code:'USD/BRL',name:'Dólar',meta:'USD/BRL | 30/10',badge:'USD',color:'#00E676',curve:true},
  {code:'BRENT',name:'Petróleo',meta:'BRENT | 30/10',badge:'OIL',color:'#FF1744',curve:true}
];
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const text=(x,y,value,size=5,fill='#96969C',anchor='start',weight='400')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="-apple-system,Arial,sans-serif" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(value)}</text>`;
function badge(row,cx,cy){
  if(row.badge==='USD'){
    const stripes=Array.from({length:13},(_,i)=>`<rect x="0" y="${i*2}" width="26" height="2" fill="${i%2?'#FFFFFF':'#B22234'}"/>`).join('');
    const stars=Array.from({length:9},(_,r)=>{const count=r%2?5:6,start=r%2?1.35:.65;return Array.from({length:count},(_,c)=>`<circle cx="${start+c*1.58+.36}" cy="${1.05+r*1.42+.36}" r=".36" fill="#FFFFFF"/>`).join('');}).join('');
    return `<g transform="translate(${cx-13} ${cy-13})"><clipPath id="us-flag-clip"><circle cx="13" cy="13" r="13"/></clipPath><g clip-path="url(#us-flag-clip)">${stripes}<rect x="0" y="0" width="10.4" height="14" fill="#3C3B6E"/>${stars}</g></g>`;
  }
  if(row.badge==='OIL')return `<g transform="translate(${cx-13} ${cy-13})"><circle cx="13" cy="13" r="13" fill="#7A4E20"/><rect x="7" y="7" width="12" height="13" rx="1" fill="#F4C36A"/><ellipse cx="13" cy="7" rx="6" ry="2" fill="#FFE0A0"/><ellipse cx="13" cy="20" rx="6" ry="2" fill="#D79A45"/><path d="M7 10H19M7 17H19" stroke="#8E5A22" stroke-width=".8"/><path d="M13 8L11.2 11L13 13L14.8 11Z" fill="#FFFFFF"/></g>`;
  if(row.badge==='INDEX')return `<g transform="translate(${cx-13} ${cy-13})"><circle cx="13" cy="13" r="13" fill="#245E8A"/><path d="M6 8H20M6 13H20M6 18H20" stroke="#8FC7E8" stroke-width=".45"/><path d="M6 18L9 15L12 16L15 11L18 12L20 8" fill="none" stroke="#FFFFFF" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="8" r="1.3" fill="#B9F2FF"/></g>`;
  if(row.badge==='MARKET')return `<g transform="translate(${cx-13} ${cy-13})"><circle cx="13" cy="13" r="13" fill="#2D486E"/><path d="M6 8H20M6 13H20M6 18H20" stroke="#8FC7E8" stroke-width=".45"/><rect x="6.5" y="15" width="2.2" height="5" fill="#FFFFFF"/><rect x="10.1" y="12" width="2.2" height="8" fill="#FFFFFF"/><rect x="13.7" y="9" width="2.2" height="11" fill="#FFFFFF"/><rect x="17.3" y="11" width="2.2" height="9" fill="#FFFFFF"/><path d="M6 17L9 15L12 16L15 11L20 8" fill="none" stroke="#C9F1FF" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return `<g transform="translate(${cx-13} ${cy-13})"><circle cx="13" cy="13" r="13" fill="#34343A"/></g>`;
}
function curve(row,rowTop,offset){
  if(!row.curve)return text(offset+COL3_X+COL3/2,rowTop+GRAPH_TOP+12,'7d indisponível',4.2,'#96969C','middle');
  const x=offset+COL3_X,y=rowTop+GRAPH_TOP,points=[[.75,14.5],[16,10],[29,12],[45.25,4.5]],line=points.map(([px,py],i)=>`${i?'L':'M'}${x+px} ${y+py}`).join(' '),fill=`${line} L${x+45.25} ${y+GRAPH_HEIGHT} L${x+.75} ${y+GRAPH_HEIGHT} Z`;
  return `<path d="${fill}" fill="${row.color}" opacity=".30"/><path d="${line}" fill="none" stroke="${row.color}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function rowMarkup(row,rowTop,offset){
  const cx=offset+ICON_LEFT+ICON/2,cy=rowTop+18,right=offset+COL4_X+COL4;
  return `<g aria-label="${esc(row.code)} fixture">${badge(row,cx,cy)}${text(offset+COL2_X,rowTop+NAME_TOP+6.2,row.name,NAME_FONT,'#FFFFFF','start','600')}${text(offset+COL2_X,rowTop+META_TOP+6,row.meta,5.3)}<path d="M${offset+COL3_X} ${rowTop+GRAPH_TOP}V${rowTop+GRAPH_TOP+GRAPH_HEIGHT}M${offset+COL3_X+COL3} ${rowTop+GRAPH_TOP}V${rowTop+GRAPH_TOP+GRAPH_HEIGHT}" stroke="#FFFFFF" stroke-opacity=".20" stroke-dasharray="1 1"/>${curve(row,rowTop,offset)}${text(right,rowTop+15,'—',6.8,'#FFFFFF','end','600')}${text(right,rowTop+23,'—',5,row.color,'end','600')}</g>`;
}
function widget(x,y,width,height,label,columns){
  const contentWidth=columns===2?304:COLUMN,contentX=x+(width-contentWidth)/2,top=y+10,parts=[`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="#1E1E1E" stroke="#34343A"/>`,text(x+8,y-5,label,8,'#D1D1D6','start','600')];
  rows.forEach((row,i)=>{const column=columns===2?Math.floor(i/4):0,index=i%4,offset=contentX+column*(COLUMN+COLUMN_GAP),rowTop=top+index*ROW_STEP;parts.push(rowMarkup(row,rowTop,offset));if(index<3)parts.push(`<line x1="${x+8}" y1="${rowTop+ROW+.33}" x2="${x+width-8}" y2="${rowTop+ROW+.33}" stroke="#FFFFFF" stroke-opacity=".13"/>`);});
  return parts.join('');
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="245" viewBox="0 0 540 245"><title>Popular Scripting ${version} market profile preview</title><desc>Fixture-only preview for Ibovespa, Dow Jones, Dólar USD/BRL, and Petróleo Brent in the requested order. All four slots use visible local pictograms; USD is the circular United States flag. Names share one 5.5 point semibold line with ellipsis-capable native layout, and no status dot is drawn. Values and curves are synthetic layout fixtures only; Dow Jones remains unavailable because FRED marks DJIA as copyrighted and reproduction requires S&amp;P permission.</desc><rect width="540" height="245" rx="18" fill="#0F0F12"/>${widget(12,34,158,158,'small · 2×2 · 158×158',1)}${widget(190,34,338,170,'medium/large · 4×2 · 338×170',2)}${text(12,214,'Fixture visual · IBOV · DOW · USD/BRL · BRENT · pictogramas locais · sem ponto de status',7,'#96969C')}${text(12,228,'Valores/curvas sintéticos apenas; não substitui render nativo nem teste físico no iPhone.',7,'#96969C')}</svg>\n`;
const evidence={version,output:path.relative(root,svgOutput),pngOutput:path.relative(root,pngOutput),icons:{IBOV:'local index trend pictogram',DOW_JONES:'local market bars pictogram',USD_BRL:'circular US flag',BRENT:'local oil barrel pictogram'},order:rows.map(row=>row.code),identity:{font:NAME_FONT,weight:'semibold',lineLimit:1,ellipsis:true,statusDot:false},data:{live:false,values:'synthetic placeholders',curves:'synthetic geometry only',window:'7D layout contract'},dow:{quote:'unavailable',reason:'FRED DJIA is third-party copyrighted; reproduction requires S&P permission, so no quote request is made'},nativeIPhone:false};
fs.writeFileSync(svgOutput,svg);fs.writeFileSync(jsonOutput,JSON.stringify(evidence,null,2)+'\n');
try{execFileSync('inkscape',[svgOutput,'--export-type=png','--export-filename='+pngOutput],{stdio:'ignore'});}catch(error){throw Error('PNG preview conversion failed: '+error.message);}
console.log(JSON.stringify(evidence));
