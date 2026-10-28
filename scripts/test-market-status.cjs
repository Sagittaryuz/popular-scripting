const assert=require('node:assert/strict'),path=require('node:path'),{buildSync}=require('esbuild'),vm=require('node:vm')
const entry=path.resolve(__dirname,'Popular Scripting','market-status.ts')
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022'}).outputFiles[0].text
const fixtureModule={exports:{}}
vm.runInNewContext(code,{module:fixtureModule,exports:fixtureModule.exports,Date,Number,Math})
const {assetMarketStatus,sourceStatusForRow,SOURCE_STATUS_TTL_MS,MARKET_STATUS_COLORS}=fixtureModule.exports
const now=Date.parse('2026-10-28T20:00:00Z')
const row=(code,price=100,extra={})=>({asset:{code,price},fetchedAt:price==null?undefined:now,...extra})

const freshSource=sourceStatusForRow(row('USD/BRL'),now)
assert.equal(freshSource.state,'fresh','valid live payload becomes fresh')
assert.equal(assetMarketStatus({...row('USD/BRL'),sourceStatus:freshSource},now).kind,'fresh')
assert.equal(assetMarketStatus({...row('USD/BRL'),sourceStatus:freshSource},now).color,MARKET_STATUS_COLORS.fresh)
assert.match(assetMarketStatus({...row('USD/BRL'),sourceStatus:freshSource},now).accessibility,/dados válidos/)
assert.match(assetMarketStatus({...row('USD/BRL'),sourceStatus:freshSource},now).accessibility,/não indica bolsa aberta/)

const cachedSource=sourceStatusForRow(row('CUB_GO',2795.37,{archive:true}),now)
assert.equal(cachedSource.state,'cached','archive/reference fallback is not fresh')
const cachedStatus=assetMarketStatus({...row('CUB_GO',2795.37,{archive:true}),sourceStatus:cachedSource},now)
assert.equal(cachedStatus.kind,'stale')
assert.equal(cachedStatus.color,MARKET_STATUS_COLORS.stale)
assert.match(cachedStatus.accessibility,/cache ou arquivo/)
const liveSnapshot=row('IPCA',0.82,{archive:true,economicValidation:{origin:'github-verified-snapshot'}})
assert.equal(sourceStatusForRow(liveSnapshot,now).state,'fresh','current verified economic snapshot is a provider response')
const bundledSnapshot=row('DIESEL_S10',7.35,{archive:true,economicValidation:{origin:'bundled-verified-snapshot'}})
assert.equal(sourceStatusForRow(bundledSnapshot,now).state,'cached','bundled historical reference remains gray')

const failedSource=sourceStatusForRow(row('IPCA',null),now)
assert.equal(failedSource.state,'failed','missing payload is a failed source result')
const failedStatus=assetMarketStatus({...row('IPCA',null),sourceStatus:failedSource},now)
assert.equal(failedStatus.kind,'stale')
assert.match(failedStatus.accessibility,/falhou|inválidos/)

const invalidHttp200=sourceStatusForRow(row('SELIC',NaN),now)
assert.equal(invalidHttp200.state,'failed','HTTP 200 with an invalid payload cannot be green')
const partial=[
  {...row('SELIC'),sourceStatus:sourceStatusForRow(row('SELIC'),now)},
  {...row('IPCA',null),sourceStatus:sourceStatusForRow(row('IPCA',null),now)}
]
assert.equal(assetMarketStatus(partial[0],now).kind,'fresh','partial collection keeps a valid asset green')
assert.equal(assetMarketStatus(partial[1],now).kind,'stale','partial collection keeps a failed asset gray')

const expired={...row('IBOV'),sourceStatus:{...freshSource,at:now-SOURCE_STATUS_TTL_MS-1}}
assert.equal(assetMarketStatus(expired,now).kind,'stale','old success is not green indefinitely')
assert.equal(assetMarketStatus(expired,now).color,MARKET_STATUS_COLORS.stale)
const future={...row('BRENT'),sourceStatus:{...freshSource,at:now+1}}
assert.equal(assetMarketStatus(future,now).kind,'stale','future evidence is not trusted')

const oldRow=row('DIESEL_S10')
assert.equal(assetMarketStatus(oldRow,now).kind,'unknown','pre-status rows are not claimed fresh')
assert.equal(assetMarketStatus({...oldRow,cached:true},now).kind,'stale','legacy cache rows are gray')

console.log('PASS source status: per-asset valid payloads are green only while recent; cached/archive, partial failures, invalid HTTP-200 payloads, timeout-age and old evidence are gray; accessibility says this is source evidence, not a market-open signal.')
