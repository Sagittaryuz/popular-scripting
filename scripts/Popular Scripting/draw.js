// @ts-nocheck
// Text belongs to native Text views, never to Canvas baselines or clipping boxes.
export const GEOMETRY=Object.freeze({column:146,columnGap:12,row:36,gap:2/3,icon:26,detail:30,name:64,price:52,graph:78,percent:34,top:17,middle:11,bottom:8});
export function layout(family,width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=12||height<=8)throw Error('Dimensão inválida');
  const wide=family!=='small',large=family==='large',contentWidth=wide?304:146;
  const scale=Math.min(1,(width-12)/contentWidth,(height-(large?62:8))/146);
  if(scale<=0)throw Error('Área insuficiente');
  return {width,height,scale,x:(width-contentWidth*scale)/2,y:(height-146*scale)/2,wide,large,count:wide?8:4,contentWidth};
}
export function place(plan,x,y,width,height,alignment='center'){
  const s=plan.scale;
  return {frame:{width:width*s,height:height*s,alignment},position:{x:plan.x+(x+width/2)*s,y:plan.y+(y+height/2)*s}};
}
export function movementColor(row){return row.movement>0?'#30C795':row.movement<0?'#FF5967':'#96969C';}
export function curvePlan(api,row,width=GEOMETRY.graph){
  const visible=api.displayChart(row.chart),points=api.lineCoordinates(visible,width,5.5);
  return {width,points,months:api.monthLayout(visible,width),strips:api.gradientStrips(points,5.5,.5)};
}
function rgba(hex,a){return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;}
// Path commands and explicit RGBA only: no Canvas text, gradients or 8-digit hex.
export function drawCurve(ctx,size,plan,color){
  const sx=size.width/plan.width,sy=size.height/5.5;
  const path=points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));};
  for(const guide of plan.months.lines){ctx.beginPath();ctx.moveTo(guide.x*sx,.5*sy);ctx.lineTo(guide.x*sx,5*sy);ctx.strokeStyle='rgba(255,255,255,0.20)';ctx.lineWidth=.45*sx;ctx.stroke();}
  for(const {polygon,alpha} of plan.strips){path(polygon);ctx.closePath();ctx.fillStyle=rgba(color,alpha);ctx.fill();}
  if(plan.points.length){path(plan.points);ctx.strokeStyle=color;ctx.lineWidth=.7*sx;ctx.stroke();}
}
