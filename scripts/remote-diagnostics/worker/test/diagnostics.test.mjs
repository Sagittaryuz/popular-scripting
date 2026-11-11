import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {default as worker,MarketCache} from '../src/worker.mjs';
import {DIAGNOSTIC_TTL,sanitizeBatch} from '../src/diagnostics.mjs';
const db=new DatabaseSync(':memory:');let alarm=null,lookups=0,upstream=0;
const sql={exec(query,...values){const stmt=db.prepare(query);const rows=stmt.columns().length?stmt.all(...values):(stmt.run(...values),[]);return {toArray:()=>rows}}};
const ctx={storage:{sql,transactionSync(fn){db.exec('BEGIN');try{const result=fn();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}},setAlarm:async at=>{alarm=at}}};
const env={WIDGET_TOKEN:'synthetic-only-test-token',__TEST_NOW:Date.parse('2026-11-11T16:00:00Z'),__TEST_FETCH:async()=>{upstream++;throw Error('Unexpected market request')}};
const obj=new MarketCache(ctx,env);env.MARKET_CACHE={idFromName(n){lookups++;assert.equal(n,'marcos-personal-market');return n},get(){return obj}};
const batch={schema:1,version:'0.2.52',engineVersion:'2026.11.11.100',events:[{stage:'complete',at:env.__TEST_NOW,code:'ok',pointCount:288}]};
function req(body=batch,token=env.WIDGET_TOKEN,url='https://fixture.invalid/v1/market'){return new Request(url,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:typeof body==='string'?body:JSON.stringify(body)})}
assert.equal((await worker.fetch(req(batch,null),env)).status,401);assert.equal(lookups,0);
assert.equal((await worker.fetch(req(batch,'wrong'),env)).status,401);assert.equal(lookups,0);
assert.equal((await worker.fetch(req(batch,env.WIDGET_TOKEN,'https://fixture.invalid/v1/market?x=1'),env)).status,404);
assert.equal((await worker.fetch(req(),env)).status,202);assert.equal(upstream,0);assert.equal(alarm,env.__TEST_NOW+DIAGNOSTIC_TTL+1);
assert.equal((await worker.fetch(req(),env)).status,202,'exact retry is acknowledged idempotently');
assert.equal(sql.exec('SELECT COUNT(*) AS n FROM diagnostics').toArray()[0].n,1);
assert.equal((await worker.fetch(req({...batch,events:[{stage:'start',at:env.__TEST_NOW}]}),env)).status,429);
assert.equal((await worker.fetch(req('x'.repeat(16385)),env)).status,413);
assert.equal((await worker.fetch(req('{'),env)).status,400);assert.equal((await worker.fetch(req({}),env)).status,400);
assert.equal((await worker.fetch(req({...batch,events:[]}),env)).status,400);
assert.equal((await worker.fetch(req({...batch,events:Array(33).fill(batch.events[0])}),env)).status,400);
const dirty={...batch,token:'SECRET',events:[{...batch.events[0],message:'SECRET',headers:{authorization:'SECRET'},url:'SECRET'}]};
assert.equal(JSON.stringify(sanitizeBatch(dirty)).includes('SECRET'),false);
const saved=sql.exec('SELECT payload FROM diagnostics').toArray()[0].payload;assert.equal(saved,JSON.stringify(batch));
// Market cache is a different table; diagnostics cannot replace its rows.
sql.exec('INSERT INTO market_cache (id,fetched_at,payload) VALUES(1,1,?)','retained');
for(let i=1;i<=65;i++){env.__TEST_NOW+=300001;assert.equal((await worker.fetch(req({...batch,events:[{stage:'complete',at:env.__TEST_NOW,pointCount:i}]}),env)).status,202)}
assert.equal(sql.exec('SELECT COUNT(*) AS n FROM diagnostics').toArray()[0].n,64);
assert.equal(sql.exec('SELECT payload FROM market_cache').toArray()[0].payload,'retained');
env.__TEST_NOW+=DIAGNOSTIC_TTL+1;await obj.alarm();assert.equal(sql.exec('SELECT COUNT(*) AS n FROM diagnostics').toArray()[0].n,0);
assert.equal(sql.exec('SELECT payload FROM market_cache').toArray()[0].payload,'retained');
assert.equal(upstream,0);
console.log('PASS real SQLite diagnostic handler: 401/404/400/413/429, authenticated202, dedup SHA256, bounded64 rows, TTL alarm, strict redaction, isolated market cache; synthetic credentials only.');
