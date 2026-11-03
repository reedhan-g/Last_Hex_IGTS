import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as engine from './dist/engine.mjs';
class Element {
 constructor(){this.children=[];this.style={};this.dataset={};this.classList={toggle(){}};this.value='local';this.open=false;this.checked=false;this.attributes={}}
 set innerHTML(value){this.html=value;this.children=[]} get innerHTML(){return this.html}
 setAttribute(k,v){this.attributes[k]=v} append(...children){this.children.push(...children)} replaceChildren(){this.children=[]}
 focus(){} showModal(){this.open=true} close(){this.open=false;this.onclose?.()}
}
const source=fs.readFileSync('dist/app.mjs','utf8').replace(/^import .*?;\n/,'');
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
function boot(coarse=false){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const variants=Object.keys(engine.MODES).map(mode=>Object.assign(new Element(),{dataset:{mode}})),workers=[];
 class Worker {constructor(){workers.push(this)}postMessage(){}terminate(){this.terminated=true}}
 const context=vm.createContext({...engine,document:{getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>variants},localStorage:storage,matchMedia:()=>({matches:coarse}),setTimeout:()=>1,clearTimeout(){},Worker});vm.runInContext(source,context);
 return {get,variants,workers,context};
}
const {get,variants,workers,context}=boot(true),click=i=>get('board').children[i].onclick();
assert.equal(get('tapTwice').checked,true,'touch default');
click(0);assert.equal(get('tealCount').textContent,0);assert.match(get('placementStatus').textContent,/Tap again to place/);
assert.equal(get('board').children[0].attributes['aria-pressed'],'true');
click(1);assert.equal(get('tealCount').textContent,0);assert.equal(get('board').children[0].attributes['aria-pressed'],'false');
// A large clock change must not expire the first tap.
vm.runInContext('Date.now=()=>9999999999999',context);
click(1);assert.equal(get('tealCount').textContent,1);assert.equal(get('placementStatus').hidden,true);
click(2);assert.equal(get('coralCount').textContent,0);click(2);assert.equal(get('coralCount').textContent,1);
get('newGame').onclick();assert.equal(get('resetConfirm').open,true);assert.equal(get('tealCount').textContent,1);
get('resetKeep').onclick();assert.equal(get('resetConfirm').open,false);assert.equal(get('tealCount').textContent,1);
get('opponent').value='hard';get('opponent').onchange();assert.equal(get('opponent').value,'local');get('resetKeep').onclick();assert.equal(get('opponent').value,'local');
variants[2].onclick();assert.equal(get('roundMode').textContent,'CLASSIC');get('resetConfirm').oncancel();get('resetConfirm').close();assert.equal(get('roundMode').textContent,'CLASSIC');
variants[2].onclick();get('resetDiscard').onclick();assert.equal(get('roundMode').textContent,'RIPPLE');assert.equal(get('tealCount').textContent,0);
get('tapTwice').checked=false;get('tapTwice').onchange();click(0);assert.equal(get('tealCount').textContent,1);
get('opponent').value='hard';get('opponent').onchange();get('resetDiscard').onclick();assert.equal(get('opponent').value,'hard');assert.equal(get('tealCount').textContent,0);
click(0);assert.equal(workers.length,1);get('newGame').onclick();get('resetKeep').onclick();assert.equal(workers[0].terminated,undefined,'cancel must preserve background search');
get('newGame').onclick();get('resetDiscard').onclick();assert.equal(workers[0].terminated,true);assert.equal(get('tealCount').textContent,0);await Promise.resolve();assert.equal(get('coralCount').textContent,0);
get('tapTwice').checked=true;get('tapTwice').onchange();click(1);get('tapTwice').checked=false;get('tapTwice').onchange();assert.equal(get('placementStatus').hidden,true);
assert.equal(boot(true).get('tapTwice').checked,false,'saved choice overrides touch default');
console.log('Passed: untimed two-tap selection, switching cells, immediate mode, touch defaults, saved preference, reset/opponent/rule confirm and cancel, and worker cancellation.');
