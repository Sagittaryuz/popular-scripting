import { Button, Text, VStack, useState } from 'scripting'
import { loadModel } from './model'
import { summaryRows } from './pro-model'
function Tool({response}:AssistantTool.UIProps<{}>){
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  return <VStack><Button title={busy?'Consultando…':'Consultar indicadores'} action={async()=>{if(busy)return;setBusy(true);try{
    const model=await loadModel('medium',true);response({success:true,output:{assistantParts:[{type:'text',text:JSON.stringify(summaryRows(model.rows))}],userParts:[{type:'text',text:model.status.label+' · '+model.status.message}]}})
  }catch{setError('Consulta indisponível.')}finally{setBusy(false)}}}/>{error?<Text>{error}</Text>:null}</VStack>
}
AssistantTool.registerUIView(Tool)
