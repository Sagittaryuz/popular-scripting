const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');

const root=path.join(__dirname,'Popular Scripting'),privateSource=fs.readFileSync(path.join(root,'private-market.ts'),'utf8'),hostSource=fs.readFileSync(path.join(root,'host.ts'),'utf8');
const privateCode=buildSync({entryPoints:[path.join(root,'private-market.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const hostCode=buildSync({entryPoints:[path.join(root,'host.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const keychain=new Map(),storage=new Map(),requests=[];let allowKeychainWrite=true;
const Keychain={contains:key=>keychain.has(key),get:key=>keychain.get(key),set:(key,value)=>{if(!allowKeychainWrite)return false;keychain.set(key,value);return true},remove:key=>{keychain.delete(key);return true}};
const Storage={get:key=>storage.get(key),contains:key=>storage.has(key),set:(key,value)=>{storage.set(key,value);return true}};
const context={module:{exports:{}},exports:{},Keychain,Storage,Date,URL,Map,Set,JSON,Uint8Array,ArrayBuffer,console:{log(){}},setTimeout,clearTimeout,Data:{},fetch:async(url,options)=>{requests.push({url:String(url),options});return {status:200,ok:true,text:async()=>'{"ok":true}'}}};
vm.runInNewContext(privateCode,context);
const privateApi=context.module.exports;
assert.equal(privateApi.readPrivateMarketToken(),null,'missing Keychain value is represented as unconfigured');
assert.throws(()=>privateApi.savePrivateMarketToken('too-short'),/inválido/);
const token='fixture-private-token-'.padEnd(64,'x');
privateApi.savePrivateMarketToken('  '+token+'  ');
assert.equal(privateApi.readPrivateMarketToken(),token,'foreground setup trims only outer whitespace before Keychain storage');
assert.equal(keychain.size,1);
allowKeychainWrite=false;assert.throws(()=>privateApi.savePrivateMarketToken(token),/salvar o token/,'a failed native Keychain write is not reported as saved');allowKeychainWrite=true;
privateApi.removePrivateMarketToken();assert.equal(privateApi.readPrivateMarketToken(),null,'removal affects only the private token key');
keychain.set(privateApi.PRIVATE_MARKET_TOKEN_KEY,token);

async function main(){
const hostModule={exports:{}};
vm.runInNewContext(hostCode,{module:hostModule,exports:hostModule.exports,Keychain,Storage,Date,URL,Map,Set,JSON,Uint8Array,ArrayBuffer,console:{log(){}},setTimeout,clearTimeout,Data:{},fetch:context.fetch});
const hostApi=hostModule.exports,privateURL=privateApi.PRIVATE_MARKET_ENDPOINT;
assert.equal(hostApi.allowedURL(privateURL).href,privateURL);
assert.throws(()=>hostApi.allowedURL('https://dadosb3.com/empresas/BBAS3/precos'),/Destino não autorizado/);
assert.throws(()=>hostApi.allowedURL(privateURL+'?x=1'),/Destino não autorizado/);
const request=new (hostApi.createHost(true).Request)(privateURL);request.headers={Authorization:'Bearer '+token};await request.loadJSON();
assert.equal(requests.length,1,'authenticated private request reaches transport');
assert.equal(requests[0].options.headers.Authorization,'Bearer '+token);
const publicRequest=new (hostApi.createHost(true).Request)('https://brapi.dev/api/quote/list');publicRequest.headers={Authorization:'Bearer '+token};await assert.rejects(()=>publicRequest.loadJSON(),/endpoint privado/);assert.equal(requests.length,1,'public sources never receive the token');
assert.equal(hostApi.createHost().privateMarket.endpoint,privateURL);
assert.equal(typeof hostApi.createHost().privateMarket.readToken,'function');

const details=fs.readFileSync(path.join(root,'details.tsx'),'utf8');
assert.match(details,/Dialog\.prompt/,'token setup uses the Scripting dialog API');
assert.match(details,/obscureText:true/,'the Scripting prompt obscures the token');
assert.doesNotMatch(details,/new Alert|addSecureTextField|presentAlert|textFieldValue/,'the client does not use Scriptable-only alert APIs');
assert.match(details,/savePrivateMarketToken/);
assert.match(details,/removePrivateMarketToken/);
assert.match(hostSource,/PRIVATE_MARKET_ENDPOINT/);
assert.match(privateSource,/Keychain/);
assert.doesNotMatch(privateSource,/Storage\.set|FileManager|console\.log/,'token helper has no file/storage/log write path');
console.log('PASS private market client: Keychain-only setup/removal, exact endpoint allowlist, authenticated transport, public-header rejection, and no token persistence path. Native iPhone prompt and Worker end-to-end remain untested here.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
