// @ts-nocheck
// Small bounded PNG decoder for AgroLink price sprites. No WebView is needed.
// Supports non-interlaced 8-bit RGB/RGBA/gray/gray-alpha and indexed 1/2/4/8-bit PNG.
export function decodePNG(bytes,inflate) {
  const fail=()=>{throw Error('PNG AgroLink inválido ou não suportado');};
  if(!bytes||bytes.length<33||bytes.length>2000000||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))fail();
  const u32=p=>bytes[p]*16777216+(bytes[p+1]<<16)+(bytes[p+2]<<8)+bytes[p+3];
  let w,h,depth,type,palette,alpha,parts=[],total=0,ended=false;
  for(let p=8;p+12<=bytes.length;){
    const n=u32(p),tag=String.fromCharCode(...bytes.slice(p+4,p+8));
    if(n>2000000||p+12+n>bytes.length)fail();
    const data=bytes.slice(p+8,p+8+n);
    if(tag==='IHDR'){
      if(w||n!==13)fail();w=u32(p+8);h=u32(p+12);depth=data[8];type=data[9];
      if(!w||!h||w*h>2000000||data[10]||data[11]||data[12])fail();
    }else if(tag==='PLTE')palette=data;
    else if(tag==='tRNS')alpha=data;
    else if(tag==='IDAT'){parts.push(data);total+=n;}
    else if(tag==='IEND'){ended=true;break;}
    p+=12+n;
  }
  const channels=({0:1,2:3,3:1,4:2,6:4})[type];
  if(!ended||!channels||!w||(type===3?![1,2,4,8].includes(depth):depth!==8)||(type===3&&!palette))fail();
  const compressed=new Uint8Array(total);let offset=0;
  for(const part of parts){compressed.set(part,offset);offset+=part.length;}
  const stride=Math.ceil(w*channels*depth/8),bpp=Math.max(1,Math.ceil(channels*depth/8));
  const raw=inflate(compressed,(stride+1)*h);
  if(!raw||raw.length!==(stride+1)*h)fail();
  const scan=new Uint8Array(stride*h),pixels=new Uint8Array(w*h*4);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<h;y++){
    const filter=raw[y*(stride+1)];if(filter>4)fail();
    for(let x=0;x<stride;x++){
      const a=x>=bpp?scan[y*stride+x-bpp]:0,b=y?scan[(y-1)*stride+x]:0,c=y&&x>=bpp?scan[(y-1)*stride+x-bpp]:0;
      scan[y*stride+x]=(raw[y*(stride+1)+1+x]+([0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]))&255;
    }
    for(let x=0;x<w;x++){
      const dest=(y*w+x)*4,src=y*stride+x*channels;
      let r,g,b,a=255;
      if(type===3){const bit=x*depth,index=(scan[y*stride+(bit>>3)]>>(8-depth-bit%8))&((1<<depth)-1);if(index*3+2>=palette.length)fail();r=palette[index*3];g=palette[index*3+1];b=palette[index*3+2];a=alpha?.[index]??255;}
      else if(type===0||type===4){r=g=b=scan[src];if(type===4)a=scan[src+1];else if(alpha&&r===alpha[1])a=0;}
      else {r=scan[src];g=scan[src+1];b=scan[src+2];if(type===6)a=scan[src+3];else if(alpha&&r===alpha[1]&&g===alpha[3]&&b===alpha[5])a=0;}
      pixels.set([r,g,b,a],dest);
    }
  }
  return {width:w,height:h,pixels};
}

export function readPriceSprites(quotes,sprites,decode,glyphs,inflate) {
  const images=new Map([...sprites].map(([url,data])=>[url,decodePNG(data.toUint8Array(),inflate)]));
  return quotes.map(q=>{
    const image=images.get(q.url);
    if(!image||!Number.isInteger(q.x)||!Number.isInteger(q.y)||q.x<0||q.y<0||q.x+48>image.width||q.y+17>image.height)throw Error('Preço fora do sprite');
    const pixels=new Uint8Array(48*17*4);
    for(let y=0;y<17;y++)pixels.set(image.pixels.slice(((q.y+y)*image.width+q.x)*4,((q.y+y)*image.width+q.x+48)*4),y*48*4);
    return {...q,...decode(pixels,48,17,glyphs)};
  });
}
