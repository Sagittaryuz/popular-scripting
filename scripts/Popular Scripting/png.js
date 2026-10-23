// @ts-nocheck
// Small bounded PNG decoder for AgroLink price sprites. No WebView is needed.
// Supports non-interlaced 8-bit RGB/RGBA/gray/gray-alpha and indexed 1/2/4/8-bit PNG.
// Bounded RFC 1950/1951 decoder, independent of the native Compression bridge.
export function inflateZlib(bytes,expected){
  const fail=()=>{throw Error('Fluxo zlib AgroLink inválido');};
  if(!Number.isInteger(expected)||expected<1||expected>10000000||bytes.length<6||bytes.length>2000000)fail();
  if((bytes[0]&15)!==8||(bytes[0]>>4)>7||((bytes[0]<<8)+bytes[1])%31||(bytes[1]&32))fail();
  let bit=16,used=0;const end=(bytes.length-4)*8,out=new Uint8Array(expected);
  const read=n=>{if(bit+n>end)fail();let v=0;for(let i=0;i<n;i++,bit++)v|=((bytes[bit>>3]>>(bit&7))&1)<<i;return v;};
  const tree=lengths=>{
    const counts=new Uint16Array(16),next=new Uint16Array(16),maps=Array.from({length:16},()=>new Map());
    for(const n of lengths){if(n<0||n>15)fail();if(n)counts[n]++;}
    let code=0;for(let n=1;n<=15;n++){code=(code+counts[n-1])<<1;if(code+counts[n]>1<<n)fail();next[n]=code;}
    lengths.forEach((n,s)=>{if(n){let c=next[n]++,r=0;for(let i=0;i<n;i++){r=(r<<1)|(c&1);c>>=1;}maps[n].set(r,s);}});
    return maps;
  };
  const symbol=t=>{let v=0;for(let n=1;n<=15;n++){v|=read(1)<<(n-1);const s=t[n].get(v);if(s!==undefined)return s;}fail();};
  const put=v=>{if(used>=expected)fail();out[used++]=v;};
  const lb=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  const le=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const db=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  const de=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  let final=0;
  do{
    final=read(1);const type=read(2);
    if(type===0){bit=(bit+7)&~7;const len=read(16),inverse=read(16);if((len^inverse)!==65535)fail();for(let i=0;i<len;i++)put(read(8));continue;}
    if(type===3)fail();let lit,dist;
    if(type===1){lit=tree(Array.from({length:288},(_,i)=>i<144?8:i<256?9:i<280?7:8));dist=tree(Array(32).fill(5));}
    else{
      const nl=read(5)+257,nd=read(5)+1,nc=read(4)+4;if(nl>286)fail();
      // RFC permutation (19 code-length symbols).
      const permutation=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],cl=Array(19).fill(0);
      for(let i=0;i<nc;i++)cl[permutation[i]]=read(3);
      const ct=tree(cl),lengths=[];
      while(lengths.length<nl+nd){const s=symbol(ct);if(s<16)lengths.push(s);else{
        if(s===16&&!lengths.length)fail();const count=s===16?read(2)+3:s===17?read(3)+3:read(7)+11,value=s===16?lengths.at(-1):0;
        if(lengths.length+count>nl+nd)fail();for(let i=0;i<count;i++)lengths.push(value);
      }}
      if(!lengths[256])fail();lit=tree(lengths.slice(0,nl));dist=tree(lengths.slice(nl));
    }
    for(;;){const s=symbol(lit);if(s===256)break;if(s<256){put(s);continue;}if(s<257||s>285)fail();
      const n=lb[s-257]+read(le[s-257]),d=symbol(dist);if(d>29)fail();const distance=db[d]+read(de[d]);if(distance>used)fail();
      for(let i=0;i<n;i++)put(out[used-distance]);
    }
  }while(!final);
  if(used!==expected||Math.ceil(bit/8)!==bytes.length-4)fail();
  let a=1,b=0;for(const v of out){a=(a+v)%65521;b=(b+a)%65521;}
  const checksum=bytes.slice(-4).reduce((v,n)=>v*256+n,0);if(b*65536+a!==checksum)fail();
  return out;
}
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
