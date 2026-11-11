/** Closed diagnostic schema, enforced before local persistence and transmission.
 * The private collector independently applies the same allowlist.
 */
const STAGES=['start','request','response','validate','cache','render','complete'] as const
const ASSETS=['IBOV','DOW','USD','BRENT'] as const
const CODES=['ok','network','timeout','http','parse','invalid-symbol','invalid-currency','invalid-interval','future-timestamp','stale','no-points','partial-window','cache-miss','cache-used','clock-adjusted','unavailable'] as const
const CACHE=['none','hit','miss','stale','written'] as const
export type DiagnosticEvent={
  stage:typeof STAGES[number];at:number;asset?:typeof ASSETS[number];
  code?:typeof CODES[number];cache?:typeof CACHE[number];httpStatus?:number;
  pointCount?:number;sourceAt?:number;receivedAt?:number;clockOffsetSeconds?:number;
}
export type DiagnosticBatch={schema:1;version:string;engineVersion:string;events:DiagnosticEvent[]}
const MAX_EVENTS=32
const MIN_TIME=1577836800000,MAX_TIME=4102444800000
function record(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value)}
function member<T extends string>(value:unknown,items:readonly T[]):value is T{return typeof value==='string'&&items.includes(value as T)}
function integer(value:unknown,min:number,max:number):value is number{return typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max}
/** Rebuild the object field by field. Never copy arbitrary fields/messages. */
export function sanitizeDiagnosticEvent(value:unknown):DiagnosticEvent|null{
  if(!record(value)||!member(value.stage,STAGES)||!integer(value.at,MIN_TIME,MAX_TIME))return null
  const out:DiagnosticEvent={stage:value.stage,at:value.at}
  if(member(value.asset,ASSETS))out.asset=value.asset
  if(member(value.code,CODES))out.code=value.code
  if(member(value.cache,CACHE))out.cache=value.cache
  if(integer(value.httpStatus,100,599))out.httpStatus=value.httpStatus
  if(integer(value.pointCount,0,10000))out.pointCount=value.pointCount
  if(integer(value.sourceAt,MIN_TIME,MAX_TIME))out.sourceAt=value.sourceAt
  if(integer(value.receivedAt,MIN_TIME,MAX_TIME))out.receivedAt=value.receivedAt
  if(integer(value.clockOffsetSeconds,-300,300))out.clockOffsetSeconds=value.clockOffsetSeconds
  return out
}
/** The fixed version syntax prevents free text/secret-bearing metadata. */
export function sanitizeDiagnosticBatch(value:unknown):DiagnosticBatch|null{
  if(!record(value)||value.schema!==1||typeof value.version!=='string'||!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value.version)||
     typeof value.engineVersion!=='string'||!/^\d{4}\.\d{2}\.\d{2}\.\d{1,4}$/.test(value.engineVersion)||!Array.isArray(value.events)||value.events.length>MAX_EVENTS)return null
  const events:DiagnosticEvent[]=[]
  for(const raw of value.events){const event=sanitizeDiagnosticEvent(raw);if(!event)return null;events.push(event)}
  return {schema:1,version:value.version,engineVersion:value.engineVersion,events}
}
