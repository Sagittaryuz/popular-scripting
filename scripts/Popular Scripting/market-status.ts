export type MarketStatusKind='active'|'inactive'|'unknown'
export type MarketStatus={kind:MarketStatusKind;color:string;accessibility:string}

// These are deliberately display-only states. They describe a documented
// venue session when one exists; they never turn a successful HTTP response,
// a fetch time, or a periodic observation into a live quote.
export const MARKET_STATUS_COLORS=Object.freeze({
  active:'#30C795',
  inactive:'#96969C',
  unknown:'#6A6A72'
})

// B3's 2026 calendar is explicit about the full-day suspensions. Keep the
// supported year bounded: a future year without a reviewed official calendar
// must remain neutral instead of becoming green by weekday alone.
export const B3_HOLIDAYS_2026=Object.freeze(new Set([
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
  '2026-05-01','2026-06-04','2026-09-07','2026-10-12','2026-11-02',
  '2026-11-20','2026-12-24','2026-12-25','2026-12-31'
]))

function unknown(reason='fonte sem status de sessão aplicável') : MarketStatus {
  return {kind:'unknown',color:MARKET_STATUS_COLORS.unknown,accessibility:'Sessão: desconhecida; '+reason+'.'}
}
function localParts(now:number){
  if(!Number.isFinite(now)||now<=0)return null
  try {
    const values=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',calendar:'gregory',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now))
    const value=(type:string)=>values.find(part=>part.type===type)?.value
    const year=Number(value('year')),month=Number(value('month')),day=Number(value('day')),hour=Number(value('hour')),minute=Number(value('minute'))
    if(![year,month,day,hour,minute].every(Number.isFinite))return null
    const iso=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')
    const weekday=new Date(Date.UTC(year,month-1,day,12)).getUTCDay()
    return {year,iso,weekday,minutes:hour*60+minute}
  } catch(_) { return null }
}

// Current B3 equity-market schedule: regular negotiation is 10:00–16:55;
// the documented after-market negotiation phase is 17:30–18:00. Pre-open and
// call/cancellation phases are intentionally not called "open" here.
export function b3SessionStatus(now=Date.now()):MarketStatus {
  const local=localParts(now)
  if(!local||local.year!==2026)return unknown('calendário B3 revisado não disponível para esta data')
  if(local.weekday===0||local.weekday===6||B3_HOLIDAYS_2026.has(local.iso))return {
    kind:'inactive',color:MARKET_STATUS_COLORS.inactive,
    accessibility:'Sessão B3 prevista fechada pelo calendário; isso não confirma a conectividade da fonte.'
  }
  const regular=local.minutes>=10*60&&local.minutes<16*60+55
  const afterMarket=local.minutes>=17*60+30&&local.minutes<18*60
  if(regular||afterMarket)return {
    kind:'active',color:MARKET_STATUS_COLORS.active,
    accessibility:'Sessão B3 prevista aberta; isso não confirma o frescor da cotação.'
  }
  return {
    kind:'inactive',color:MARKET_STATUS_COLORS.inactive,
    accessibility:'Sessão B3 prevista fechada; isso não confirma a conectividade da fonte.'
  }
}

export function assetMarketStatus(row:any,now=Date.now()):MarketStatus {
  const code=row?.asset?.code
  if(code!=='IBOV')return unknown('indicador periódico ou fonte sem sessão de negociação publicada')
  // A missing slot is not a closed market. Keep it neutral so a fallback row
  // cannot be mistaken for a valid active/inactive asset status.
  const price=Number(row?.asset?.price)
  if(!Number.isFinite(price)||price<=0)return unknown('cotação ausente')
  return b3SessionStatus(now)
}
