import { Navigation, NavigationStack, VStack, Text, Button, Script, Widget, useEffect, useRef, useState, ScrollView } from 'scripting'
import { engine, loadModel, setOrdering, VERSION, MODES, privateMarketStatusText } from './model'
import { removeLegacyAccess } from './host'
import { PopularView } from './view'
import { PopularDetails } from './details'
import { evaluateAlerts } from './alerts'
import { reloadWidgets } from './pro-common'

function Screen(){
  const [message,setMessage]=useState(''),[model,setModel]=useState<any>(null),[busy,setBusy]=useState(false)
  const running=useRef(false)
  async function refresh(){
    if(running.current)return;running.current=true;setBusy(true);setMessage('Consultando indicadores…')
    try{const next=await loadModel('medium',true);setModel(next);await reloadWidgets();setMessage(next.status.label+' · '+next.status.message);await evaluateAlerts(next.rows)}
    catch{setMessage('Não foi possível consultar. O cache anterior foi preservado.')}
    finally{running.current=false;setBusy(false)}
  }
  const api=engine()
  useEffect(()=>{void refresh()},[])
  return <NavigationStack><ScrollView><VStack padding={16} spacing={12} navigationTitle="Popular">
    <Text>Popular Scripting · {VERSION} · motor {api.version}</Text>
    <Button title={busy?'Consultando…':'Atualizar'} action={refresh}/>
    {model?<PopularView model={model} width={332} height={158}/>:null}
    <PopularDetails model={model}/>
    {model&&model.rows.some((row:any)=>row.asset.source==='PrivateMarket')?<Text foregroundStyle="secondary">{privateMarketStatusText(model.privateMarketStatus??model.api.privateMarketStatus)}</Text>:null}
    {message?<Text>{message}</Text>:null}
    {model?.api.failures.map((failure:any,i:number)=><Text key={'failure-'+i}>{new URL(failure.url).hostname}: {failure.reason}</Text>)}
    <Text>Ordenação dos ativos</Text>
    {MODES.map(mode=><Button key={mode} title={(api.readOrderingMode()===mode?'✓ ':'')+api.modes[mode]} action={async()=>{try{setOrdering(mode);await refresh()}catch{setMessage('Falha ao salvar a ordenação.')}}}/>)}
    <Text>Perfil publicado: Ibovespa · Dow Jones · dólar · Brent futuro. As curvas acumulam aproximadamente 24 horas de intervalos com cotações, em barras de cinco minutos, atravessando fechamentos e fins de semana sem preencher lacunas. As datas efetivas aparecem junto da curva. A variação ao lado é diária, sobre o fechamento anterior. Yahoo pode atrasar ou falhar; o iOS decide quando atualizar. O perfil legado continua recuperável.</Text>
    <Text>Para melhorias de código, use a atualização do script remoto no Scripting. Atualizar nesta tela consulta somente os indicadores.</Text>
  </VStack></ScrollView></NavigationStack>
}
async function main(){removeLegacyAccess();await Navigation.present(<Screen/>);Script.exit()}
main()
