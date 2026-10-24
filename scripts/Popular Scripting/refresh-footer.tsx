import { Button, Canvas, HStack, Image, Text, ZStack } from 'scripting'

export const FOOTER_SPACE=23
export function footerLayout(width:number,height:number){
  const w=Math.min(210,width-28),h=13
  return {width:w,height:h,x:width/2,y:height-4-h/2,top:height-4-h}
}
export function footerLabel(value:string|number){
  const date=new Date(value)
  if(!Number.isFinite(date.getTime()))return '--:--h | --/--'
  const pad=(n:number)=>String(n).padStart(2,'0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}h | ${pad(date.getDate())}/${pad(date.getMonth()+1)}`
}
export function drawRefreshTrapezoid(ctx:any,size:{width:number;height:number}){
  const w=size.width,h=size.height,inset=12*w/210,r=3
  const vertices=[[inset,0],[w-inset,0],[w,h],[0,h]]
  const edge=(a:number[],b:number[],distance:number)=>{
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),t=Math.min(distance,length/3)/length
    return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
  }
  ctx.save();ctx.beginPath()
  vertices.forEach((point,i)=>{
    const before=edge(point,vertices[(i+3)%4],r),after=edge(point,vertices[(i+1)%4],r)
    if(i===0)ctx.moveTo(...before);else ctx.lineTo(...before)
    ctx.quadraticCurveTo(point[0],point[1],after[0],after[1])
  })
  ctx.closePath();ctx.clip()
  // Explicit color strips avoid depending on native gradient-object support.
  paintFooterGradient(ctx,size,0,17)
  ctx.restore()
}
export function footerGradientColor(progress:number){
  const top=[155,43,55],bottom=[82,23,32],t=Math.max(0,Math.min(1,progress))
  return `rgb(${top.map((v,j)=>Math.round(v+(bottom[j]-v)*t)).join(',')})`
}
function paintFooterGradient(ctx:any,size:{width:number;height:number},offset:number,total:number){
  const steps=Math.max(8,Math.ceil(size.height*2))
  for(let i=0;i<steps;i++){
    const y=i*size.height/steps
    ctx.fillStyle=footerGradientColor((offset+y)/total)
    ctx.fillRect(0,y,size.width,size.height/steps+0.1)
  }
}
export function drawRefreshBase(ctx:any,size:{width:number;height:number}){
  paintFooterGradient(ctx,size,13,17)
}
export function RefreshFooter({width,height,at,intent,label}:{width:number;height:number;at:string|number;intent:any;label:string}){
  const box=footerLayout(width,height),stamp=footerLabel(at)
  return <ZStack alignment="topLeading" frame={{width,height}}>
    <Canvas opaque={false} frame={{width,height:4}} position={{x:width/2,y:height-2}} draw={drawRefreshBase}/>
    <Button intent={intent} buttonStyle="plain" accessibilityLabel={`${label}. ${stamp}`}
    frame={{width:box.width,height:box.height}} position={{x:box.x,y:box.y}}>
    <ZStack frame={{width:box.width,height:box.height}}>
      <Canvas opaque={false} frame={{width:box.width,height:box.height}} draw={drawRefreshTrapezoid}/>
      <HStack spacing={4}>
        <Text font={8.5} fontWeight="medium" monospacedDigit foregroundStyle="#D1D1D6" lineLimit={1}>{stamp}</Text>
        <Image systemName="arrow.clockwise" font={8.5} foregroundStyle="#D1D1D6"/>
      </HStack>
    </ZStack>
    </Button>
  </ZStack>
}
