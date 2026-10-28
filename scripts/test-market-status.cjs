const assert=require('node:assert/strict'),path=require('node:path'),{buildSync}=require('esbuild'),vm=require('node:vm')
const entry=path.resolve(__dirname,'Popular Scripting','market-status.ts')
const code=buildSync({entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022'}).outputFiles[0].text
const fixtureModule={exports:{}}
vm.runInNewContext(code,{module:fixtureModule,exports:fixtureModule.exports,Date,Number,Math})
const {assetMarketStatus,MARKET_STATUS_COLORS}=fixtureModule.exports
const row=(code,price=100)=>({asset:{code,price}})
for(const code of ['SELIC','IPCA','IBOV','USD/BRL','SOJA_JATAI_GO','CUB_GO','DIESEL_S10','BRENT']){
  const status=assetMarketStatus(row(code))
  assert.equal(status.kind,'unknown',`${code} remains neutral without a per-asset session contract`)
  assert.equal(status.color,MARKET_STATUS_COLORS.unknown,`${code} uses neutral color`)
}
assert.match(assetMarketStatus(row('IBOV')).accessibility,/Ibovespa é índice/)
assert.match(assetMarketStatus(row('IBOV',null)).accessibility,/Ibovespa é índice/,'missing quote cannot be recast as closed/open')
console.log('PASS market status: Ibovespa and all other indicators stay neutral because no source-specific session/publication status is proven; no calendar or HTTP response becomes active.')
