import {sanitizeDiagnosticBatch,sanitizeDiagnosticEvent,DiagnosticEvent,DiagnosticBatch} from './schema'
/** No native Storage/fetch/Keychain use. The application supplies reviewed adapters
 * after a private deployment and read-back have been verified. */
export function createDiagnosticClient(options:{version:string;engineVersion:string;enabled?:boolean;now?:()=>number;
  storage?:{get:()=>unknown;set:(value:DiagnosticBatch)=>void};
  send?:(batch:DiagnosticBatch)=>Promise<boolean>}){
  const now=options.now||Date.now
  let events:DiagnosticEvent[]=[],inflight=false,lastAttempt:number|null=null
  const envelope=(items:DiagnosticEvent[])=>sanitizeDiagnosticBatch({schema:1,version:options.version,engineVersion:options.engineVersion,events:items})
  const valid=Boolean(envelope([])),enabled=options.enabled===true&&valid
  if(enabled){try{const saved=sanitizeDiagnosticBatch(options.storage?.get());if(saved&&saved.version===options.version&&saved.engineVersion===options.engineVersion)events=saved.events.filter(e=>now()-e.at>=0&&now()-e.at<=86400000)}catch{}}
  function persist(){try{const batch=envelope(events);if(batch)options.storage?.set(batch)}catch{}}
  return {
    record(raw:unknown){if(!enabled)return;const event=sanitizeDiagnosticEvent(raw);if(!event)return;events=events.filter(e=>now()-e.at<=86400000);events.push(event);events=events.slice(-32);persist()},
    snapshot(){return envelope(events)},
    async flush():Promise<'disabled'|'busy'|'rate-limited'|'empty'|'sent'|'failed'>{
      if(!enabled||!options.send)return 'disabled'
      if(inflight)return 'busy'
      events=events.filter(e=>now()-e.at>=0&&now()-e.at<=86400000);persist()
      if(!events.length)return 'empty'
      const time=now();if(lastAttempt!==null&&time-lastAttempt<300000)return 'rate-limited'
      const pending=events.slice(),batch=envelope(pending);if(!batch)return 'failed'
      inflight=true;lastAttempt=time
      try{if(!await options.send(batch))return 'failed';events=events.filter(e=>!pending.includes(e));persist();return 'sent'}catch{return 'failed'}finally{inflight=false}
    }
  }
}
