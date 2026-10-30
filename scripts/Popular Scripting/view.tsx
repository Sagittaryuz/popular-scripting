import { Button, Canvas, Circle, HStack, Image, Rectangle, SVG, Text, ZStack, Script } from 'scripting'
import { pageRows } from './pagination'
import { assets } from './assets'
import { drawBadge } from './badges'
import { GEOMETRY as G, layout, place, placeInBlock, movementColor, curvePlan, monthBand, drawCurve } from './draw'
import { RefreshAssetsOnTap } from './app_intents'
import { assetMarketStatus } from './market-status'
const images:Record<string,UIImage|null|undefined>={}
const CUB_VARIATION_MIN_SIZE=4.2
const NAME_FONT_MIN=3.6
const NAME_WIDTH_SAFETY=1.12
const SHORT_CODES:Record<string,string>=Object.freeze({SELIC:'SELIC',IPCA:'IPCA',IBOV:'IBOV',BBAS3:'BBAS3',BBDC4:'BBDC4','BTC/USD':'BTC/USD','USD/BRL':'USD/BRL',SOJA_JATAI_GO:'SOJAGO',CUB_GO:'CUB-GO',DIESEL_S10:'DIESEL',BRENT:'BRENT'})
const COMPACT_UNITS:Record<string,string>=Object.freeze({
  SELIC:'% a.a.',IPCA:'M/M · pp',IBOV:'pontos',BBAS3:'BRL/ação',BBDC4:'BRL/ação','BTC/USD':'USD/BTC','USD/BRL':'BRL/USD',
  SOJA_JATAI_GO:'R$/sc60',CUB_GO:'R$/m²',DIESEL_S10:'R$/L',BRENT:'USD/bbl'
})
function shortCode(row:any){
  const code=row?.asset?.code
  return SHORT_CODES[code]||String(code||'—')
}
function observationDate(value:any){
  const text=String(value??'—').trim()
  if(!text||text==='—')return '—'
  const date=text.match(/\b\d{2}\/\d{2}(?:\/\d{2,4})?\b/)
  if(date)return date[0]
  const time=text.match(/\b\d{1,2}:\d{2}\b/)
  return time?time[0]:text.slice(0,10)
}
function compactUnit(row:any){
  const code=row?.asset?.code
  return COMPACT_UNITS[code]||String(row?.unit||'—').replace(/\s+/g,' ').slice(0,12)
}
function nameLayout(value:any){
  const text=String(value??'—')
  const raw=[...text].reduce((sum,char)=>sum+(/[MW@#]/.test(char)?6.2:/[ilI1.,' ]/.test(char)?2.8:4.8),0)
  // Keep the status dot in its reserved slot. The native font metrics are
  // wider than the compact estimate for names such as Banco do Brasil, so a
  // conservative width factor plus a lower floor prevents native truncation.
  const maximum=Math.max(5,G.nameTextMax),font=Math.max(NAME_FONT_MIN,Math.min(9,9*maximum/Math.max(raw*NAME_WIDTH_SAFETY,1))),width=Math.min(maximum,Math.max(5,raw*font/9))
  return {font,width}
}
function Label({labelKey,value,plan,x,y,width,height,size,min,bold=false,color='white',right=false,alignment,placeFn=place}:any){
  const positioned=placeFn(plan,x,y,width,height,alignment||(right?'trailing':'leading'))
  return <Text key={labelKey} font={size*plan.scale} fontWeight={bold?'semibold':'regular'} foregroundStyle={color}
    lineLimit={1} minScaleFactor={min/size} frame={positioned.frame}
    position={positioned.position}>{value}</Text>
}
function variationMinimumSize(row:any,value:string){
  // The fixed quote column is intentionally narrow. A lower native floor keeps
  // CUB-GO's published three-decimal M/M value visible without changing data.
  return row.asset?.code==='CUB_GO'&&String(value).length>6?CUB_VARIATION_MIN_SIZE:4.2
}
function apiImage(row:any){
  const data=row?.asset?.iconData
  if(typeof data!=='string'||data.length<50)return null
  const key='api-icon:'+String(row.asset.code||'')+':'+data.length+':'+data.slice(0,16)
  if(!(key in images))try{images[key]=UIImage.fromBase64String(data)||null}catch{images[key]=null}
  return images[key]||null
}
function apiSVG(row:any){
  const value=row?.asset?.iconURL
  if(typeof value!=='string'||!/^https:\/\//.test(value))return null
  try{
    const url=new URL(value)
    // The backend and the Scripting host allow only the API's returned logo
    // host. Do not turn arbitrary HTTPS metadata into a network view.
    return url.protocol==='https:'&&url.hostname.toLowerCase()==='icons.brapi.dev'&&url.pathname.toLowerCase().endsWith('.svg')?url.toString():null
  }catch{return null}
}
const FALLBACK_BADGE_CODES=Object.freeze(['BBAS3','BBDC4','IBOV','BTC/USD','SOJA_JATAI_GO','CUB_GO','IPCA','DIESEL_S10','USD/BRL'])
function fallbackIcon(row:any,plan:any,rowPlan:any,positioned=true){
  const code=row?.asset?.code,placement=positioned?place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon):{frame:{width:G.icon*plan.scale,height:G.icon*plan.scale}}
  if(FALLBACK_BADGE_CODES.includes(code))return <Canvas key="asset-icon" opaque={false} {...placement} draw={(ctx,size)=>{ctx.scale(size.width/26,size.height/26);drawBadge(ctx,code)}}/>
  if(images[code])return <Image key="asset-image" image={images[code]} resizable renderingMode="original" {...placement}/>
  return <Image key="asset-fallback" systemName="chart.line.uptrend.xyaxis" font={10*plan.scale} foregroundStyle="#D1D1D6" background={{style:'#34343A',shape:{type:'circle'}}} {...placement}/>
}
export function PopularView({model,width,height}:{model:any;width:number;height:number}){
  for(const [key,value] of Object.entries(assets))if(!images[key]){const image=UIImage.fromBase64String(value as string);if(image)images[key]=image}
  const plan=layout(model.family,width,height)
  // The published widget is a fixed indicator panel. Legacy page state and
  // the old small-widget selection must not replace its first four/eight.
  const page=pageRows(model.rows,model.family,null,0),visibleRows=page.rows
  const label=(key:string,value:string,x:number,y:number,w:number,h:number,size:number,min:number,bold=false,color='white',right=false)=><Label labelKey={key} value={value} plan={plan} x={x} y={y} width={w} height={h} size={size} min={min} bold={bold} color={color} right={right}/>
  const renderNow=Date.now(),statusFor=(row:any)=>assetMarketStatus(row,renderNow)
  return <ZStack alignment="topLeading" frame={{width,height}} clipped widgetBackground="#1E1E1E"
    widgetURL={Script.createRunURLScheme("Meu Painel", { section: "market" })}
    accessibilityLabel={visibleRows.map((r:any)=>{const status=statusFor(r);return `${r.name}, ${r.price}, ${r.percent}, ${r.unit}, ${r.time}. ${status.accessibility}`}).join('. ')}>
    {images.background?<Image image={images.background} resizable renderingMode="original" frame={{width,height}}/>:null}
    {plan.large?label('title','Popular · '+model.status.label,0,-32,304,18,11,8,true):null}
    {visibleRows.map((row:any,i:number)=>{
      const column=Math.floor(i/4),rowIndex=i%4,x=column*(G.column+G.columnGap),y=rowIndex*(G.row+G.gap),color=movementColor(row),curve=curvePlan(model.api,row),status=statusFor(row)
      const band=monthBand(curve),remoteSvg=apiSVG(row),remoteIcon=remoteSvg?null:apiImage(row)
      const percentMinimum=variationMinimumSize(row,row.percent),meta=`${shortCode(row)} | ${observationDate(row.time)}`,nameMetrics=nameLayout(row.name)
      const chartAccessibility=curve.status==='unavailable-7d'?' Gráfico de 7 dias indisponível':''
      const rowPlan={...plan,x:0,y:0},hitHeight=rowIndex<3?G.row+G.gap:G.row,rowFrame={width:G.column*plan.scale,height:hitHeight*plan.scaleY},rowPosition={x:plan.x+(x+G.column/2)*plan.scale,y:plan.y+(y+hitHeight/2)*plan.scaleY}
      const cellLabel=(key:string,value:string,cx:number,cy:number,w:number,h:number,size:number,min:number,bold=false,cellColor='white',right=false,alignment?:string)=><Label labelKey={key} value={value} plan={rowPlan} x={cx} y={cy} width={w} height={h} size={size} min={min} bold={bold} color={cellColor} right={right} alignment={alignment} placeFn={placeInBlock}/>
      return <Button key={row.asset.code} intent={RefreshAssetsOnTap(undefined)} buttonStyle="plain"
        accessibilityLabel={`Atualizar indicadores. ${row.name}. ${shortCode(row)}. ${row.price}. ${row.percent}. ${row.unit}. ${row.time}. ${status.accessibility}.${chartAccessibility}`}
        frame={rowFrame} position={rowPosition}>
        <ZStack alignment="topLeading" frame={rowFrame}>
        {remoteSvg?<ZStack key="asset-remote-svg-mask" alignment="topLeading" {...place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon)} mask={<Circle fill="white" frame={{width:G.icon*plan.scale,height:G.icon*plan.scale}}/>}>
          {fallbackIcon(row,plan,rowPlan,false)}
          <SVG key="asset-remote-svg" url={remoteSvg} resizable renderingMode="original" frame={{width:G.icon*plan.scale,height:G.icon*plan.scale}}/>
        </ZStack> :remoteIcon?<ZStack key="asset-remote-mask" alignment="topLeading" {...place(rowPlan,G.iconLeft,G.iconTop,G.icon,G.icon)} mask={<Circle fill="white" frame={{width:G.icon*plan.scale,height:G.icon*plan.scale}}/>}>
          <Image key="asset-remote" image={remoteIcon} resizable renderingMode="original" frame={{width:G.icon*plan.scale,height:G.icon*plan.scale}}/>
        </ZStack> :fallbackIcon(row,plan,rowPlan,true)}
        <HStack key="name-status-line" alignment="center" spacing={G.statusSpacing} clipped {...place(rowPlan,G.nameX,G.nameTop,G.name,G.nameHeight,'leading')}>
          <Text key="name-text" font={nameMetrics.font*plan.scale} fontWeight="semibold" foregroundStyle="white"
            lineLimit={1} minScaleFactor={0.72} frame={{width:nameMetrics.width*plan.scale,height:G.nameHeight*plan.scaleY,alignment:'leading'}}>{row.name}</Text>
          <Circle key="market-status-dot" fill={status.color} frame={{width:G.statusDot*plan.scale,height:G.statusDot*plan.scale}}
            accessibilityLabel={status.accessibility}/>
        </HStack>
        {cellLabel('asset-meta',meta,G.dateX,G.dateTop,G.date,G.dateHeight,5.3,3.4,false,'#96969C',false,'leading')}
        <Canvas key="asset-chart" opaque={false} {...placeInBlock(rowPlan,G.graphX,G.graphTop,G.graph,G.graphHeight)} draw={(ctx,size)=>drawCurve(ctx,size,curve,color)}/>
        {!curve.points.length?cellLabel('missing','7d indisponível',G.graphX,G.graphTop,G.graph,G.graphHeight,4.2,3.2,false,'#96969C'):null}
        {band.width>0?<ZStack key="month-band" alignment="topLeading" {...placeInBlock(rowPlan,G.graphX+band.left,G.monthTop,band.width,5)}>
          <ZStack alignment="topLeading" frame={{width:band.width*plan.scale,height:5*plan.scale}} clipped
            mask={<Rectangle fill="white" frame={{width:band.width*plan.scale,height:5*plan.scale}}/>}>
            {band.labels.map((month:any,j:number)=><Text key={'month-'+j} font={5*plan.scale} foregroundStyle={color}
              lineLimit={1} minScaleFactor={.8} frame={{width:14*plan.scale,height:5*plan.scale,alignment:'leading'}}
              position={{x:(month.x+7)*plan.scale,y:2.5*plan.scale}}>{month.text}</Text>)}
          </ZStack>
        </ZStack>:null}
        {cellLabel('price',row.price,G.priceX,G.line1Top,G.price,G.top,12.5,5.2,true,'white',true)}
        {cellLabel('percent',row.percent,G.percentX,G.line2Top,G.percent,G.middle,8.5,percentMinimum,true,color,true)}
        {cellLabel('unit',compactUnit(row),G.unitX,G.line3Top,G.unit,G.bottom,4.4,3.2,false,'#96969C',true)}
        {rowIndex<3?<Rectangle key="divider" fill="rgba(255,255,255,0.13)" {...place(rowPlan,0,G.row,G.column,G.gap)}/>:null}
        </ZStack>
      </Button>
    })}
    {plan.large?label('foot','D/D diário · S/S semanal · M/M mensal · pp: taxa',0,155,304,14,8,6,false,'#96969C'):null}
  </ZStack>
}
