const fs=require('node:fs'),path=require('node:path'),{buildSync}=require('esbuild'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'scripts/Popular Scripting');let count=0;
for(const file of fs.readdirSync(dir).filter(n=>/\.tsx?$/.test(n))){
 buildSync({entryPoints:[path.join(dir,file)],bundle:true,write:false,format:'cjs',platform:'neutral',external:['scripting'],target:'es2022',jsxFactory:'createElement',jsxFragment:'Fragment'});count++;
}
const version=JSON.parse(fs.readFileSync(path.join(dir,'script.json'),'utf8')).version;
if(process.argv.includes('--manifest')){
 const cp=require('node:child_process');
 const files=cp.execFileSync('git',['ls-files','--cached'],{cwd:root,encoding:'utf8',windowsHide:true}).trim().split('\n');
 const hashes={};for(const relative of [...new Set(files)].sort()){
  if(relative==='distribution-manifest.json'||relative.startsWith('validation/')||relative.startsWith('data/'))continue;
  const canonical=cp.execFileSync('git',['show',':'+relative],{cwd:root,windowsHide:true});
  hashes[relative]=crypto.createHash('sha256').update(canonical).digest('hex');
 }
 fs.writeFileSync(path.join(root,'distribution-manifest.json'),JSON.stringify({version,dataPath:'data/economic-series.json',dataUpdatesIndependently:true,files:hashes},null,2)+'\n');
}
console.log(JSON.stringify({version,syntaxAndImports:true,modules:count,nativeTypes:'pending-iPhone'}));
