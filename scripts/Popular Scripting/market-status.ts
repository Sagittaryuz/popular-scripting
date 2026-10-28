export type MarketStatusKind='active'|'inactive'|'unknown'
export type MarketStatus={kind:MarketStatusKind;color:string;accessibility:string}

// This is deliberately a display-only neutral state. The current widget
// sources do not expose a per-asset session contract, so no successful HTTP
// response, fetch time, periodic observation, or nearby venue schedule can
// become a live/open marker.
export const MARKET_STATUS_COLORS=Object.freeze({
  unknown:'#6A6A72'
})

function unknown(reason='fonte sem status de sessão aplicável'):MarketStatus {
  return {kind:'unknown',color:MARKET_STATUS_COLORS.unknown,accessibility:'Sessão: desconhecida; '+reason+'.'}
}

export function assetMarketStatus(row:any):MarketStatus {
  const code=row?.asset?.code
  if(code==='IBOV')return unknown('Ibovespa é índice; a fonte não fornece estado de divulgação do índice por sessão')
  return unknown('indicador periódico ou fonte sem sessão de negociação publicada')
}
