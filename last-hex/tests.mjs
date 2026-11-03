import assert from 'node:assert/strict';
import {CELLS,N,MODES,distance,pressure,outcome,place,nextNumber,legalMoves,bestMove,makeBonuses,chooseMove} from './dist/engine.mjs';
assert.equal(N,21);assert.equal(new Set(CELLS.map(String)).size,21);assert.deepEqual([0,1,2,3,4,5].map(r=>CELLS.filter(c=>c[1]===r).length),[1,2,3,4,5,6]);
for(let i=0;i<N;i++)for(let j=0;j<N;j++)assert.equal(distance(i,j),distance(j,i));
let seed=12345;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const blank=()=>Array(N).fill(null),zero=()=>Array(N).fill(0);
let board=blank(),values=zero();assert.equal(place(board,values,0,1),false);assert.equal(place(board,values,0,0),true);assert.equal(values[0],1);assert.equal(place(board,values,0,1),false);assert.equal(place(board,values,1,1),true);assert.equal(values[1],1);assert.equal(place(board,values,2,0),true);assert.equal(values[2],2);assert.equal(nextNumber(board),2);
// Concrete triangle corner fixture: only cells 2 and 3 share an edge with cell 1.
board=blank();values=zero();board[1]=0;values[1]=3;board[2]=1;values[2]=4;board[3]=0;values[3]=5;
assert.deepEqual(pressure(board,0,values,'classic'),[3,4]);assert.deepEqual(pressure(board,0,values,'ripple'),[11,8]);assert.deepEqual(pressure(board,0,values,'odd'),[6,4]);assert.deepEqual(pressure(board,0,values,'echo'),[5,0]);assert.deepEqual(pressure(board,0,values,'shield'),[0,0]);let bonuses=Array(N).fill(1);bonuses[1]=2;assert.deepEqual(pressure(board,0,values,'weighted',bonuses),[6,4]);
assert.equal(makeBonuses('weighted',rng).filter(x=>x===2).length,5);
for(const mode of Object.keys(MODES)){for(let run=0;run<50;run++){const b=blank(),v=zero(),bon=makeBonuses(mode,rng);for(let move=0;move<20;move++){const ids=legalMoves(b),i=ids[Math.floor(rng()*ids.length)];assert.ok(place(b,v,i,move%2));assert.equal(v[i],Math.floor(move/2)+1);assert.equal(Boolean(outcome(b,v,mode,bon)),move===19)}assert.equal(legalMoves(b).length,1);assert.equal(place(b,v,legalMoves(b)[0],0),false);for(let p=0;p<2;p++)assert.deepEqual(v.filter((_,i)=>b[i]===p).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);}}
function oracle(b,v,p,root,mode,bon){const r=outcome(b,v,mode,bon);if(r)return r.loser===null?0:r.loser===root?-1:1;const scores=legalMoves(b).map(i=>{const nb=[...b],nv=[...v];place(nb,nv,i,p);return oracle(nb,nv,1-p,root,mode,bon)});return p===root?Math.max(...scores):Math.min(...scores)}
for(const mode of Object.keys(MODES)){for(let trial=0;trial<6;trial++){const b=blank(),v=zero(),bon=makeBonuses(mode,rng);for(let m=0;m<16;m++){const ids=legalMoves(b);place(b,v,ids[Math.floor(rng()*ids.length)],m%2)}const expected=oracle(b,v,0,0,mode,bon),before=JSON.stringify([b,v]),choice=bestMove(b,0,v,mode,bon);assert.equal(JSON.stringify([b,v]),before);place(b,v,choice,0);assert.equal(oracle(b,v,1,0,mode,bon),expected)}}
const started=Date.now();for(const mode of Object.keys(MODES)){const b=blank(),v=zero(),bon=makeBonuses(mode,rng);for(let m=0;m<20;m++){const ids=legalMoves(b);const choice=m%2?bestMove(b,1,v,mode,bon,{rng,samples:40}):ids[Math.floor(rng()*ids.length)];assert.ok(place(b,v,choice,m%2))}assert.ok(outcome(b,v,mode,bon))}
console.log('Passed: triangular geometry; sequential numbers and turn order; all six scoring modes; 300 complete rounds; 36 independent endgame comparisons; 6 strategy games in '+(Date.now()-started)+'ms.');

for(const mode of Object.keys(MODES))for(const difficulty of ['weak','normal','hard']){
 const b=blank(),v=zero(),bon=makeBonuses(mode,rng),stats={};
 for(let m=0;m<20;m++){
  const before=JSON.stringify([b,v]);const choice=chooseMove(b,m%2,v,mode,bon,difficulty,{rng,iterations:500,nodeLimit:100,timeMs:Infinity,stats});
  assert.equal(JSON.stringify([b,v]),before);assert.ok(place(b,v,choice,m%2));
 }
 assert.ok(outcome(b,v,mode,bon));assert.ok((stats.nodes??0)<=100);
 assert.equal(chooseMove(b,0,v,mode,bon,difficulty),null);
}
for(const difficulty of ['normal','hard'])for(const mode of Object.keys(MODES)){
 const b=blank(),v=zero(),bon=makeBonuses(mode,rng);
 for(let m=0;m<16;m++){const ids=legalMoves(b);place(b,v,ids[Math.floor(rng()*ids.length)],m%2)}
 const expected=oracle(b,v,0,0,mode,bon),choice=chooseMove(b,0,v,mode,bon,difficulty,{rng});place(b,v,choice,0);assert.equal(oracle(b,v,1,0,mode,bon),expected);
}
console.log('Passed: all three difficulties across all six modes; bounded search nodes; input immutability; both search tiers match independent endgame oracle.');
