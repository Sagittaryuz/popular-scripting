import { Button, Canvas, Circle, HStack, Image, Rectangle, Text, ZStack, Script } from 'scripting'
import { pageRows } from './pagination'
import { assets } from './assets'
import { drawBadge } from './badges'
import { GEOMETRY as G, layout, place, placeInBlock, movementColor, curvePlan, monthBand, drawCurve } from './draw'
import { RefreshAssetsOnTap } from './app_intents'
import { assetMarketStatus } from './market-status'
const images:Record<string,UIImage>={}
const CUB_VARIATION_MIN_SIZE=6.5
const SHORT_CODES:Record<string,string>=Object.freeze({SELIC:'SELIC',IPCA:'IPCA',IBOV:'IBOV','USD/BRL':'USD/BRL',SOJA_JATAI_GO:'SOJAGO',CUB_GO:'CUB-GO',DIESEL_S10:'DIESEL',BRENT:'BRENT'})
function shortCode(row:any){
  const code=row?.asset?.code
  return SHORT_CODES[code]||String(code||'—')
}
function Label({value,plan,x,y,width,height,size,min,bold=false,color='white',right=false,alignment,placeFn=place}:any){
  const positioned=placeFn(plan,x,y,width,height,alignment||(right?'trailing':'leading'))
  return <Text font={size*plan.scale} fontWeight={bold?'semibold':'regular'} foregroundStyle={color}
    lineLimit={1} minScaleFactor={min/size} frame={positioned.frame}
    position={positioned.position}>{value}</Text>
}
function variationMinimumSize(row:any,value:string){
  // CUB-GO keeps its published three-decimal M/M value in the fixed 34 pt box.
  // The lower native floor avoids UIFont ellipsis without changing the box,
  // neighboring labels, or the value itself.
  return row.asset?.code==='CUB_GO'&&String(value).length>6?CUB_VARIATION_MIN_SIZE:7.5
}
export function PopularView({model,width,height}:{model:any;width:number;height:number}){
  for(const [key,value] of Object.entries(assets))if(!images[key]){const image=UIImage.fromBase64String(value as string);if(image)images[key]=image}
  const plan=layout(model.family,width,height)
  // The published widget is a fixed indicator panel. Legacy page state and
  // the old small-widget selection must not replace its first four/eight.
  const page=pageRows(model.rows,model.family,null,0),visibleRows=page.rows
  const label=(key:string,value:string,x:number,y:number,w:number,h:number,size:number,min:number,bold=false,color='white',right=false)=>
    <Label key={key} value={value} plan={plan} x={x} y={y} width={w} height={h} size={size} min={min} bold={bold} color={color} right={right}/>
  const renderNow=Date.now(),statusFor=(row:any)=>assetMarketStatus(row,renderNow)
  return <ZStack alignment="topLeading" frame={{width,height}} clipped widgetBackground="#1E1E1E"
    widgetURL={Script.createRunURLScheme("Meu Painel", { section: "market" })}
    accessibilityLabel={visibleRows.map((r:any)=>{const status=statusFor(r);return `${r.name}, ${r.price}, ${r.percent}, ${r.unit}, ${r.time}. ${status.accessibility}`}).join('. ')}>
    {images.background?<Image image={images.background} resizable renderingMode="original" frame={{width,height}}/>:null}
    {plan.large?label('title','Popular · '+model.status.label,0,-32,304,18,11,8,true):null}
    {visibleRows.map((row:any,i:number)=>{
      const column=Math.floor(i/4),rowIndex=i%4,x=column*(G.column+G.columnGap),y=rowIndex*(G.row+G.gap),detail=G.detail,color=movementColor(row),curve=curvePlan(model.api,row),status=statusFor(row)
      const band=monthBand(curve),custom=['SOJA_JATAI_GO','CUB_GO','IPCA','DIESEL_S10','USD/BRL'].includes(row.asset.code)
      const percentMinimum=variationMinimumSize(row,row.percent)
      const chartAccessibility=curve.status==='unavailable-24h'?' Gráfico 24h indisponível.':''
      const rowPlan={...plan,x:0,y:0},hitHeight=rowIndex<3?G.row+G.gap:G.row,rowFrame={width:G.column*plan.scale,height:hitHeight*plan.scaleY},rowPosition={x:plan.x+(x+G.column/2)*plan.scale,y:plan.y+(y+hitHeight/2)*plan.scaleY}
      const blockLabel=(key:string,value:string,x:number,y:number,w:number,h:number,size:number,min:number,bold=false,color='white',right=false,alignment?:string)=>
        <Label key={key} value={value} plan={rowPlan} x={x} y={y} width={w} height={h} size={size} min={min} bold={bold} color={color} right={right} alignment={alignment} placeFn={placeInBlock}/>
      return <Button key={row.asset.code} intent={RefreshAssetsOnTap(undefined)} buttonStyle="plain"
        accessibilityLabel={`Atualizar indicadores. ${row.name}. ${shortCode(row)}. ${row.price}. ${row.percent}. ${row.unit}. ${row.time}. ${status.accessibility}.${chartAccessibility}`}
        frame={rowFrame} position={rowPosition}>
        <ZStack alignment="topLeading" frame={rowFrame}>
        <HStack key="name-status-line" alignment="center" spacing={2} clipped {...place(rowPlan,0,G.nameTop,G.name,G.nameHeight,'leading')}>
          <Text key="name-text" font={10*plan.scale} fontWeight="semibold" foregroundStyle="white"
            lineLimit={1} minScaleFactor={8/10} frame={{height:G.nameHeight*plan.scaleY,alignment:'leading'}}>{row.name}</Text>
          <Circle key="market-status-dot" fill={status.color} frame={{width:3*plan.scale,height:3*plan.scale}}
            accessibilityLabel={status.accessibility}/>
        </HStack>
        {custom?<Canvas opaque={false} {...place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon)} draw={(ctx,size)=>{ctx.scale(size.width/26,size.height/26);drawBadge(ctx,row.asset.code)}}/>
          :images[row.asset.code]?<Image image={images[row.asset.code]} resizable renderingMode="original" {...place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon)}/>:<Image systemName="chart.line.uptrend.xyaxis" font={10*plan.scale} foregroundStyle="#D1D1D6" background={{style:'#34343A',shape:{type:'circle'}}} {...place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon)}/>}
        {blockLabel('asset-code',shortCode(row),0,G.codeTop,G.code,G.codeHeight,5.5,4.3,false,'#96969C',false,'center')}
        <ZStack key="detail-block" alignment="topLeading" {...place(rowPlan,detail,G.blockTop,G.blockWidth,G.blockHeight)}>
        {blockLabel('price',row.price,G.priceX,G.line1Top,G.price,G.top,17.5,8.5,true,'white',true)}
        <Canvas opaque={false} {...placeInBlock(rowPlan,0,G.graphTop,G.graph,G.graphHeight)} draw={(ctx,size)=>drawCurve(ctx,size,curve,color)}/>
        {!curve.points.length?blockLabel('missing','24h indisponível',0,G.graphTop,G.graph,G.graphHeight,4.5,3.3,false,'#96969C'):null}
        {band.width>0?<ZStack alignment="topLeading" {...placeInBlock(rowPlan,band.left,G.monthTop,band.width,5)}>
        <ZStack alignment="topLeading" frame={{width:band.width*plan.scale,height:5*plan.scale}} clipped
          mask={<Rectangle fill="white" frame={{width:band.width*plan.scale,height:5*plan.scale}}/>}>
          {band.labels.map((month:any,j:number)=><Text key={'month-'+j} font={5*plan.scale} foregroundStyle={color}
            lineLimit={1} minScaleFactor={.8} frame={{width:14*plan.scale,height:5*plan.scale,alignment:'leading'}}
            position={{x:(month.x+7)*plan.scale,y:2.5*plan.scale}}>{month.text}</Text>)}
          </ZStack></ZStack>:null}
        {blockLabel('percent',row.percent,G.percentX,G.line2Top,G.percent,G.middle,10.5,percentMinimum,true,color,true)}
        {blockLabel('unit',row.unit,0,G.line3Top,G.unit,G.bottom,6,5,false,'#96969C')}
        {blockLabel('time',row.time,G.timeX,G.line3Top,G.time,G.bottom,7.5,6,false,'#96969C',true)}
        </ZStack>
        {rowIndex<3?<Rectangle fill="rgba(255,255,255,0.13)" {...place(rowPlan,0,G.row,G.column,G.gap)}/>:null}
        </ZStack>
      </Button>
    })}
    {plan.large?label('foot','D/D diário · S/S semanal · M/M mensal · pp: taxa',0,155,304,14,8,6,false,'#96969C'):null}
  </ZStack>
}
