// The endpoint is public configuration; the bearer value is never part of the
// bundle. It is entered once in the foreground app and kept only in Keychain.
export const PRIVATE_MARKET_ENDPOINT='https://popular-private-market-prep.mrpires72.workers.dev/v1/market'
export const PRIVATE_MARKET_TOKEN_KEY='popular-private-market-widget-token-v1'
export const PRIVATE_MARKET_TOKEN_MIN_LENGTH=32
export const PRIVATE_MARKET_TOKEN_MAX_LENGTH=512

export function normalizePrivateMarketToken(value:unknown):string|null{
  if(typeof value!=='string')return null
  const token=value.trim()
  return token.length>=PRIVATE_MARKET_TOKEN_MIN_LENGTH&&token.length<=PRIVATE_MARKET_TOKEN_MAX_LENGTH?token:null
}

export function readPrivateMarketToken():string|null{
  try{
    if(typeof Keychain==='undefined'||typeof Keychain.contains!=='function'||!Keychain.contains(PRIVATE_MARKET_TOKEN_KEY))return null
    return normalizePrivateMarketToken(Keychain.get(PRIVATE_MARKET_TOKEN_KEY))
  }catch{return null}
}

export function savePrivateMarketToken(value:unknown):void{
  const token=normalizePrivateMarketToken(value)
  if(!token)throw Error('Token privado inválido. Cole o token completo.')
  if(typeof Keychain==='undefined'||typeof Keychain.set!=='function')throw Error('Keychain indisponível neste ambiente.')
  // Never write the token to Storage, files, logs, diagnostics or shared state.
  if(Keychain.set(PRIVATE_MARKET_TOKEN_KEY,token)===false)throw Error('Não foi possível salvar o token no Keychain.')
}

export function removePrivateMarketToken():void{
  try{if(typeof Keychain!=='undefined'&&typeof Keychain.remove==='function')Keychain.remove(PRIVATE_MARKET_TOKEN_KEY)}catch{}
}

export function isPrivateMarketEndpoint(value:string):boolean{
  try{
    const actual=new URL(value),expected=new URL(PRIVATE_MARKET_ENDPOINT)
    return actual.protocol==='https:'&&!actual.username&&!actual.password&&!actual.port&&
      actual.origin===expected.origin&&actual.pathname===expected.pathname&&!actual.search&&!actual.hash
  }catch{return false}
}
