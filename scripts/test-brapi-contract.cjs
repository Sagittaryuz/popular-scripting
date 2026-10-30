const assert=require('node:assert/strict');
const api=require('./brapi-contract.cjs');

const now=Date.parse('2026-10-29T20:12:31Z');
const day=(value)=>Math.floor(Date.parse(value+'T12:00:00Z')/1000);
const quote=(code,symbol,price,change,changePercent,time,logo)=>({results:[{symbol,regularMarketPrice:price,regularMarketChange:change,regularMarketChangePercent:changePercent,regularMarketTime:time,...(logo?{logourl:logo}:{})}]});
const historical=(code,symbol,days,base)=>({results:[{symbol,historicalDataPrice:days.map((date,index)=>({date:day(date),close:base+index,adjustedClose:base+index}))}]});

const plans=['BBAS3','BBDC4','IBOV'].map(api.serverRequestPlan);
assert.deepEqual(plans.map(item=>item.symbol),['BBAS3','BBDC4','^BVSP']);
assert(plans.every(item=>item.transport==='server-only'&&item.clientMayCallUpstream===false&&item.credential.valueIncluded===false));
assert.deepEqual(api.FREE_PLAN,{monthlyRequests:15000,concurrentRequests:1,maxAssetsPerRequest:1,refreshMinutes:30,maxHistoryMonths:3});
assert(plans.every(item=>item.scheduling==='serialize-upstream-calls'&&item.budget.maxAssetsPerRequest===1));
assert.equal(plans[2].upstream.url,'https://brapi.dev/api/quote/%5EBVSP?range=7d&interval=1d');
assert(plans.every(item=>item.requestsPerRefresh===1&&JSON.stringify(item.upstream.includes)==='["quote","history","logo"]'));
assert(!plans.some(item=>/token=|Bearer\s+[A-Za-z0-9]/i.test(JSON.stringify(item))),'request plans contain no credential value');

const bbasQuote=quote('BBAS3','BBAS3',22.5,.1,.4464,'2026-10-28T20:00:00.000Z','https://icons.brapi.dev/icons/BBAS3.svg');
const bbasHistory=historical('BBAS3','BBAS3',['2026-10-22','2026-10-23','2026-10-26','2026-10-27','2026-10-28'],22.1);
const bbas=api.mergeQuoteHistory(bbasQuote,bbasHistory,'BBAS3',now);
assert.equal(bbas.asset.price,22.5);
assert.equal(bbas.asset.percent,.4464);
assert.equal(bbas.asset.iconURL,'https://icons.brapi.dev/icons/BBAS3.svg');
assert.equal(bbas.chart.sourceStartDay,'2026-10-23');
assert.equal(bbas.chart.sourceEndDay,'2026-10-29');
assert.deepEqual(bbas.chart.points.map(point=>point.stamp.day),['2026-10-23','2026-10-26','2026-10-27','2026-10-28']);

const bbdcQuote=quote('BBDC4','BBDC4',10.3,.05,.4854,'2026-10-28T20:00:00.000Z','https://icons.brapi.dev/icons/BBDC4.svg');
const bbdcHistory=historical('BBDC4','BBDC4',['2026-10-23','2026-10-26','2026-10-27','2026-10-28'],10.1);
const bbdc=api.mergeQuoteHistory(bbdcQuote,bbdcHistory,'BBDC4',now);
assert.equal(bbdc.asset.price,10.3);
assert.equal(bbdc.asset.delta,.05);
assert.equal(bbdc.asset.iconURL,'https://icons.brapi.dev/icons/BBDC4.svg');
assert.equal(bbdc.chart.points.length,4);

const ibovQuote=quote('IBOV','^BVSP',171000,-2500,-1.44,'2026-10-28T20:00:00.000Z');
const ibovHistory=historical('IBOV','^BVSP',['2026-10-23','2026-10-26','2026-10-27','2026-10-28'],170000);
const ibov=api.mergeQuoteHistory(ibovQuote,ibovHistory,'IBOV',now,{indexes:[{stock:'^BVSP',name:'IBOVESPA'}]});
assert.equal(ibov.asset.code,'IBOV');
assert.equal(ibov.asset.symbol,undefined,'the normalized row does not expose a proxy symbol');
assert.equal(ibov.asset.price,171000);
assert.equal(ibov.chart.points.length,4);
assert.equal(ibov.asset.iconURL,undefined,'IBOV does not inherit an ETF or guessed logo');

const logos=api.parseLogoList({stocks:[{stock:'BBAS3',logo:'https://icons.brapi.dev/icons/BBAS3.svg'},{stock:'BBDC4',logo:'https://icons.brapi.dev/icons/BBDC4.svg'},{stock:'^BVSP',logo:'https://icons.brapi.dev/icons/BVSP.svg'}]});
assert.deepEqual(logos,{BBAS3:{iconURL:'https://icons.brapi.dev/icons/BBAS3.svg',iconSource:'brapi-metadata'},BBDC4:{iconURL:'https://icons.brapi.dev/icons/BBDC4.svg',iconSource:'brapi-metadata'}});

const oldOnly=api.parseHistory(historical('BBDC4','BBDC4',['2026-10-15'],10),'BBDC4',now);
assert.equal(oldOnly.points.length,0,'old observations do not get stretched into the current week');
assert.equal(oldOnly.chartStatus,'price-only-7D');
assert.throws(()=>api.parseQuote(quote('IBOV','SPY',100,1,1,'2026-10-28T20:00:00.000Z'),'IBOV'),/resultado exato/,'an ETF/proxy cannot satisfy IBOV');
assert.throws(()=>api.parseHistory({results:[{symbol:'BBAS3',historicalDataPrice:[{date:day('2026-10-23'),close:20},{date:day('2026-10-23'),close:21}]}]},'BBAS3',now),/duplicado/);
assert.throws(()=>api.parseLogoList({stocks:[{stock:'BBAS3',logo:'https://example.test/logo.svg'}]}),/domínio/);
console.log('PASS brapi contract: server-only request plan, exact BBAS3/BBDC4/^BVSP symbols, dated quotes, real seven-day daily points, logo metadata, no proxy/ETF substitution and no credential material.');
