const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'Popular Scripting');
const view=fs.readFileSync(path.join(root,'view.tsx'),'utf8');
const intents=fs.readFileSync(path.join(root,'app_intents.tsx'),'utf8');
const control=fs.readFileSync(path.join(root,'control_widget_button.tsx'),'utf8');
const model=fs.readFileSync(path.join(root,'model.ts'),'utf8');
const script=JSON.parse(fs.readFileSync(path.join(root,'script.json'),'utf8'));

assert.equal(script.version,'0.2.10');
assert.match(view,/import \{ Canvas, Image, Rectangle, Text, ZStack, Script \} from 'scripting'/);
assert.match(view,/widgetURL=\{Script\.createRunURLScheme\("Meu Painel", \{ section: "market" \}\)\}/);
assert.doesNotMatch(view,/NextPopularPage|Button intent=|opacity=\{0\.001\}/);
assert.doesNotMatch(view,/scripting-home|install|reloadWidgets|loadModel\(/);
assert.match(intents,/export const RefreshPopular=/);
assert.match(intents,/export const NextPopularPage=/,'Pagination intent remains available as a compatibility export; the asset tap no longer invokes it.');
assert.match(control,/RefreshPopular/);
assert.match(model,/sagittaryuz-dashboard-v1:Popular/);

// Contract reference: the official Scripting helper produces this URL. The
// widget does not detect/install Meu Painel and therefore cannot loop/fallback.
const expected='scripting://run/Meu%20Painel?section=market';
assert.equal(`scripting://run/${encodeURIComponent('Meu Painel')}?section=${encodeURIComponent('market')}`,expected);
console.log(JSON.stringify({version:script.version,assetTap:'Script.createRunURLScheme',expectedURL:expected,section:'market',explicitRefresh:'RefreshPopular',fallback:'none',loop:false,nativeIPhone:false}));
