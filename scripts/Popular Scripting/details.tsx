import { Button, Canvas, HStack, Link, Text, VStack, useRef, useState } from 'scripting'
import { drawCurve, curvePlan } from './draw'
import { historyCSV, sourceURL, summaryRows, validateRules } from './pro-model'
import { addAlert, evaluateAlerts } from './alerts'
import { chooseExportFolder, explain, exportPreferences, exportText, readPreferences, refreshMinutes, reloadWidgets } from './pro-common'
import { removePrivateMarketToken, savePrivateMarketToken } from './private-market'
export function PopularDetails({model}:{model:any}){
  const [selected,setSelected]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[historyDays,setHistoryDays]=useState(0)
  const running=useRef(false)
  async function run(fn:()=>Promise<void>){if(running.current)return;running.current=true;setBusy(true);try{await fn()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível concluir.')}finally{running.current=false;setBusy(false)}}
  const row=model?.rows.find((r:any)=>r.asset.code===selected)
  const history=row?.chart?{...row.chart,points:row.chart.points.filter((p:any)=>!historyDays||p.stamp.time>=Date.now()-historyDays*86400000)}:null
  async function configurePrivateMarket(){
    const value=await Dialog.prompt({title:'Fonte privada',message:'Cole o token do widget. Ele será guardado somente no Keychain deste iPhone; nunca no Storage, GitHub, logs ou widget.',placeholder:'Token do widget',obscureText:true,confirmLabel:'Salvar',cancelLabel:'Cancelar'})
    if(value==null)return
    savePrivateMarketToken(value);await reloadWidgets();setMessage('Token salvo somente no Keychain. Atualize para consultar BBAS3, BBDC4 e Ibovespa.')
  }
  async function removePrivateMarket(){
    const choice=await Dialog.actionSheet({title:'Fonte privada',message:'Remover o token deste iPhone?',actions:[{label:'Remover'},{label:'Cancelar'}]});if(choice!==0)return
    removePrivateMarketToken();await reloadWidgets();setMessage('Token removido do Keychain. Os três ativos B3 ficarão sem cotação até configurar novamente.')
  }
  return <VStack spacing={10}>
    {model?<VStack spacing={8}>
      <Text font="headline">Detalhes dos indicadores</Text>
      {model.rows.map((r:any)=><Button key={r.asset.code} title={r.name+' · '+r.price} action={()=>setSelected(r.asset.code)}/>)}
      {row?<VStack spacing={8}>
        <Text>{row.name+' · '+row.price+' · '+row.percent}</Text><Text>{row.unit+' · '+row.time}</Text>
        <Text>{'Fonte: '+row.asset.source+' · '+(row.referencePeriod??row.stamp?.day??'Data de observação indisponível')}</Text>
        <HStack>{[[7,'7 dias'],[90,'90 dias'],[0,'Disponível']].map(([days,label])=><Button key={String(days)} title={String(label)} action={()=>setHistoryDays(Number(days))}/>)}</HStack>
        <Canvas opaque={false} frame={{width:300,height:100}} draw={(ctx,size)=>drawCurve(ctx,size,curvePlan({...model.api,displayChart:(chart:any)=>chart},{...row,chart:history},300),'#4BAEFF')}/>
        <Link url={sourceURL(row)}><Text>Abrir fonte</Text></Link>
        <Text>Histórico disponível da própria fonte; períodos e unidades podem variar entre indicadores.</Text>
      </VStack>:null}
      <Text>Perfil publicado: BBAS3 · BBDC4 · Ibovespa · BTC/USD · janela móvel de 7 dias</Text>
      <Button title="Exportar histórico CSV" action={()=>run(async()=>{await exportText('popular-historico.csv',historyCSV(row?[row]:model.rows))})}/>
      <Button title="Explicar indicadores" action={()=>run(()=>explain('Explique os indicadores e compare somente valores de mesma base/unidade/período. Não recomende investimentos nem invente causas de variações. Dados: '+JSON.stringify(summaryRows(row?[row]:model.rows))))}/>
      <Button title="Criar alerta por cruzamento" action={()=>run(async()=>{await addAlert(model.rows);setMessage('Alerta configurado. A primeira observação estabelece a base; o aviso depende de nova execução.')} )}/>
      <Button title="Verificar alertas agora" action={()=>run(async()=>{await evaluateAlerts(model.rows);setMessage('Condições verificadas com as datas das observações.')} )}/>
    </VStack>:<Text>Atualize os indicadores para consultar detalhes.</Text>}
    <Button title="Remover alerta" action={()=>run(async()=>{const rules=validateRules(Storage.get('popular-alerts')??[]);const choice=await Dialog.actionSheet({title:'Remover alerta',actions:rules.map(r=>({label:r.code+' '+r.direction+' '+r.threshold}))});if(choice!=null){Storage.set('popular-alerts',rules.filter((_,i)=>i!==choice));setMessage('Alerta removido.')}})}/>
    <Text>Frequência solicitada ao iOS</Text>
    <HStack>{[1,5,15].map(n=><Button key={n} title={(refreshMinutes()===n?'✓ ':'')+n+' min'} action={()=>run(async()=>{Storage.set('refresh-minutes',n);await reloadWidgets();setMessage('Intervalo solicitado. O iOS decide quando executar.')} )}/>)}</HStack>
    <Button title="Configurar fonte privada" action={()=>run(configurePrivateMarket)}/>
    <Button title="Remover token privado" action={()=>run(removePrivateMarket)}/>
    <Text>O token da fonte privada fica somente no Keychain do iPhone. O widget não pede token nem chama DadosB3; sem token ou sem resposta, preserva cache privado ou deixa os três slots B3 sem cotação.</Text>
    <Button title="Exportar preferências" action={()=>run(async()=>{await exportPreferences('Popular',{refreshMinutes:refreshMinutes(),rules:Storage.get('popular-alerts')??[],alertsEnabled:Storage.get('popular-alerts-enabled')===true})})}/>
    <Button title="Escolher pasta de exportação" action={()=>run(chooseExportFolder)}/>
    <Button title="Importar preferências" action={()=>run(async()=>{const p=await readPreferences('Popular') as any;if(!p)return;const rules=validateRules(p.rules);if(typeof p.alertsEnabled!=='boolean'||![1,5,15].includes(p.refreshMinutes))throw Error('Preferências inválidas.');Storage.set('refresh-minutes',p.refreshMinutes);Storage.set('popular-alerts',rules);Storage.set('popular-alerts-enabled',p.alertsEnabled);await reloadWidgets();setMessage('Preferências importadas. O widget pequeno mantém a ordem fixa.')} )}/>
    <Text foregroundStyle="secondary">Alertas locais são verificados quando o script executa, inclusive no widget após ativação no app. O iOS não garante execução contínua. Atualização mais frequente não muda a periodicidade publicada pelas fontes.</Text>
    {message?<Text>{message}</Text>:null}
  </VStack>
}
