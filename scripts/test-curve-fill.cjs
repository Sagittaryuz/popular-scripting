const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas'),{bundle}=require('./test-trading-host.cjs');
const draw=bundle('draw.js');
function raster(y,color,scale=4){
 const canvas=createCanvas(32*scale,26*scale),ctx=canvas.getContext('2d');ctx.scale(scale,scale);
 const points=[{x:0,y},{x:32,y}],plan={width:32,points,months:{lines:[]},strips:draw.curveRelativeStrips(points)};
 draw.drawCurve(ctx,{width:32,height:26},plan,color);
 const px=(x,y)=>Array.from(ctx.getImageData(Math.floor(x*scale),Math.floor(y*scale),1,1).data);
 return {canvas,px};
}
for(const scale of [2,3,4]){
 for(const y of [3,15,21]){
  const red=raster(y,'#FF1744',scale),green=raster(y,'#00E676',scale),depth=26-y;
  const a=red.px(16,y+depth*.35),b=green.px(16,y+depth*.35);
  assert(a[3]>=40,'red fill must remain visible below a low curve');
  assert(Math.abs(a[3]-b[3])<=1,'positive and negative curves have identical opacity');
  assert(a[0]>a[1]&&b[1]>b[0],'fill uses correct movement color');
  assert(red.px(16,y+depth*.25)[3]>red.px(16,y+depth*.8)[3],'fill fades toward baseline');
  assert.equal(red.px(16,Math.max(0,y-2))[3],0,'no color above the curve');
 }
}
assert.equal(draw.curveRelativeStrips([]).length,0);assert.equal(draw.curveRelativeStrips([{x:0,y:0}]).length,0);
console.log('PASS red/green curve-relative fill, shallow/deep geometry, 2x/3x/4x raster, fade and empty input');
