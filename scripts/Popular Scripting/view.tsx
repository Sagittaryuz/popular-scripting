import { Canvas, Image, Rectangle, Text, ZStack } from 'scripting'
import { assets } from './assets'
import { drawBadge } from './badges'
import { GEOMETRY as G, layout, place, movementColor, curvePlan, monthBand, drawCurve } from './draw'
const images:Record<string,UIImage>={}
function Label({value,plan,x,y,width,height,size,min,bold=false,color='white',right=false}:any){
  return <Text font={size*plan.scale} fontWeight={bold?'semibold':'regular'} foregroundStyle={color}
    lineLimit={1} minScaleFactor={min/size} frame={place(plan,x,y,width,height,right?'trailing':'leading').frame}
    position={place(plan,x,y,width,height).position}>{value}</Text>
}
export function PopularView({model,width,height}:{model:any;width:number;height:number}){
  for(const [key,value] of Object.entries(assets))if(!images[key]){const image=UIImage.fromBase64String(value as string);if(image)images[key]=image}
  const plan=layout(model.family,width,height)
  const label=(key:string,value:string,x:number,y:number,w:number,h:number,size:number,min:number,bold=false,color='white',right=false)=>
    <Label key={key} value={value} plan={plan} x={x} y={y} width={w} height={h} size={size} min={min} bold={bold} color={color} right={right}/>
  return <ZStack alignment="topLeading" frame={{width,height}} clipped widgetBackground="#1E1E1E" widgetURL="scripting://run/Popular%20Scripting"
    accessibilityLabel={model.rows.map((r:any)=>`${r.name}, ${r.price}, ${r.percent}, ${r.unit}, ${r.time}`).join('. ')}>
    {images.background?<Image image={images.background} resizable renderingMode="original" frame={{width,height}}/>:null}
    {plan.large?label('title','Popular · '+model.status.label,0,-32,304,18,11,8,true):null}
    {model.rows.slice(0,plan.count).map((row:any,i:number)=>{
      const x=Math.floor(i/4)*158,y=(i%4)*(G.row+G.gap),detail=x+G.detail,color=movementColor(row),curve=curvePlan(model.api,row)
      const band=monthBand(curve),custom=['SOJA_JATAI_GO','CUB_GO','IPCA','DIESEL_S10'].includes(row.asset.code)
      return <ZStack key={row.asset.code} alignment="topLeading" frame={{width,height}}>
        {custom?<Canvas opaque={false} {...place(plan,x,y+5,26,26)} draw={(ctx,size)=>{ctx.scale(size.width/26,size.height/26);drawBadge(ctx,row.asset.code)}}/>
          :images[row.asset.code]?<Image image={images[row.asset.code]} resizable renderingMode="original" {...place(plan,x,y+5,26,26)}/>:null}
        {label('name',row.name,detail,y,64,17,10,8,true)}
        {label('price',row.price,detail+64,y,52,17,17.5,8.5,true,'white',true)}
        <Canvas opaque={false} {...place(plan,detail,y+17,G.graph,5.5)} draw={(ctx,size)=>drawCurve(ctx,size,curve,color)}/>
        {!curve.points.length?label('missing','—',detail,y+17,G.graph,5.5,5,4,false,color):null}
        {band.width>0?<ZStack alignment="topLeading" {...place(plan,detail+band.left,y+23,band.width,5)}>
        <ZStack alignment="topLeading" frame={{width:band.width*plan.scale,height:5*plan.scale}} clipped
          mask={<Rectangle fill="white" frame={{width:band.width*plan.scale,height:5*plan.scale}}/>}>
          {band.labels.map((month:any,j:number)=><Text key={'month-'+j} font={5*plan.scale} foregroundStyle={color}
            lineLimit={1} minScaleFactor={.8} frame={{width:14*plan.scale,height:5*plan.scale,alignment:'leading'}}
            position={{x:(month.x+7)*plan.scale,y:2.5*plan.scale}}>{month.text}</Text>)}
        </ZStack></ZStack>:null}
        {label('percent',row.percent,detail+G.graph+3,y+17,G.percent,11,10.5,7.5,true,color,true)}
        {label('unit',row.unit,detail,y+28,64,8,6,5,false,'#96969C')}
        {label('time',row.time,detail+68,y+28,48,8,7.5,6,false,'#96969C',true)}
        {i%4<3?<Rectangle fill="rgba(255,255,255,0.13)" {...place(plan,x,y+36,146,G.gap)}/>:null}
      </ZStack>
    })}
    {plan.large?label('foot','D/D diário · S/S semanal · M/M mensal · pp: taxa',0,155,304,14,8,6,false,'#96969C'):null}
  </ZStack>
}
