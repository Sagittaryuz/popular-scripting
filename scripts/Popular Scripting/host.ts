import { readPriceSprites, inflateZlib } from './png'
import { isPrivateMarketEndpoint, PRIVATE_MARKET_ENDPOINT, readPrivateMarketToken } from './private-market'

// Remove only the legacy credential owned by this script, never global app settings.
export function removeLegacyAccess(){try{Keychain.remove('popular-github-read-token')}catch{}}
const prefix='popular-engine:'
export function files(){
  const key=(p:string)=>prefix+p
  return {
    documentsDirectory:()=>'/popular',joinPath:(a:string,b:string)=>a+'/'+b,
    fileExists:(p:string)=>Storage.contains(key(p)),
    createDirectory:(p:string)=>Storage.set(key(p),'directory'),
    readString:(p:string)=>{const s=Storage.get<string>(key(p));if(s==null)throw Error('Cache ausente');return s},
    writeString:(p:string,s:string)=>{if(!Storage.set(key(p),s))throw Error('Falha ao salvar cache')},
  }
}

export function allowedURL(value:string){
  const u=new URL(value)
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Destino não autorizado')
  const hosts=['investidor10.com.br','api.bcb.gov.br','economia.awesomeapi.com.br','www.agrolink.com.br','fred.stlouisfed.org','api.kraken.com','brapi.dev','icons.brapi.dev']
  if(isPrivateMarketEndpoint(value))return u
  const github=u.hostname==='raw.githubusercontent.com'&&u.pathname==='/Sagittaryuz/popular-scripting/main/data/economic-series.json'
  if(!hosts.includes(u.hostname)&&!github)throw Error('Destino não autorizado')
  return u
}

export async function within<T>(task:Promise<T>,ms:number):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined
  try{return await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Tempo de consulta excedido')),ms)})])}
  finally{if(timer!==undefined)clearTimeout(timer)}
}

export function createHost(foreground=false){
  const deadline=Date.now()+(foreground?20000:8000)
  const pending=new Map<string,Promise<{value:any;response:any}>>()
  class EngineRequest {
    method='GET';headers:Record<string,string>={};body?:string;timeoutInterval=3;response?:{statusCode:number}
    constructor(public url:string){}
    async run(binary=false){
      const key=JSON.stringify([this.url,this.method,this.headers,this.body,binary])
      let shared=pending.get(key)
      if(!shared){
        shared=this.download(binary).then(value=>({value,response:this.response}))
        pending.set(key,shared)
        shared.then(()=>pending.delete(key),()=>pending.delete(key))
      }
      const result=await shared
      this.response=result.response
      return result.value
    }
    async download(binary=false){
      const url=allowedURL(this.url),remaining=deadline-Date.now()
      if(remaining<=0)throw Error('Orçamento de rede encerrado')
      const hasAuthorization=Object.keys(this.headers).some(k=>k.toLowerCase()==='authorization')
      const hasOtherCredential=Object.keys(this.headers).some(k=>['cookie','proxy-authorization'].includes(k.toLowerCase()))
      if(hasOtherCredential||hasAuthorization&&!isPrivateMarketEndpoint(url.href))throw Error('Acesso autenticado permitido somente ao endpoint privado')
      if(!['GET','POST'].includes(this.method)||this.method==='POST'&&(url.hostname!=='www.agrolink.com.br'||url.pathname!=='/cotacoes/graos/soja'))throw Error('Método não autorizado')
      const timeout=Math.max(.05,Math.min(foreground?6:3,this.timeoutInterval,remaining/1000))
      const result=await within((async()=>{
        const res=await fetch(this.url,{method:this.method,headers:this.headers,body:this.body,timeout,
          handleRedirect:async request=>{const next=allowedURL(request.url);return next.origin===url.origin?request:null}})
        this.response={statusCode:res.status}
        if(!res.ok)throw Error('HTTP '+res.status)
        if(binary){const data=Data.fromArrayBuffer(await res.arrayBuffer());if(!data||data.size>2000000)throw Error('Resposta inválida');return data}
        const text=await res.text();if(text.length>2000000)throw Error('Resposta excessiva');return text
      })(),Math.ceil(timeout*1000))
      return result
    }
    async loadString(){return this.run(false) as Promise<string>}
    async loadJSON(){return JSON.parse(await this.loadString())}
    async load(){return this.run(true) as Promise<Data>}
  }
  const inflate=(bytes:Uint8Array,expected:number)=>{
    // Apple Compression implementations may use a raw DEFLATE stream for zlib.
    for(const candidate of [bytes,bytes.slice(2,-4)])try{
      const data=Data.fromUint8Array(candidate)?.decompressed('zlib').toUint8Array()
      if(data?.length===expected)return data
    }catch{}
    return inflateZlib(bytes,expected)
  }
  return {FileManager:{local:files},Request:EngineRequest,Data,Timer:undefined,
    privateMarket:{endpoint:PRIVATE_MARKET_ENDPOINT,readToken:readPrivateMarketToken},
    readSprites:(quotes:any,sprites:any,decode:any,glyphs:any)=>readPriceSprites(quotes,sprites,decode,glyphs,inflate)}
}
