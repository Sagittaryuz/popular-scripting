// @ts-nocheck
// Canvas renderer. Numeric data, ordering and chart geometry come from the original engine.
import { drawBadge } from './badges'
export function fitText(ctx,text,box,{size=10,min=6,bold=false,color='white',align='left',ellipsis=false}={}) {
  text=String(text);ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.width,box.height);ctx.clip();
  const font=n=>({name:bold?'SFProText-Semibold':'SFProText-Regular',size:n});
  let chosen=null;
  for(let n=size;n>=min-.001;n-=.25){ctx.font=font(n);const m=ctx.measureText(text);
    if(m.width<=box.width-2&&m.actualBoundingBoxAscent+m.actualBoundingBoxDescent<=box.height-1){chosen={n,m};break;}}
  if(!chosen){
    ctx.font=font(min);
    if(ellipsis){while(text.length>1&&ctx.measureText(text+'…').width>box.width-2)text=text.slice(0,-1);text+='…';}
    else text=text==='—'?'—':'FORA';
    chosen={n:min,m:ctx.measureText(text)};
  }
  ctx.font=font(chosen.n);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';
  const x=align==='right'?box.x+box.width-1:align==='center'?box.x+box.width/2:box.x+1;
  const y=box.y+(box.height-chosen.m.actualBoundingBoxAscent-chosen.m.actualBoundingBoxDescent)/2+chosen.m.actualBoundingBoxAscent;
  ctx.fillText(text,x,y);ctx.restore();return {text,size:chosen.n};
}

function chart(ctx,row,api,x,y,width,color){
  const visible=api.displayChart(row.chart),points=api.lineCoordinates(visible,width,5.5),months=api.monthLayout(visible,width);
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,11);ctx.clip();ctx.translate(x,y);
  for(const line of months.lines){ctx.beginPath();ctx.moveTo(line.x,.5);ctx.lineTo(line.x,5);ctx.strokeStyle='rgba(255,255,255,.20)';ctx.lineWidth=.45;ctx.stroke();}
  if(points.length>=2){
    const g=ctx.createLinearGradient(0,0,0,5.5);g.addColorStop(0,color+'3D');g.addColorStop(1,color+'00');
    ctx.beginPath();ctx.moveTo(points[0].x,5.5);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(points.at(-1).x,5.5);ctx.closePath();ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=.7;ctx.stroke();
  }else fitText(ctx,'—',{x:0,y:0,width,height:5.5},{size:5,min:4,color});
  for(const label of months.labels)fitText(ctx,label.text,{x:label.x,y:6,width:14,height:5},{size:5,min:4,color});
  ctx.restore();
}

export function drawPopular(ctx,size,model,images){
  const {width,height}=size,wide=model.family!=='small',large=model.family==='large';
  ctx.save();ctx.fillStyle='#1E1E1E';ctx.fillRect(0,0,width,height);
  if(images.background)ctx.drawImage({image:images.background},0,0,width,height);
  // 146pt columns, 12pt gap, 6pt side padding: exactly the original layout budget.
  const logicalWidth=wide?304:146,scale=Math.min(1,(width-12)/logicalWidth,(height-(large?62:8))/146);
  ctx.translate((width-logicalWidth*scale)/2,(height-146*scale)/2);ctx.scale(scale,scale);
  if(large){fitText(ctx,'Popular · '+model.status.label,{x:0,y:-32,width:304,height:18},{size:11,min:8,bold:true,ellipsis:true});
    fitText(ctx,'D/D diário · S/S semanal · M/M mensal · pp: taxa',{x:0,y:155,width:304,height:14},{size:8,min:6,color:'#96969C'});}
  const colors={up:'#30C795',down:'#FF5967',neutral:'#96969C'};
  // Reserve is measured from a fixed reference, so quotes never move the chart edge.
  ctx.font={name:'SFProText-Semibold',size:17.5};
  const reserve=Math.min(45,Math.max(32,ctx.measureText('4,99').width)),graphWidth=Math.max(64,Math.floor(116-1-reserve-3));
  const count=wide?8:4;
  for(let i=0;i<count;i++){
    const row=model.rows[i];if(!row)continue;
    const x=Math.floor(i/4)*158,y=(i%4)*(36+2/3),detail=x+30;
    const color=row.movement>0?colors.up:row.movement<0?colors.down:colors.neutral;
    ctx.save();ctx.beginPath();ctx.ellipse(x+13,y+18,13,13,0,0,Math.PI*2,false);ctx.clip();
    if(['SOJA_JATAI_GO','CUB_GO','IPCA','DIESEL_S10'].includes(row.asset.code)){ctx.save();ctx.translate(x,y+5);drawBadge(ctx,row.asset.code);ctx.restore();}
    else if(images[row.asset.code])ctx.drawImage({image:images[row.asset.code]},x,y+5,26,26);
    else {ctx.fillStyle='#36363A';ctx.fillRect(x,y+5,26,26);fitText(ctx,({SELIC:'%',SOJA_JATAI_GO:'🌱',CUB_GO:'CUB',IPCA:'IPCA',DIESEL_S10:'S10',BRENT:'BRENT','USD/BRL':'$'})[row.asset.code]||'—',{x,y:y+5,width:26,height:26},{size:9,min:6,bold:true,align:'center'});}
    ctx.restore();
    fitText(ctx,row.name,{x:detail,y,width:116-reserve-4,height:17},{size:10,min:7,bold:true,ellipsis:true});
    fitText(ctx,row.price,{x:detail+64,y,width:52,height:17},{size:17.5,min:8.5,bold:true,align:'right'});
    chart(ctx,row,model.api,detail,y+17,graphWidth,color);
    fitText(ctx,row.percent,{x:detail+graphWidth+3,y:y+17,width:116-graphWidth-3,height:11},{size:10.5,min:7.5,bold:true,color,align:'right'});
    fitText(ctx,row.unit,{x:detail,y:y+28,width:64,height:8},{size:6,min:5,color:colors.neutral,ellipsis:true});
    fitText(ctx,row.time,{x:detail+68,y:y+28,width:48,height:8},{size:7.5,min:6,color:colors.neutral,align:'right'});
    if(i%4<3){ctx.fillStyle='rgba(255,255,255,.13)';ctx.fillRect(x,y+36,146,2/3);}
  }
  ctx.restore();
}
