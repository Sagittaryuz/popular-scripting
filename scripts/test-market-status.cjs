const assert=require('node:assert/strict'),path=require('node:path'),{buildSync}=require('esbuild'),vm=require('node:vm')
const entry=path.resolve(__dirname,'Popular Scripting','market-status.ts')
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022'}).outputFiles[0].text
const fixtureModule={exports:{}}
vm.runInNewContext(code,{module:fixtureModule,exports:fixtureModule.exports,Date,Number,Math,Intl,String,Object,Set})
const {assetMarketStatus,sourceStatusForRow,MARKET_STATUS_COLORS}=fixtureModule.exports
const row=(code,extra={})=>({asset:{code,price:100},fetchedAt:Date.parse('2026-10-28T13:00:00Z'),...extra})
const status=(code,iso,extra={})=>assetMarketStatus(row(code,extra),Date.parse(iso))
const assertKind=(actual,expected,label)=>assert.equal(actual.kind,expected,label)

// The code converts the supplied instant through America/Sao_Paulo; tests use
// UTC instants so they do not depend on the host computer's local time zone.
assertKind(status('IBOV','2026-10-28T12:59:59Z'),'closed','before the regular 10:00 BRT session')
assertKind(status('IBOV','2026-10-28T13:00:00Z'),'open','the 10:00 BRT opening boundary is inclusive')
assertKind(status('IBOV','2026-10-28T19:59:59Z'),'open','the regular 17:00 BRT closing boundary is exclusive')
assertKind(status('IBOV','2026-10-28T20:00:00Z'),'closed','the 17:00 BRT close is not open')
assertKind(status('IBOV','2026-10-28T20:30:00Z'),'closed','after-market is excluded')
assert.equal(status('IBOV','2026-10-28T13:00:00Z').color,MARKET_STATUS_COLORS.open)
assert.equal(status('IBOV','2026-10-28T20:00:00Z').color,MARKET_STATUS_COLORS.closed)
assert.match(status('IBOV','2026-10-28T13:00:00Z').accessibility,/n[aã]o confirma atualiza/)
assert.match(status('IBOV','2026-10-28T20:30:00Z').accessibility,/after-market n[aã]o contam/)

// Effective schedule changes by official date; Brazilian local time is
// explicitly selected rather than inherited from the host.
assertKind(status('IBOV','2026-01-15T20:59:59Z'),'open','winter schedule remains open through 18:00 BRT')
assertKind(status('IBOV','2026-01-15T21:00:00Z'),'closed','winter schedule closes at 18:00 BRT')
assertKind(status('IBOV','2026-03-06T13:00:00Z'),'open','last weekday before the 2026 effective change uses 10:00 BRT opening')
assertKind(status('IBOV','2026-03-09T13:00:00Z'),'open','new 2026 grade takes effect on March 9')
assertKind(status('IBOV','2026-03-09T20:00:00Z'),'closed','new grade closes at 17:00 BRT')
assert.match(status('IBOV','2026-11-03T13:00:00Z').accessibility,/sem confirma/,'unpublished November weekday schedule stays neutral')
assertKind(status('IBOV','2026-11-03T13:00:00Z'),'unknown','no guessed fall schedule')
assertKind(status('IBOV','2027-01-04T13:00:00Z'),'unknown','year outside the verified calendar')
assertKind(assetMarketStatus(row('IBOV'),Number.NaN),'unknown','invalid time remains unknown')

// 2026 special session: Ash Wednesday starts at 13:00 BRT and the closing
// call ends at 18:00. The two Carnival holidays are closed.
assertKind(status('IBOV','2026-02-18T15:59:59Z'),'closed','before Ash Wednesday 13:00 BRT')
assertKind(status('IBOV','2026-02-18T16:00:00Z'),'open','Ash Wednesday 13:00 BRT opening boundary')
assertKind(status('IBOV','2026-02-18T20:59:59Z'),'open','Ash Wednesday closing call remains in the regular session')
assertKind(status('IBOV','2026-02-18T21:00:00Z'),'closed','Ash Wednesday session closes at 18:00 BRT')
assertKind(status('IBOV','2026-02-16T16:00:00Z'),'closed','Carnival Monday')
assertKind(status('IBOV','2026-02-17T16:00:00Z'),'closed','Carnival Tuesday')

// B3 2026 holidays, weekend, and the São Paulo state holiday where the B3
// calendar explicitly says the session is normal.
for(const date of ['2026-01-01','2026-04-03','2026-04-21','2026-05-01','2026-06-04','2026-09-07','2026-10-12','2026-11-02','2026-11-20','2026-12-24','2026-12-25','2026-12-31']){
  assertKind(status('IBOV',`${date}T13:00:00Z`),'closed',`B3 holiday ${date}`)
}
assertKind(status('IBOV','2026-10-31T13:00:00Z'),'closed','Saturday')
assertKind(status('IBOV','2026-11-01T13:00:00Z'),'closed','Sunday')
assertKind(status('IBOV','2026-07-09T13:00:00Z'),'open','B3 lists July 9, 2026 as normal trading')

// The dot cannot be used as a proxy for network health, cache state, quote
// age, price presence, or HTTP success. All rows for non-session series are
// neutral, never mislabeled closed.
const fresh=sourceStatusForRow(row('IBOV'),Date.parse('2026-10-28T13:00:00Z'))
const stale={state:'cached',at:Date.parse('2026-10-28T13:00:00Z'),reason:'cached'}
const failed={state:'failed',at:Date.parse('2026-10-28T13:00:00Z'),reason:'network'}
for(const sourceStatus of [fresh,stale,failed]){
  const candidate=row('IBOV',{sourceStatus,cached:sourceStatus===stale,fetchedAt:0,httpStatus:200})
  assertKind(assetMarketStatus(candidate,Date.parse('2026-10-28T13:00:00Z')),'open','source health cannot turn the session dot gray')
}
for(const code of ['SELIC','IPCA','CUB_GO','DIESEL_S10','SOJA_JATAI_GO','USD/BRL','BRENT']){
  const neutral=status(code,'2026-10-28T13:00:00Z',{sourceStatus:fresh,httpStatus:200})
  assertKind(neutral,'notApplicable',`${code} has no confirmed session in the current source contract`)
  assert.equal(neutral.color,MARKET_STATUS_COLORS.notApplicable)
}
assertKind(status('UNMAPPED','2026-10-28T13:00:00Z'),'unknown','unmapped codes are not falsely declared non-applicable or closed')
assertKind(status('constructor','2026-10-28T13:00:00Z'),'unknown','prototype property names cannot spoof an instrument classification')
assertKind(status('IPCA','2026-10-28T13:00:00Z',{cached:true}),'notApplicable','periodic data stays neutral when cached')

console.log('PASS market session: only verified B3/IBOV regular-session hours color open; source health and quote/cache metadata do not affect the dot; 2026 schedule change, holidays, special Ash Wednesday, weekends, unsupported future dates, and non-session indicators are covered.')
