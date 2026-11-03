import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as engine from './dist/engine.mjs';
class Element {
 constructor(){this.children=[];this.style={};this.dataset={};this.classList={toggle(){}};this.value='local'}
 set innerHTML(value){this.html=value;this.children=[]} get innerHTML(){return this.html}
 setAttribute(){} append(...children){this.children.push(...children)} replaceChildren(){this.children=[]}
}
const source=fs.readFileSync('dist/app.mjs','utf8').replace(/^import .*?;\n/,'');
function boot(storage){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const context=vm.createContext({...engine,document:{getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>[]},localStorage:storage,setTimeout,clearTimeout});vm.runInContext(source,context);
 return {get,context};
}
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
let app=boot(storage);const records=()=>JSON.parse(data.get('last-hex-results-v1')||'[]');
assert.equal(app.get('recentCount').textContent,'0 / 5');
for(let game=0;game<6;game++){
 app.get('newGame').onclick();
 for(let i=0;i<19;i++)app.get('board').children[(i+game)%21].onclick();
 assert.equal(records().length,Math.min(game,5),'unfinished game must not be recorded');
 app.get('board').children[(19+game)%21].onclick();
 assert.equal(records().length,Math.min(game+1,5));
 const [entry]=records();assert.equal(entry.last,(20+game)%21);
 const b=Array(21).fill(null),v=Array(21).fill(0);for(let i=0;i<20;i++)engine.place(b,v,(i+game)%21,i%2);
 assert.deepEqual(entry.scores,engine.outcome(b,v,'classic').scores);
 assert.equal(app.get('recentResults').children.length,Math.min(game+1,5));
 assert.match(app.get('recentResults').children[0].children[1].children[0].textContent,/Teal \d+/);
}
const saved=records();app.get('undo').onclick();assert.equal(records().length,5,'restore the five older games after undo');app.get('board').children[3].onclick();assert.deepEqual(records(),saved,'re-finishing must not duplicate result');
app.get('newGame').onclick();assert.deepEqual(records(),saved);
app=boot(storage);assert.deepEqual(records(),saved);assert.equal(app.get('recentResults').children.length,5,'results survive reload');
assert.doesNotThrow(()=>boot({getItem:()=>'{broken',setItem(){throw Error('blocked')}}));
console.log('Passed: completed-only recording, correct final totals, five-result limit, undo/re-finish, restart, reload, and corrupt/blocked storage.');
