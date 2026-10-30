const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'Popular Scripting'),view=fs.readFileSync(path.join(root,'view.tsx'),'utf8'),badges=fs.readFileSync(path.join(root,'badges.js'),'utf8');

assert.match(view,/custom=!remoteSvg&&!remoteIcon&&\[[^\n]*'USD\/BRL'\]/,'USD/BRL uses the custom badge path unless an API image decoded successfully');
assert.match(view,/function apiSVG\(row:any\)/,'API SVG metadata has a native rendering path');
assert.match(view,/<SVG key="asset-remote-svg" url=\{remoteSvg\}/,'SVG logos are rendered from the API URL without a proxy');
assert.doesNotMatch(badges,/\$|dollar/i,'the badge renderer contains no currency glyph overlay');
assert.match(badges,/INITIAL_BADGES=.*BBAS3:'BB'.*BBDC4:'BD'.*IBOV:'IB'.*'BTC\/USD':'BTC'/,'the four published test assets have explicit neutral initial fallbacks');
assert.match(view,/const NAME_FONT_MIN=3\.6/,'compact names can shrink below the old truncating floor');
assert.match(view,/minScaleFactor=\{0\.72\}/,'native text has a bounded fallback scale instead of ellipsis');

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

for(const code of ['BBAS3','BBDC4','IBOV','BTC/USD']){
  const rendered=nativeContext();badgeModule.exports.drawBadge(rendered.native,code);
  const fillsForCode=rendered.state.calls.filter(call=>call.op==='fill');
  assert.equal(fillsForCode.filter(call=>call.style==='#34343A').length,1,`${code} uses one neutral circular fallback disk`);
  assert(fillsForCode.some(call=>call.style==='#FFFFFF'&&call.path.some(op=>op[0]==='rect')),`${code} renders readable vector initials, not the generic document glyph`);
}
console.log(JSON.stringify({version:'0.2.33',icons:['BBAS3','BBDC4','IBOV','BTC/USD'],shape:'26pt circular neutral initials fallback',glyphOverlay:false,smallAndMediumPath:'custom Canvas badge',nativeIPhone:false}));
