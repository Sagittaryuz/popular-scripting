import {sanitizeDiagnosticBatch,DiagnosticBatch} from './schema'
const PATH='/v1/diagnostics',MAX_BYTES=16384,TTL=7*86400000
export type StoredDiagnostic={receivedAt:number;batch:DiagnosticBatch}
/** Wire to the existing singleton Durable Object, keeping appendAndPrune atomic.
 * Auth is mandatory and independent for read/write. Do not accept WIDGET_TOKEN
 * here or configure a credential until authorization and deployment are ready.
 * Adapter must use caller authentication, never an untrusted body identity.
 */
export function createDiagnosticHandler(deps:{
  authorize:(request:Request,scope:'read'|'write')=>Promise<boolean>;
  storage:{appendAndPrune:(row:StoredDiagnostic,cutoff:number,limit:number)=>Promise<void>;readSince:(cutoff:number,limit:number)=>Promise<StoredDiagnostic[]>};
  now?:()=>number;
}){
  const now=deps.now||Date.now
  const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
  return async(request:Request):Promise<Response>=>{
    try{
      const url=new URL(request.url)
      if(url.protocol!=='https:'||url.pathname!==PATH||url.search||url.hash)return reply(404,{code:'not-found'})
      if(request.method!=='GET'&&request.method!=='POST')return reply(405,{code:'method'})
      if(!await deps.authorize(request,request.method==='GET'?'read':'write'))return reply(401,{code:'unauthorized'})
      const time=now()
      if(request.method==='GET'){
        const rows=await deps.storage.readSince(time-TTL,64)
        const safe=rows.filter(r=>Number.isSafeInteger(r.receivedAt)&&r.receivedAt>=time-TTL&&r.receivedAt<=time).slice(-64).flatMap(r=>{const batch=sanitizeDiagnosticBatch(r.batch);return batch?[{receivedAt:r.receivedAt,batch}]:[]})
        return reply(200,{schema:1,records:safe})
      }
      if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply(415,{code:'content-type'})
      const length=Number(request.headers.get('Content-Length'))
      if(length>MAX_BYTES)return reply(413,{code:'too-large'})
      if(!request.body)return reply(400,{code:'invalid-batch'})
      const reader=request.body.getReader();let size=0;const chunks:Uint8Array[]=[]
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return reply(413,{code:'too-large'})}chunks.push(value)}
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
      let raw:unknown;try{raw=JSON.parse(new TextDecoder().decode(bytes))}catch{return reply(400,{code:'invalid-batch'})}
      const batch=sanitizeDiagnosticBatch(raw);if(!batch)return reply(400,{code:'invalid-batch'})
      await deps.storage.appendAndPrune({receivedAt:time,batch},time-TTL,64)
      return reply(202,{code:'accepted'})
    }catch{return reply(503,{code:'unavailable'})}
  }
}
