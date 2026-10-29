import { Navigation, NavigationStack, VStack, Text, Button, Script, Widget, useEffect, useRef, useState, ScrollView } from 'scripting'
import { engine, loadModel, setOrdering, VERSION, MODES } from './model'
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
    {message?<Text>{message}</Text>:null}
    {model?.api.failures.map((failure:any,i:number)=><Text key={'failure-'+i}>{new URL(failure.url).hostname}: {failure.reason}</Text>)}
    <Text>Ordenação dos ativos</Text>
    {MODES.map(mode=><Button key={mode} title={(api.readOrderingMode()===mode?'✓ ':'')+api.modes[mode]} action={async()=>{try{setOrdering(mode);await refresh()}catch{setMessage('Falha ao salvar a ordenação.')}}}/>)}
    <Text>O widget publicado está no perfil de teste BBAS3 · BBDC4 · Ibovespa · BTC/USD, nesta ordem, com janela móvel de 7 dias. As três linhas B3 sem fonte autorizada permanecem sem cotação; BTC/USD usa Kraken quando a consulta pública estiver disponível. A lista fixa anterior continua recuperável no código. Toque no conteúdo solicita atualização e abre o Mercado no Meu Painel; o iOS decide quando executar.</Text>
    <Text>Para melhorias de código, use a atualização do script remoto no Scripting. Atualizar nesta tela consulta somente os indicadores.</Text>
  </VStack></ScrollView></NavigationStack>
}
async function main(){removeLegacyAccess();await Navigation.present(<Screen/>);Script.exit()}
main()
