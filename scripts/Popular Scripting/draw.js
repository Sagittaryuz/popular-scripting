// @ts-nocheck
// Text belongs to native Text views, never to Canvas baselines or clipping boxes.
const ROW=36,TOP=8,MIDDLE=11,BOTTOM=7,GRAPH_HEIGHT=15,ICON_TOP=8,ICON_LEFT=3;
// The row remains a single centered 36 pt group. The title is the only text
// above the smaller icon; quote/chart metadata stays in the right-hand group.
// The graph is intentionally taller than the pre-0.2.25 5.5 pt strip.
const BLOCK_TOP=(ROW-ROW)/2,BLOCK_HEIGHT=ROW,BLOCK_CENTER=BLOCK_TOP+BLOCK_HEIGHT/2;
const NAME_TOP=BLOCK_TOP,NAME_HEIGHT=TOP,GRAPH_TOP=10.5,MONTH_TOP=26,LINE2_TOP=12.5,LINE3_TOP=29;
export const GEOMETRY=Object.freeze({column:146,columnGap:12,row:ROW,gap:2/3,icon:20,iconTop:ICON_TOP,iconLeft:ICON_LEFT,detail:30,blockWidth:146-30,blockTop:BLOCK_TOP,blockHeight:BLOCK_HEIGHT,blockCenter:BLOCK_CENTER,name:78,nameTop:NAME_TOP,nameHeight:NAME_HEIGHT,price:62,priceX:54,unit:64,timeX:68,time:48,graph:82,graphHeight:GRAPH_HEIGHT,percent:32,percentX:84,top:TOP,middle:MIDDLE,bottom:BOTTOM,line1Top:NAME_TOP,line2Top:LINE2_TOP,graphTop:GRAPH_TOP,monthTop:MONTH_TOP,line3Top:LINE3_TOP});
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
export function placeInBlock(plan,x,y,width,height,alignment='center'){
  const s=plan.scale;
  return {frame:{width:width*s,height:height*plan.scaleY,alignment},position:{x:(x+width/2)*s,y:(y+height/2)*plan.scaleY}};
}
export function movementColor(row){return row.movement>0?'#00E676':row.movement<0?'#FF1744':'#96969C';}
export function curvePlan(api,row,width=GEOMETRY.graph){
  const visible=api.displayChart(row.chart),points=api.lineCoordinates(visible,width,GEOMETRY.graphHeight);
  return {width,points,months:api.monthLayout(visible,width),strips:api.gradientStrips(points,GEOMETRY.graphHeight,.5),status:visible?.displayStatus||'unavailable-24h'};
}
export function monthBand(curve){
  if(!curve.points.length)return {left:0,width:0,labels:[]};
  const left=Math.max(0,Math.min(...curve.points.map(p=>p.x))),right=Math.min(curve.width,Math.max(...curve.points.map(p=>p.x)));
  return {left,width:Math.max(0,right-left),labels:curve.months.labels.filter(m=>m.x<right&&m.x+14>left).map(m=>({...m,x:m.x-left}))};
}
function rgba(hex,a){return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;}
// Path commands and explicit RGBA only: no Canvas text, gradients or 8-digit hex.
export function drawCurve(ctx,size,plan,color){
  const sx=size.width/plan.width,sy=size.height/GEOMETRY.graphHeight;
  const path=points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));};
  for(const guide of plan.months.lines){ctx.beginPath();ctx.moveTo(guide.x*sx,.5*sy);ctx.lineTo(guide.x*sx,(GEOMETRY.graphHeight-.5)*sy);ctx.strokeStyle='rgba(255,255,255,0.20)';ctx.lineWidth=.45*sx;ctx.stroke();}
  for(const {polygon,alpha} of plan.strips){path(polygon);ctx.closePath();ctx.fillStyle=rgba(color,alpha);ctx.fill();}
  if(plan.points.length){path(plan.points);ctx.strokeStyle=color;ctx.lineWidth=.7*sx;ctx.stroke();}
}
