const assert=require('node:assert/strict'),path=require('node:path'),{buildSync}=require('esbuild'),vm=require('node:vm')
const entry=path.resolve(__dirname,'Popular Scripting','market-status.ts')
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022'}).outputFiles[0].text
const fixtureModule={exports:{}}
vm.runInNewContext(code,{module:fixtureModule,exports:fixtureModule.exports,Date,Intl,Number,Set,Math})
const {assetMarketStatus,b3SessionStatus,MARKET_STATUS_COLORS}=fixtureModule.exports
const row=(code,price=100)=>({asset:{code,price}})
const at=s=>Date.parse(s)

assert.equal(b3SessionStatus(at('2026-10-28T14:00:00Z')).kind,'active','regular B3 negotiation is active')
assert.equal(b3SessionStatus(at('2026-10-28T20:30:00Z')).kind,'active','documented after-market negotiation is active')
assert.equal(b3SessionStatus(at('2026-10-28T12:00:00Z')).kind,'inactive','pre-open is not called negotiation')
assert.equal(b3SessionStatus(at('2026-10-28T22:00:00Z')).kind,'inactive','after-market end is inactive')
assert.equal(b3SessionStatus(at('2026-10-12T14:00:00Z')).kind,'inactive','official 2026 holiday is inactive')
assert.equal(b3SessionStatus(at('2027-01-04T14:00:00Z')).kind,'unknown','unsupported calendar year stays neutral')
assert.equal(assetMarketStatus(row('IBOV'),at('2026-10-28T14:00:00Z')).kind,'active','Ibovespa uses the documented B3 session')
assert.equal(assetMarketStatus(row('IBOV',null),at('2026-10-28T14:00:00Z')).kind,'unknown','missing quote never becomes active')
for(const code of ['SELIC','IPCA','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']){
  const status=assetMarketStatus(row(code),at('2026-10-28T14:00:00Z'))
  assert.equal(status.kind,'unknown',`${code} has no published session contract`)
  assert.equal(status.color,MARKET_STATUS_COLORS.unknown,`${code} uses neutral color`)
}
console.log('PASS market status: official B3 session/calendar only for Ibovespa; periodic and venue-unknown sources remain neutral; missing values never become active.')
