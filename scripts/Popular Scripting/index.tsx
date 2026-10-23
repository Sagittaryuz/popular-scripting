import { Navigation, NavigationStack, VStack, Text, Button, Script, Widget, useState, ScrollView } from 'scripting'
import { engine, loadModel, setOrdering, VERSION, MODES } from './model'
import { removeLegacyAccess } from './host'
import { PopularView } from './view'

function Screen(){
  const [message,setMessage]=useState(''),[model,setModel]=useState<any>(null),[busy,setBusy]=useState(false)
  async function refresh(){
    if(busy)return;setBusy(true);setMessage('Consultando indicadores…')
    try{const next=await loadModel('medium',true);setModel(next);Widget.reloadAll();setMessage(next.status.label+' · '+next.status.message)}
    catch{setMessage('Não foi possível consultar. O cache anterior foi preservado.')}
    finally{setBusy(false)}
  }
  const api=engine()
  return <NavigationStack><ScrollView><VStack padding={16} spacing={12} navigationTitle="Popular">
    <Text>Popular Scripting · {VERSION} · motor {api.version}</Text>
    <Button title={busy?'Consultando…':'Atualizar'} action={refresh}/>
    {model?<PopularView model={model} width={332} height={158}/>:null}
    {message?<Text>{message}</Text>:null}
    {model?.api.failures.map((failure:any,i:number)=><Text key={'failure-'+i}>{new URL(failure.url).hostname}: {failure.reason}</Text>)}
    <Text>Ordenação dos ativos</Text>
    {MODES.map(mode=><Button key={mode} title={(api.readOrderingMode()===mode?'✓ ':'')+api.modes[mode]} action={async()=>{try{setOrdering(mode);await refresh()}catch{setMessage('Falha ao salvar a ordenação.')}}}/>)}
    <Text>Pequeno: 4 indicadores. Médio e grande: 8. Atualização solicitada a partir de 5 minutos, sujeita ao iOS. As datas exibidas são as das observações; o cache não renova cotações antigas.</Text>
    <Text>Para melhorias de código, use a atualização do script remoto no Scripting. Atualizar nesta tela consulta somente os indicadores.</Text>
  </VStack></ScrollView></NavigationStack>
}
async function main(){removeLegacyAccess();await Navigation.present(<Screen/>);Script.exit()}
main()
