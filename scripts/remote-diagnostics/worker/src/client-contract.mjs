const ASSET_CODES=['BBAS3','BBDC4','IBOV'];

function secureEndpoint(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Endpoint privado inválido');
  if(url.hostname==='brapi.dev'||url.hostname==='api.brapi.dev')throw Error('Cliente não pode chamar brapi diretamente');
  return url;
}

export async function requestPrivateMarket({endpoint,widgetToken,fetchImpl=globalThis.fetch}){
  const base=secureEndpoint(endpoint);
  if(typeof widgetToken!=='string'||widgetToken.length===0)throw Error('WIDGET_TOKEN ausente');
  const url=new URL('/v1/market',base);
  const result=await fetchImpl(url,{method:'GET',headers:{accept:'application/json',authorization:'Bearer '+widgetToken}});
  if(!result?.ok)throw Error('Endpoint privado indisponível');
  const payload=await result.json();
  if(payload?.schema!==1||payload?.source!=='brapi'||!Array.isArray(payload.assets)||JSON.stringify(payload.assets.map(row=>row?.asset?.code))!==JSON.stringify(ASSET_CODES))throw Error('Bundle privado inválido');
  return payload;
}
