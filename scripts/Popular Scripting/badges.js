// @ts-nocheck
// Generated badge geometry from Popular.template.js.
export function drawBadge(native,code) {
const Size=class{};const Rect=class{constructor(x,y,width,height){Object.assign(this,{x,y,width,height});}};
const Point=class{constructor(x,y){Object.assign(this,{x,y});}};
const Color=class{constructor(hex){this.hex=hex;}static white(){return new Color('FFFFFF');}};
const Path=class{constructor(){this.ops=[];}move(p){this.ops.push(['moveTo',p.x,p.y]);}addLine(p){this.ops.push(['lineTo',p.x,p.y]);}closeSubpath(){this.ops.push(['closePath']);}addRect(r){this.ops.push(['rect',r.x,r.y,r.width,r.height]);}addEllipse(r){this.ops.push(['ellipse',r.x+r.width/2,r.y+r.height/2,r.width/2,r.height/2,0,0,Math.PI*2,false]);}};
const DrawContext=class{addPath(p){native.beginPath();for(const [name,...args] of p.ops)native[name](...args);}setFillColor(c){native.fillStyle='#'+c.hex;}setStrokeColor(c){native.strokeStyle='#'+c.hex;}setLineWidth(w){native.lineWidth=w;}fillPath(){native.fill();}strokePath(){native.stroke();}getImage(){return null;}};
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

function drawEconomicBadge(code) {
  const ctx=new DrawContext();ctx.size=new Size(26,26);ctx.opaque=false;ctx.respectScreenScale=true;
  const disk=new Path();disk.addEllipse(new Rect(0,0,26,26));ctx.addPath(disk);ctx.setFillColor(new Color(code==='CUB_GO'?'3976B9':code==='IPCA'?'7C4DBA':'288A83'));ctx.fillPath();
  const glyph=new Path();
  if(code==='CUB_GO'){glyph.addRect(new Rect(6,6,14,16));for(let x=9;x<=16;x+=4)for(let y=9;y<=17;y+=4)glyph.addRect(new Rect(x,y,1,1));}
  else if(code==='IPCA'){glyph.addRect(new Rect(6,6,14,14));glyph.move(new Point(9,10));glyph.addLine(new Point(17,10));glyph.move(new Point(9,14));glyph.addLine(new Point(17,14));glyph.move(new Point(9,18));glyph.addLine(new Point(17,18));}
  else{glyph.addRect(new Rect(6,6,10,15));glyph.addRect(new Rect(8,8,6,5));glyph.move(new Point(16,11));glyph.addLine(new Point(20,11));glyph.addLine(new Point(20,19));glyph.addLine(new Point(23,19));glyph.addLine(new Point(23,8));glyph.addLine(new Point(20,5));}
  ctx.addPath(glyph);ctx.setStrokeColor(Color.white());ctx.setLineWidth(1.2);ctx.strokePath();return ctx.getImage();
}

if(code==='SOJA_JATAI_GO')drawSoybeanBadge();else drawEconomicBadge(code);
}
