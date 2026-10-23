import { Canvas } from 'scripting'
import { assets } from './assets'
import { drawPopular } from './draw'
const images:Record<string,UIImage>={}
export function PopularView({model,width,height}:{model:any;width:number;height:number}){
  for(const [key,value] of Object.entries(assets))if(!images[key]){const image=UIImage.fromBase64String(value as string);if(image)images[key]=image}
  return <Canvas frame={{width,height}} clipped widgetBackground="#1E1E1E" widgetURL="scripting://run/Popular%20Scripting"
    accessibilityLabel={model.rows.map((r:any)=>`${r.name}, ${r.price}, ${r.percent}, ${r.unit}, ${r.time}`).join('. ')}
    draw={(ctx,size)=>drawPopular(ctx,size,model,images)}/>
}
