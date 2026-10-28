export type SourceStatusState='fresh'|'cached'|'failed'
export type SourceStatus={state:SourceStatusState;at:number;reason?:string}
export type MarketStatusKind='open'|'closed'|'notApplicable'|'unknown'
export type MarketStatus={kind:MarketStatusKind;color:string;accessibility:string}

// Market-session status is intentionally separate from source health. The
// dot means scheduled market open/closed only where this project has a
// verified reference session. It never promises that the displayed quote is
// current or that a provider request succeeded.
export const SOURCE_STATUS_TTL_MS=5*60*1000
export const MARKET_STATUS_COLORS=Object.freeze({
  open:'#30C795',
  closed:'#96969C',
  notApplicable:'#96969C',
  unknown:'#96969C'
})

const B3_TIME_ZONE='America/Sao_Paulo'
const B3_CALENDAR_YEAR='2026'
const B3_HOLIDAYS_2026=new Set([
  '2026-01-01',
  '2026-02-16','2026-02-17',
  '2026-04-03','2026-04-21','2026-05-01','2026-06-04',
  '2026-09-07','2026-10-12','2026-11-02','2026-11-20',
  '2026-12-24','2026-12-25','2026-12-31'
])

// Verified effective ranges for the regular B3 cash-equity session. The 2026
// schedule changes on March 9 to align with U.S./European summer time. The
// next effective grade was not yet published when this version was checked,
// so weekdays from November onward deliberately return unknown.
const B3_REGULAR_SESSION_WINDOWS=Object.freeze([
  {from:'2026-01-02',through:'2026-03-08',openMinute:10*60,closeMinute:18*60},
  {from:'2026-03-09',through:'2026-10-31',openMinute:10*60,closeMinute:17*60}
])
const B3_SPECIAL_SESSIONS:Record<string,{openMinute:number;closeMinute:number}>=Object.freeze({
  // Ash Wednesday: continuous equity trading 13:00–17:55, closing call to 18:00.
  '2026-02-18':{openMinute:13*60,closeMinute:18*60}
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

// Kept for query diagnostics and tap-refresh bookkeeping; this state does not
// affect the market-session dot.
export function sourceStatusForRow(row:any,at=Date.now()):SourceStatus{
  const observedAt=finite(at)&&at>=0?at:Date.now()
  if(validProviderPayload(row,observedAt)&&!fallbackRow(row))return {state:'fresh',at:observedAt,reason:'valid-provider-payload'}
  if(fallbackRow(row))return {state:'cached',at:observedAt,reason:'cache-or-archive-preserved'}
  return {state:'failed',at:observedAt,reason:'missing-or-invalid-payload'}
}

type LocalClock={day:string;weekday:number;minute:number}
function localClock(at:number):LocalClock|null{
  if(!finite(at)||at<0)return null
  try{
    const parts=new Intl.DateTimeFormat('en-US',{
      timeZone:B3_TIME_ZONE,
      weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date(at))
    const value=(type:string)=>parts.find(part=>part.type===type)?.value
    const year=value('year'),month=value('month'),day=value('day'),weekday=value('weekday')
    const hour=Number(value('hour')),minute=Number(value('minute'))
    const weekdayNumber=({Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6} as Record<string,number>)[weekday||'']
    if(!year||!month||!day||weekdayNumber===undefined||!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)return null
    return {day:`${year}-${month}-${day}`,weekday:weekdayNumber,minute:hour*60+minute}
  }catch{return null}
}

function closed(accessibility:string):MarketStatus{return {kind:'closed',color:MARKET_STATUS_COLORS.closed,accessibility}}
function open(accessibility:string):MarketStatus{return {kind:'open',color:MARKET_STATUS_COLORS.open,accessibility}}
function neutral(kind:'notApplicable'|'unknown',accessibility:string):MarketStatus{
  return {kind,color:MARKET_STATUS_COLORS[kind],accessibility}
}

function ibovSessionStatus(now:number):MarketStatus{
  const local=localClock(now)
  if(!local)return neutral('unknown','Sessão do Ibovespa não confirmada: horário local indisponível.')
  if(!local.day.startsWith(B3_CALENDAR_YEAR+'-'))return neutral('unknown','Sessão do Ibovespa sem calendário confirmado para esta data.')
  if(B3_HOLIDAYS_2026.has(local.day))return closed(`Sessão regular de ações da B3 fechada no feriado de ${local.day}. Isso não informa se a cotação do índice está atualizada.`)
  if(local.weekday===0||local.weekday===6)return closed('Sessão regular de ações da B3 fechada no fim de semana. Isso não informa se a cotação do índice está atualizada.')

  const window=B3_SPECIAL_SESSIONS[local.day]||B3_REGULAR_SESSION_WINDOWS.find(item=>local.day>=item.from&&local.day<=item.through)
  if(!window)return neutral('unknown',`Horário da sessão regular de ações da B3 sem confirmação para ${local.day}.`)
  const label=`${String(Math.floor(window.openMinute/60)).padStart(2,'0')}:${String(window.openMinute%60).padStart(2,'0')}–${String(Math.floor(window.closeMinute/60)).padStart(2,'0')}:${String(window.closeMinute%60).padStart(2,'0')} BRT`
  if(local.minute>=window.openMinute&&local.minute<window.closeMinute)return open(`Sessão regular de ações da B3 prevista aberta (${label}, ${local.day}); não confirma atualização da cotação do Ibovespa.`)
  return closed(`Sessão regular de ações da B3 prevista fechada (${label}, ${local.day}); pré-abertura e after-market não contam. Isso não informa se a cotação do índice está atualizada.`)
}

const NOT_APPLICABLE:Record<string,string>=Object.freeze({
  SELIC:'A Selic é uma meta/série de referência periódica, sem sessão intradiária de bolsa aplicável.',
  IPCA:'O IPCA é uma série mensal de inflação, sem sessão intradiária de bolsa aplicável.',
  CUB_GO:'O CUB-GO é uma referência mensal de custo da construção, sem sessão intradiária de bolsa aplicável.',
  DIESEL_S10:'O Diesel S10 exibido é uma pesquisa semanal da ANP, sem sessão intradiária de bolsa aplicável.',
  SOJA_JATAI_GO:'A Soja GO exibida é uma cotação diária local da Agrolink, sem sessão de bolsa confirmada para este dado.',
  'USD/BRL':'O USD/BRL exibido vem da cotação bid da AwesomeAPI; a fonte não identifica um calendário de sessão verificável para este indicador.',
  BRENT:'O Brent exibido é uma série spot diária da EIA/FRED, não uma cotação intradiária de contrato futuro.'
})

// The row's source status, cached flag, quote timestamp and HTTP result are
// intentionally ignored here. Only the reference session and current time
// determine open/closed; unsupported instruments remain neutral.
export function assetMarketStatus(row:any,now=Date.now()):MarketStatus{
  const code=row?.asset?.code
  if(code==='IBOV')return ibovSessionStatus(now)
  if(typeof code==='string'&&Object.prototype.hasOwnProperty.call(NOT_APPLICABLE,code))return neutral('notApplicable',NOT_APPLICABLE[code])
  return neutral('unknown','Não há sessão de mercado confirmada para este indicador.')
}
