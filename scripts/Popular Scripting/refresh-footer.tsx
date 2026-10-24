import { Button, Canvas, HStack, Image, Text, ZStack } from 'scripting'

export const FOOTER_SPACE=36
export function footerLayout(width:number,height:number){
  const w=Math.min(210,width-28),h=26
  return {width:w,height:h,x:width/2,y:height-4-h/2,top:height-4-h}
}
export function footerLabel(value:string|number){
  const date=new Date(value)
  if(!Number.isFinite(date.getTime()))return '--:--h | --/--'
  const pad=(n:number)=>String(n).padStart(2,'0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}h | ${pad(date.getDate())}/${pad(date.getMonth()+1)}`
}
export function drawRefreshTrapezoid(ctx:any,size:{width:number;height:number}){
  const inset=12*size.width/210
  ctx.beginPath();ctx.moveTo(inset,0);ctx.lineTo(size.width-inset,0)
  ctx.lineTo(size.width,size.height);ctx.lineTo(0,size.height);ctx.closePath()
  ctx.fillStyle='#B3262E';ctx.fill()
}
export function RefreshFooter({width,height,at,intent,label}:{width:number;height:number;at:string|number;intent:any;label:string}){
  const box=footerLayout(width,height),stamp=footerLabel(at)
  return <Button intent={intent} buttonStyle="plain" accessibilityLabel={`${label}. ${stamp}`}
    frame={{width:box.width,height:box.height}} position={{x:box.x,y:box.y}}>
    <ZStack frame={{width:box.width,height:box.height}}>
      <Canvas opaque={false} frame={{width:box.width,height:box.height}} draw={drawRefreshTrapezoid}/>
      <HStack spacing={6}>
        <Text font={11} fontWeight="semibold" monospacedDigit foregroundStyle="#D1D1D6" lineLimit={1}>{stamp}</Text>
        <Image systemName="arrow.clockwise" font={11} foregroundStyle="#D1D1D6"/>
      </HStack>
    </ZStack>
  </Button>
}
