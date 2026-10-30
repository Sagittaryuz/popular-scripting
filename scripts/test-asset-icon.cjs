const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'Popular Scripting'),view=fs.readFileSync(path.join(root,'view.tsx'),'utf8'),engine=fs.readFileSync(path.join(root,'original-engine.js'),'utf8'),badges=fs.readFileSync(path.join(root,'badges.js'),'utf8');
const previewDir=path.join(root,'..','..','validation'),previewJSON=JSON.parse(fs.readFileSync(path.join(previewDir,'icon-name-0.2.39-preview.json'),'utf8')),previewSVG=fs.readFileSync(path.join(previewDir,'icon-name-0.2.39-preview.svg'),'utf8'),previewPNG=path.join(previewDir,'icon-name-0.2.39-preview.png');
assert.equal(previewJSON.version,'0.2.39','the icon/name regression preview remains tied to its historical package');
assert.equal(previewJSON.identity.statusDot,false,'the preview records that no status dot is drawn');
assert.equal(previewJSON.data.live,false,'the preview does not claim live data');
assert(fs.statSync(previewPNG).size>100,'the raster preview was materialized for pixel inspection');
assert.match(previewSVG,/API SVG body: BBAS3\/BBDC4/,'the preview identifies its SVG fixtures');

assert.match(view,/function apiSVG\(row:any\)/,'API SVG metadata has a native rendering path');
assert.match(view,/iconSVGCode/,'the view consumes validated inline SVG returned by the engine');
assert.match(view,/const FALLBACK_BADGE_CODES=Object\.freeze\(\['BBAS3','BBDC4','IBOV','DOW_JONES','BTC\/USD'/,'published assets have explicit fallback badges even when a remote SVG URL is present');
assert.match(view,/function fallbackIcon\(row:any,plan:any,rowPlan:any,positioned=true\)/,'the fallback is a reusable native view rather than a preview-only substitute');
assert.match(view,/<SVG key="asset-inline-svg" code=\{remoteSvg\}/,'SVG logos are rendered from validated inline API code without a proxy');
const remoteBranch=view.indexOf('{remoteSvg?<ZStack');
const fallbackBeforeSVG=view.indexOf('{fallbackIcon(row,plan,rowPlan,true)}');
const remoteRenderer=view.indexOf('<SVG key="asset-inline-svg"',remoteBranch);
assert(remoteBranch>=0&&fallbackBeforeSVG>=0&&remoteRenderer>fallbackBeforeSVG,'a failed inline SVG leaves the neutral badge visible as a sibling outside the mask');
assert.doesNotMatch(view,/fallbackIcon\(row,plan,rowPlan,false\)/,'the fallback is never placed inside the SVG mask');
assert.match(engine,/function safeSVGCode\(value\)/,'SVG code is validated before entering the native view');
assert.match(engine,/contentType=String\(r\.response\?\.contentType\|\|''\)/,'the SVG response MIME is checked');
assert.match(engine,/iconSVGCode:code/,'the active private profile fetches and stores validated SVG code');
assert.match(engine,/Promise\.all\(parsed\.map\(attachApiIcon\)\)/,'the active profile attaches API logos instead of leaving URL-only metadata');
assert.doesNotMatch(badges,/\$|dollar/i,'the badge renderer contains no currency glyph overlay');
assert.match(badges,/INITIAL_BADGES=.*BBAS3:'BB'.*BBDC4:'BD'.*'BTC\/USD':'BTC'/,'legacy profile initials remain available only for the recoverable B3/BTC profile');
assert.doesNotMatch(badges,/INITIAL_BADGES=.*IBOV:/,'Ibovespa no longer uses initials as its published icon');
assert.doesNotMatch(badges,/INITIAL_BADGES=.*DOW_JONES:/,'Dow Jones no longer uses initials as its published icon');
assert.doesNotMatch(badges,/INITIAL_BADGES=.*BRENT:/,'Brent no longer uses initials as its published icon');
assert.match(badges,/function drawIndexBadge\(code\)/,'index and Dow use local vector pictograms');
assert.match(badges,/function drawOilBadge\(\)/,'Brent uses a local oil-barrel pictogram');
assert.match(view,/const NAME_FONT=5\.5/,'all names use one fixed native font size');
assert.match(view,/minScaleFactor=\{1\}/,'native text uses ellipsis without per-name font shrinking');
assert.doesNotMatch(view,/market-status-dot/,'the status dot is removed from the compact identity column');

const bundled=buildSync({entryPoints:[path.join(root,'badges.js')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const badgeModule={exports:{}};
vm.runInNewContext(bundled,{module:badgeModule,exports:badgeModule.exports,Math});

function nativeContext(){
  const state={calls:[],fillStyle:null,strokeStyle:null,lineWidth:0,path:[]};
  const native={
    beginPath(){state.path=[];state.calls.push({op:'beginPath'});},
    moveTo(...args){state.path.push(['moveTo',...args]);},
    lineTo(...args){state.path.push(['lineTo',...args]);},
    closePath(){state.path.push(['closePath']);},
    rect(...args){state.path.push(['rect',...args]);},
    ellipse(...args){state.path.push(['ellipse',...args]);},
    fill(){state.calls.push({op:'fill',style:this.fillStyle,path:state.path.slice()});},
    stroke(){state.calls.push({op:'stroke',style:this.strokeStyle,path:state.path.slice()});},
    save(){state.calls.push({op:'save'});},
    clip(){state.calls.push({op:'clip',path:state.path.slice()});},
    restore(){state.calls.push({op:'restore'});}
  };
  Object.defineProperties(native,{fillStyle:{get:()=>state.fillStyle,set:value=>{state.fillStyle=value;}},strokeStyle:{get:()=>state.strokeStyle,set:value=>{state.strokeStyle=value;}},lineWidth:{get:()=>state.lineWidth,set:value=>{state.lineWidth=value;}}});
  return {native,state};
}

const {native,state}=nativeContext();
badgeModule.exports.drawBadge(native,'USD/BRL');
const fills=state.calls.filter(call=>call.op==='fill');
assert.equal(state.calls.filter(call=>call.op==='save').length,1,'USD flag saves the canvas state once');
assert.equal(state.calls.filter(call=>call.op==='clip').length,1,'USD flag uses one circular clipping path');
assert.equal(state.calls.filter(call=>call.op==='restore').length,1,'USD flag restores the canvas state once');
assert.equal(state.calls.filter(call=>call.op==='stroke').length,0,'USD flag has no overlaid glyph or emblem stroke');
assert.equal(fills.filter(call=>call.style==='#B22234').length,7,'USD flag has seven red stripes');
assert.equal(fills.filter(call=>call.style==='#FFFFFF').length,56,'USD flag has six white stripes and 50 visible star marks');
assert.equal(fills.filter(call=>call.style==='#3C3B6E').length,1,'USD flag has one blue canton');
assert.equal(fills.filter(call=>call.path.some(op=>op[0]==='rect')).length,14,'USD flag draws thirteen stripes and one canton as rectangles');
assert.equal(fills.filter(call=>call.path.some(op=>op[0]==='ellipse')).length,50,'USD flag draws 50 stars as part of the flag');
assert.equal(state.calls.at(-1).op,'restore','USD flag closes its clipping scope');

for(const code of ['BBAS3','BBDC4','BTC/USD']){
  const rendered=nativeContext();badgeModule.exports.drawBadge(rendered.native,code);
  const fillsForCode=rendered.state.calls.filter(call=>call.op==='fill');
  assert.equal(fillsForCode.filter(call=>call.style==='#34343A').length,1,`${code} uses one neutral circular fallback disk`);
  assert(fillsForCode.some(call=>call.style==='#FFFFFF'&&call.path.some(op=>op[0]==='rect')),`${code} renders readable vector initials, not the generic document glyph`);
}
for(const [code,diskColor] of [['IBOV','#245E8A'],['DOW_JONES','#2D486E'],['BRENT','#7A4E20']]){
  const rendered=nativeContext();badgeModule.exports.drawBadge(rendered.native,code);
  const fillsForCode=rendered.state.calls.filter(call=>call.op==='fill'),strokesForCode=rendered.state.calls.filter(call=>call.op==='stroke');
  assert.equal(fillsForCode.filter(call=>call.style===diskColor).length,1,`${code} has one local pictogram disk`);
  assert(strokesForCode.length>0||fillsForCode.some(call=>call.path.some(op=>op[0]==='rect')),`${code} has recognizable vector icon geometry`);
  assert.equal(fillsForCode.filter(call=>call.style==='#34343A').length,0,`${code} does not use the neutral initials disk`);
}
console.log(JSON.stringify({version:'0.2.41',icons:['IBOV index trend','DOW_JONES market bars','USD/BRL circular US flag','BRENT oil barrel'],shape:'26pt circular local vector pictograms with no remote logo dependency',glyphOverlay:false,identity:'full column, shared 5.5pt semibold, native ellipsis, no status dot',smallAndMediumPath:'validated SVG.code with sibling fallback',nativeIPhone:false}));
