// @ts-nocheck
// Text belongs to native Text views, never to Canvas baselines or clipping boxes.
const ROW=36,TOP=17,MIDDLE=11,BOTTOM=8,GRAPH_HEIGHT=5.5;
// The icon remains at y=5..31, so its center is 18. Build the internal
// rows from the middle box: line 1 ends at its top and line 3 keeps the
// approved bottom edge. This prevents independent baseline drift.
const LINE2_TOP=(ROW-MIDDLE)/2;
export const GEOMETRY=Object.freeze({column:146,columnGap:12,row:ROW,gap:2/3,icon:26,detail:30,name:64,price:52,graph:78,graphHeight:GRAPH_HEIGHT,percent:34,top:TOP,middle:MIDDLE,bottom:BOTTOM,line1Top:LINE2_TOP-TOP,line2Top:LINE2_TOP,graphTop:LINE2_TOP+(MIDDLE-GRAPH_HEIGHT)/2,line3Top:ROW-BOTTOM});
export function layout(family,width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=12||height<=8)throw Error('Dimensão inválida');
  const wide=family!=='small',large=family==='large',contentWidth=wide?304:146;
  const contentTop=large?-32:0,contentBottom=large?169:146;
  const scale=Math.min(1,(width-12)/contentWidth,(height-16)/(contentBottom-contentTop));
  if(scale<=0)throw Error('Área insuficiente');
  const scaleY=(height-16)/(contentBottom-contentTop);
  return {width,height,scale,scaleY,x:(width-contentWidth*scale)/2,y:8-contentTop*scaleY,wide,large,count:wide?8:4,contentWidth};
}
export function place(plan,x,y,width,height,alignment='center'){
  const s=plan.scale;
  return {frame:{width:width*s,height:height*plan.scaleY,alignment},position:{x:plan.x+(x+width/2)*s,y:plan.y+(y+height/2)*plan.scaleY}};
}
export function movementColor(row){return row.movement>0?'#30C795':row.movement<0?'#FF5967':'#96969C';}
export function curvePlan(api,row,width=GEOMETRY.graph){
  const visible=api.displayChart(row.chart),points=api.lineCoordinates(visible,width,5.5);
  return {width,points,months:api.monthLayout(visible,width),strips:api.gradientStrips(points,5.5,.5)};
}
export function monthBand(curve){
  if(!curve.points.length)return {left:0,width:0,labels:[]};
  const left=Math.max(0,Math.min(...curve.points.map(p=>p.x))),right=Math.min(curve.width,Math.max(...curve.points.map(p=>p.x)));
  return {left,width:Math.max(0,right-left),labels:curve.months.labels.filter(m=>m.x<right&&m.x+14>left).map(m=>({...m,x:m.x-left}))};
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
