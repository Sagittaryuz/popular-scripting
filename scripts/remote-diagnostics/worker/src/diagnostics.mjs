const STAGES=['start','request','response','validate','cache','render','complete'];
const ASSETS=['IBOV','DOW','USD','BRENT'];
const CODES=['ok','network','timeout','http','parse','invalid-symbol','invalid-currency','invalid-interval','future-timestamp','stale','no-points','partial-window','cache-miss','cache-used','clock-adjusted','unavailable'];
const CACHE=['none','hit','miss','stale','written'];
export const DIAGNOSTIC_TTL=7*86400000;
const MAX_BYTES=16384,MAX_BATCHES=64,MIN_INTERVAL=300000;
const integer=(v,min,max)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function sanitizeBatch(raw){
 if(!record(raw)||raw.schema!==1||typeof raw.version!=='string'||!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(raw.version)||typeof raw.engineVersion!=='string'||!/^\d{4}\.\d{2}\.\d{2}\.\d{1,4}$/.test(raw.engineVersion)||!Array.isArray(raw.events)||raw.events.length<1||raw.events.length>32)return null;
 const events=[];
 for(const rawEvent of raw.events){
  if(!record(rawEvent)||!STAGES.includes(rawEvent.stage)||!integer(rawEvent.at,1577836800000,4102444800000))return null;
  const e={stage:rawEvent.stage,at:rawEvent.at};
  if(ASSETS.includes(rawEvent.asset))e.asset=rawEvent.asset;
  if(CODES.includes(rawEvent.code))e.code=rawEvent.code;
  if(CACHE.includes(rawEvent.cache))e.cache=rawEvent.cache;
  for(const [key,min,max] of [['httpStatus',100,599],['pointCount',0,10000],['sourceAt',1577836800000,4102444800000],['receivedAt',1577836800000,4102444800000],['clockOffsetSeconds',-300,300]])if(integer(rawEvent[key],min,max))e[key]=rawEvent[key];
  events.push(e);
 }
 return {schema:1,version:raw.version,engineVersion:raw.engineVersion,events};
}
const reply=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff',...headers}});
export function initDiagnostics(sql){sql.exec('CREATE TABLE IF NOT EXISTS diagnostics (id INTEGER PRIMARY KEY AUTOINCREMENT, received_at INTEGER NOT NULL, fingerprint TEXT NOT NULL UNIQUE, payload TEXT NOT NULL)')}
export function pruneDiagnostics(sql,now){sql.exec('DELETE FROM diagnostics WHERE received_at < ?',now-DIAGNOSTIC_TTL)}
export async function diagnosticAlarm(ctx,now){
 const sql=ctx.storage.sql;pruneDiagnostics(sql,now);
 const rows=sql.exec('SELECT MIN(received_at) AS oldest FROM diagnostics').toArray();
 if(rows[0]?.oldest!=null)await ctx.storage.setAlarm(Math.max(now+1000,rows[0].oldest+DIAGNOSTIC_TTL+1));
}
export async function handleDiagnostics(request,ctx,now){
 const sql=ctx.storage.sql;
 if(request.method!=='POST')return reply({code:'method'},405);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return reply({code:'content-type'},415);
 if(Number(request.headers.get('content-length'))>MAX_BYTES)return reply({code:'too-large'},413);
 if(!request.body)return reply({code:'invalid-batch'},400);
 const reader=request.body.getReader(),chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return reply({code:'too-large'},413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 let batch;try{batch=sanitizeBatch(JSON.parse(new TextDecoder().decode(bytes)))}catch{}
 if(!batch)return reply({code:'invalid-batch'},400);
 // A synchronous transaction after body parsing prevents concurrent-request bypass.
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(batch))))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const accepted=ctx.storage.transactionSync(()=>{
  const duplicate=sql.exec('SELECT id FROM diagnostics WHERE fingerprint = ? AND received_at >= ?',fingerprint,now-DIAGNOSTIC_TTL).toArray()[0];
  if(duplicate)return 'duplicate';
  const previous=sql.exec('SELECT received_at FROM diagnostics ORDER BY id DESC LIMIT 1').toArray()[0];
  if(previous&&now-previous.received_at<MIN_INTERVAL)return false;
  pruneDiagnostics(sql,now);
  sql.exec('INSERT INTO diagnostics (received_at, fingerprint, payload) VALUES (?, ?, ?)',now,fingerprint,JSON.stringify(batch));
  sql.exec('DELETE FROM diagnostics WHERE id NOT IN (SELECT id FROM diagnostics ORDER BY id DESC LIMIT ?)',MAX_BATCHES);
  return true;
 });
 if(!accepted)return reply({code:'rate-limited'},429,{'retry-after':'300'});
 await diagnosticAlarm(ctx,now);
 return reply({code:'accepted'},202);
}
