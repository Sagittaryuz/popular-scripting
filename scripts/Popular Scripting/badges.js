// @ts-nocheck
// Generated badge geometry from Popular.template.js.
export function drawBadge(native,code) {
const Size=class{};const Rect=class{constructor(x,y,width,height){Object.assign(this,{x,y,width,height});}};
const Point=class{constructor(x,y){Object.assign(this,{x,y});}};
const Color=class{constructor(hex){this.hex=hex;}static white(){return new Color('FFFFFF');}};
const Path=class{constructor(){this.ops=[];}move(p){this.ops.push(['moveTo',p.x,p.y]);}addLine(p){this.ops.push(['lineTo',p.x,p.y]);}closeSubpath(){this.ops.push(['closePath']);}addRect(r){this.ops.push(['rect',r.x,r.y,r.width,r.height]);}addEllipse(r){this.ops.push(['ellipse',r.x+r.width/2,r.y+r.height/2,r.width/2,r.height/2,0,0,Math.PI*2,false]);}};
const DrawContext=class{addPath(p){native.beginPath();for(const [name,...args] of p.ops)native[name](...args);}setFillColor(c){native.fillStyle='#'+c.hex;}setStrokeColor(c){native.strokeStyle='#'+c.hex;}setLineWidth(w){native.lineWidth=w;}fillPath(){native.fill();}strokePath(){native.stroke();}save(){native.save();}clip(){native.clip();}restore(){native.restore();}getImage(){return null;}};
function soybeanPolygon(ctx,points,color) {
  const path=new Path();
  points.forEach((p,i)=>i?path.addLine(new Point(p[0],p[1])):path.move(new Point(p[0],p[1])));
  path.closeSubpath();ctx.addPath(path);ctx.setFillColor(color);ctx.fillPath();
}
function soybeanLeaf(ctx,base,tip,color,veinColor) {
  const dx=tip[0]-base[0],dy=tip[1]-base[1],length=Math.hypot(dx,dy)||1;
  const nx=-dy/length,ny=dx/length,width=Math.min(1.65,length*.25);
  const at=(t,k)=>[base[0]+dx*t+nx*width*k,base[1]+dy*t+ny*width*k];
  soybeanPolygon(ctx,[base,at(.35,.65),at(.72,1),tip,at(.72,-1),at(.35,-.65)],color);
  const vein=new Path();vein.move(new Point(base[0],base[1]));
  vein.addLine(new Point(base[0]+dx*.78+nx*width*.18,base[1]+dy*.78+ny*width*.18));
  ctx.addPath(vein);ctx.setStrokeColor(veinColor);ctx.setLineWidth(.32);ctx.strokePath();
}
function soybeanPod(ctx,base,tip,color) {
  const dx=tip[0]-base[0],dy=tip[1]-base[1],length=Math.hypot(dx,dy)||1;
  const nx=-dy/length,ny=dx/length,width=Math.min(.95,length*.23);
  const at=(t,k)=>[base[0]+dx*t+nx*width*k,base[1]+dy*t+ny*width*k];
  soybeanPolygon(ctx,[base,at(.25,.82),at(.55,1),at(.82,.65),tip,at(.82,-.65),at(.55,-1),at(.25,-.82)],color);
}
function drawSoybeanBadge() {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=[];for(let i=0;i<48;i++){const a=2*Math.PI*i/48;disk.push([13+13*Math.cos(a),13+13*Math.sin(a)]);}
  soybeanPolygon(ctx,disk,Color.white());
  const green=new Color('65963C'),vein=new Color('9BC66A'),stemColor=new Color('4D7D36'),pods=new Color('F2C653');
  soybeanLeaf(ctx,[13,16.5],[7,14],green,vein);
  soybeanLeaf(ctx,[13.1,15.3],[19.2,12.6],green,vein);
  soybeanLeaf(ctx,[13,13],[7.6,9.7],green,vein);
  soybeanLeaf(ctx,[13.5,11.1],[19.6,7.5],green,vein);
  soybeanLeaf(ctx,[14,8.5],[10.4,5.2],green,vein);
  soybeanLeaf(ctx,[14.4,7],[17.2,3.5],green,vein);
  const stem=new Path();stem.move(new Point(13,22.4));stem.addLine(new Point(12.8,17.2));stem.addLine(new Point(13.2,13.2));stem.addLine(new Point(14,9));stem.addLine(new Point(15.5,4.7));
  ctx.addPath(stem);ctx.setStrokeColor(stemColor);ctx.setLineWidth(1);ctx.strokePath();
  soybeanPod(ctx,[12.8,17.6],[10.3,21.1],pods);
  soybeanPod(ctx,[13.3,17.8],[16.2,20.9],pods);
  soybeanPod(ctx,[13.2,18.1],[13.5,22.1],pods);
  return ctx.getImage();
}

function drawUSFlagBadge() {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  // The flag fills a square source and is clipped to the same 26 pt disk used
  // by the other asset badges. Stars are part of the flag; no currency glyph
  // or second emblem is drawn on top of it.
  ctx.save();
  const clip=new Path();clip.addEllipse(new Rect(0,0,26,26));ctx.addPath(clip);ctx.clip();
  for(let row=0;row<13;row++){
    const stripe=new Path();stripe.addRect(new Rect(0,row*2,26,2));ctx.addPath(stripe);ctx.setFillColor(new Color(row%2?'FFFFFF':'B22234'));ctx.fillPath();
  }
  const canton=new Path();canton.addRect(new Rect(0,0,10.4,14));ctx.addPath(canton);ctx.setFillColor(new Color('3C3B6E'));ctx.fillPath();
  for(let row=0;row<9;row++){
    const count=row%2?5:6,offset=row%2?1.35:.65;
    for(let column=0;column<count;column++){
      const star=new Path();star.addEllipse(new Rect(offset+column*1.58,1.05+row*1.42,.72,.72));
      ctx.addPath(star);ctx.setFillColor(new Color('FFFFFF'));ctx.fillPath();
    }
  }
  ctx.restore();
  return ctx.getImage();
}

function drawIndexBadge(code) {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=new Path();disk.addEllipse(new Rect(0,0,26,26));ctx.addPath(disk);
  ctx.setFillColor(new Color(code==='IBOV'?'245E8A':'2D486E'));ctx.fillPath();
  const grid=new Path();
  for(const y of [8,13,18]){grid.move(new Point(6,y));grid.addLine(new Point(20,y));}
  ctx.addPath(grid);ctx.setStrokeColor(new Color('8FC7E8'));ctx.setLineWidth(.45);ctx.strokePath();
  if(code==='DOW_JONES'){
    const bars=new Path();bars.addRect(new Rect(6.5,15,2.2,5));bars.addRect(new Rect(10.1,12,2.2,8));bars.addRect(new Rect(13.7,9,2.2,11));bars.addRect(new Rect(17.3,11,2.2,9));
    ctx.addPath(bars);ctx.setFillColor(new Color('FFFFFF'));ctx.fillPath();
    const trend=new Path();trend.move(new Point(6,17));trend.addLine(new Point(9,15));trend.addLine(new Point(12,16));trend.addLine(new Point(15,11));trend.addLine(new Point(20,8));
    ctx.addPath(trend);ctx.setStrokeColor(new Color('C9F1FF'));ctx.setLineWidth(1.05);ctx.strokePath();
  }else{
    const trend=new Path();trend.move(new Point(6,18));trend.addLine(new Point(9,15));trend.addLine(new Point(12,16));trend.addLine(new Point(15,11));trend.addLine(new Point(18,12));trend.addLine(new Point(20,8));
    ctx.addPath(trend);ctx.setStrokeColor(new Color('FFFFFF'));ctx.setLineWidth(1.35);ctx.strokePath();
    const endpoint=new Path();endpoint.addEllipse(new Rect(18.7,6.7,2.6,2.6));ctx.addPath(endpoint);ctx.setFillColor(new Color('B9F2FF'));ctx.fillPath();
  }
  return ctx.getImage();
}

function drawOilBadge() {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=new Path();disk.addEllipse(new Rect(0,0,26,26));ctx.addPath(disk);ctx.setFillColor(new Color('7A4E20'));ctx.fillPath();
  const barrel=new Path();barrel.addRect(new Rect(7,7,12,13));barrel.addEllipse(new Rect(7,5.3,12,4));barrel.addEllipse(new Rect(7,17.7,12,4));
  ctx.addPath(barrel);ctx.setFillColor(new Color('F4C36A'));ctx.fillPath();
  const bands=new Path();bands.move(new Point(7,10));bands.addLine(new Point(19,10));bands.move(new Point(7,17));bands.addLine(new Point(19,17));
  ctx.addPath(bands);ctx.setStrokeColor(new Color('8E5A22'));ctx.setLineWidth(.8);ctx.strokePath();
  const drop=new Path();drop.move(new Point(13,8));drop.addLine(new Point(11.2,11));drop.addLine(new Point(13,13));drop.addLine(new Point(14.8,11));drop.closeSubpath();
  ctx.addPath(drop);ctx.setFillColor(new Color('FFFFFF'));ctx.fillPath();
  return ctx.getImage();
}

// The published profile can receive remote metadata for some instruments, but
// every requested slot must remain visible if that metadata is absent or fails.
// These local circular badges are deterministic fallbacks; they identify the
// instrument without pretending to be an unverified exchange or ETF logo.
const INITIAL_BADGES=Object.freeze({BBAS3:'BB',BBDC4:'BD','BTC/USD':'BTC'});
const INITIAL_GLYPHS=Object.freeze({
  B:['11110','10001','10001','11110','10001','10001','11110'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  J:['00111','00010','00010','00010','00010','10010','01100'],
  R:['11110','10001','10001','11110','10100','10010','10001']
});
function drawInitialsBadge(code) {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=new Path();disk.addEllipse(new Rect(0,0,26,26));ctx.addPath(disk);ctx.setFillColor(new Color('34343A'));ctx.fillPath();
  const label=INITIAL_BADGES[code],cell=label.length===3?1.25:1.7,gap=label.length===3?1.2:1.4,total=label.length*5*cell+(label.length-1)*gap,left=(26-total)/2,top=(26-7*cell)/2;
  const pixels=new Path();
  [...label].forEach((letter,letterIndex)=>{
    const glyph=INITIAL_GLYPHS[letter]||[];
    glyph.forEach((line,row)=>[...line].forEach((filled,column)=>{
      if(filled==='1')pixels.addRect(new Rect(left+letterIndex*(5*cell+gap)+column*cell,top+row*cell,cell,cell));
    }));
  });
  ctx.addPath(pixels);ctx.setFillColor(Color.white());ctx.fillPath();return ctx.getImage();
}

function drawEconomicBadge(code) {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=new Path();disk.addEllipse(new Rect(0,0,26,26));ctx.addPath(disk);ctx.setFillColor(new Color(code==='CUB_GO'?'3976B9':code==='IPCA'?'7C4DBA':'288A83'));ctx.fillPath();
  const glyph=new Path();
  if(code==='CUB_GO'){glyph.addRect(new Rect(6,6,14,16));for(let x=9;x<=16;x+=4)for(let y=9;y<=17;y+=4)glyph.addRect(new Rect(x,y,1,1));}
  else if(code==='IPCA'){glyph.addRect(new Rect(6,6,14,14));glyph.move(new Point(9,10));glyph.addLine(new Point(17,10));glyph.move(new Point(9,14));glyph.addLine(new Point(17,14));glyph.move(new Point(9,18));glyph.addLine(new Point(17,18));}
  else{glyph.addRect(new Rect(6,6,10,15));glyph.addRect(new Rect(8,8,6,5));glyph.move(new Point(16,11));glyph.addLine(new Point(20,11));glyph.addLine(new Point(20,19));glyph.addLine(new Point(23,19));glyph.addLine(new Point(23,8));glyph.addLine(new Point(20,5));}
  ctx.addPath(glyph);ctx.setStrokeColor(Color.white());ctx.setLineWidth(1.2);ctx.strokePath();return ctx.getImage();
}

if(code==='SOJA_JATAI_GO')drawSoybeanBadge();else if(code==='USD/BRL')drawUSFlagBadge();else if(code==='IBOV'||code==='DOW_JONES')drawIndexBadge(code);else if(code==='BRENT')drawOilBadge();else if(INITIAL_BADGES[code])drawInitialsBadge(code);else drawEconomicBadge(code);
}
