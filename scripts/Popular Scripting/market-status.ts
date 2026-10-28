export type SourceStatusState='fresh'|'cached'|'failed'
export type SourceStatus={state:SourceStatusState;at:number;reason?:string}
export type MarketStatusKind='fresh'|'stale'|'unknown'
export type MarketStatus={kind:MarketStatusKind;color:string;accessibility:string}

// This dot describes the evidence behind the value being displayed. It is not
// a trading-session marker: a successful request may still return a daily or
// monthly observation whose own date is older than the request.
export const SOURCE_STATUS_TTL_MS=5*60*1000
export const MARKET_STATUS_COLORS=Object.freeze({
  fresh:'#30C795',
  stale:'#96969C',
  unknown:'#96969C'
})

function finite(value:any):value is number{return typeof value==='number'&&Number.isFinite(value)}
function validPayload(row:any){
  const asset=row?.asset
  return typeof asset?.code==='string'&&finite(asset.price)&&asset.price>0
}
function validProviderPayload(row:any,at:number){
  return validPayload(row)&&finite(row?.fetchedAt)&&row.fetchedAt>0&&row.fetchedAt<=at
}
function liveVerifiedSnapshot(row:any){
  return row?.archive===true&&row?.cached!==true&&row?.economicValidation?.origin==='github-verified-snapshot'
}
function fallbackRow(row:any){
  return row?.cached===true||(row?.archive===true&&!liveVerifiedSnapshot(row))||row?.catalogCached===true||row?.catalogOnly===true||row?.asset?.catalogCached===true
}

// Called only after the collector has completed its current attempt. A valid
// payload without a fallback marker is the only path to green. A verified
// current Git snapshot is a provider response for the economic series; a
// bundled or historical archive remains gray. An HTTP 200 with an
// invalid/missing payload cannot create a fresh status.
export function sourceStatusForRow(row:any,at=Date.now()):SourceStatus{
  const observedAt=finite(at)&&at>=0?at:Date.now()
  if(validProviderPayload(row,observedAt)&&!fallbackRow(row))return {state:'fresh',at:observedAt,reason:'valid-provider-payload'}
  if(fallbackRow(row))return {state:'cached',at:observedAt,reason:'cache-or-archive-preserved'}
  return {state:'failed',at:observedAt,reason:'missing-or-invalid-payload'}
}

function fresh(row:any,status:SourceStatus,now:number){
  return status.state==='fresh'&&validProviderPayload(row,status.at)&&finite(status.at)&&status.at<=now&&now-status.at<=SOURCE_STATUS_TTL_MS
}

function statusText(kind:MarketStatusKind,reason:string):MarketStatus{
  if(kind==='fresh')return {
    kind,color:MARKET_STATUS_COLORS.fresh,
    accessibility:'Fonte: consulta recente com dados válidos para este ativo; a cor não indica bolsa aberta.'
  }
  if(kind==='stale')return {
    kind,color:MARKET_STATUS_COLORS.stale,
    accessibility:'Fonte: '+reason+'; o valor exibido pode estar preservado em cache. A cor não indica bolsa aberta.'
  }
  return {
    kind,color:MARKET_STATUS_COLORS.unknown,
    accessibility:'Fonte: estado da consulta não confirmado; o valor exibido pode estar em cache. A cor não indica bolsa aberta.'
  }
}

export function assetMarketStatus(row:any,now=Date.now()):MarketStatus{
  const status=row?.sourceStatus as SourceStatus|undefined
  if(status&&fresh(row,status,now))return statusText('fresh','')
  if(status?.state==='cached')return statusText('stale','a consulta usou cache ou arquivo de referência')
  if(status?.state==='failed')return statusText('stale','a consulta falhou, ficou indisponível ou retornou dados inválidos')
  if(status?.state==='fresh')return statusText('stale','a evidência da consulta válida expirou')
  if(fallbackRow(row))return statusText('stale','a linha exibida veio de cache ou arquivo de referência')
  return statusText('unknown','não há evidência recente registrada para esta linha')
}
