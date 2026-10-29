// @ts-nocheck
// Text belongs to native Text views, never to Canvas baselines or clipping boxes.
const ROW=36,TOP=8,MIDDLE=8,BOTTOM=3,GRAPH_HEIGHT=20;
// The row is a measured four-column grid. The 26 pt icon is centered in the
// first column while the wider identity column has room for the name /
// code-date pair. The graph and quote columns are independent, so no text can
// enter the neighboring visual region.
const COLUMN=146,COLUMN_GAP=12,COL_GAP=2,COL1=28,COL2=40,COL3=46,COL4=26;
const COL1_X=0,COL2_X=COL1+COL_GAP,COL3_X=COL2_X+COL2+COL_GAP,COL4_X=COL3_X+COL3+COL_GAP;
const STATUS_DOT=3,STATUS_SPACING=8,STATUS_TRAILING_GAP=2,NAME_TEXT_MAX=COL2-STATUS_DOT-STATUS_SPACING-STATUS_TRAILING_GAP;
const ICON=26,ICON_TOP=(ROW-ICON)/2,ICON_LEFT=(COL1-ICON)/2;
const BLOCK_TOP=0,BLOCK_HEIGHT=ROW,BLOCK_CENTER=BLOCK_TOP+BLOCK_HEIGHT/2;
const NAME_TOP=9,NAME_HEIGHT=8,META_TOP=19,META_HEIGHT=8,GRAPH_TOP=8,MONTH_TOP=25.5,LINE1_TOP=8,LINE2_TOP=20,LINE3_TOP=16.5;
export const GEOMETRY=Object.freeze({column:COLUMN,columnGap:COLUMN_GAP,row:ROW,gap:2/3,icon:ICON,iconTop:ICON_TOP,iconLeft:ICON_LEFT,iconColumn:COL1,col1:COL1,col1X:COL1_X,col2:COL2,col2X:COL2_X,col3:COL3,col3X:COL3_X,col4:COL4,col4X:COL4_X,colGap:COL_GAP,detail:COL3_X,blockWidth:COL3,blockTop:BLOCK_TOP,blockHeight:BLOCK_HEIGHT,blockCenter:BLOCK_CENTER,name:COL2,nameX:COL2_X,nameTop:NAME_TOP,nameHeight:NAME_HEIGHT,nameTextMax:NAME_TEXT_MAX,statusDot:STATUS_DOT,statusSpacing:STATUS_SPACING,statusTrailingGap:STATUS_TRAILING_GAP,code:COL2,codeX:COL2_X,codeTop:META_TOP,codeHeight:META_HEIGHT,date:COL2,dateX:COL2_X,dateTop:META_TOP,dateHeight:META_HEIGHT,price:COL4,priceX:COL4_X,unit:COL4,unitX:COL4_X,timeX:COL2_X,time:COL2,graph:COL3,graphX:COL3_X,graphHeight:GRAPH_HEIGHT,percent:COL4,percentX:COL4_X,top:TOP,middle:MIDDLE,bottom:BOTTOM,line1Top:LINE1_TOP,line2Top:LINE2_TOP,graphTop:GRAPH_TOP,monthTop:MONTH_TOP,line3Top:LINE3_TOP});
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
  return {width,points,months:api.monthLayout(visible,width),strips:api.gradientStrips(points,GEOMETRY.graphHeight,.5),status:visible?.displayStatus||'unavailable-7d'};
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
