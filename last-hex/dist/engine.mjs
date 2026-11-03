// Six rows of 1, 2, 3, 4, 5 and 6 cells form a triangular hex lattice.
export const CELLS=Array.from({length:6},(_,r)=>Array.from({length:r+1},(_,c)=>[c-r,r])).flat();
export const N=CELLS.length;
export const MODES={
 classic:{name:'Classic',icon:'⬡',tag:'Every number matters.',description:'Add the placed numbers on edge-sharing neighbors. More points loses.'},
 weighted:{name:'High stakes',icon:'×',tag:'Five tiles. Double danger.',description:'Five marked ×2 spaces double the number placed there. Only edge-sharing neighbors count.'},
 ripple:{name:'Ripple',icon:'◎',tag:'Two rings of danger.',description:'Adjacent numbers count twice; numbers two hex steps away count once.'},
 odd:{name:'Odd trouble',icon:'⁕',tag:'Odd numbers hit harder.',description:'Adjacent odd numbers count twice. Adjacent even numbers count normally.'},
 echo:{name:'Outer ring',icon:'◌',tag:'Skip the closest tiles.',description:'Only numbers exactly two hex steps from the final empty hex count.'},
 shield:{name:'Safety net',icon:'◇',tag:'Your biggest number is safe.',description:'Add adjacent numbers, then ignore each player’s single highest adjacent number.'}
};
export const distance=(a,b)=>{const q=CELLS[a][0]-CELLS[b][0],r=CELLS[a][1]-CELLS[b][1];return (Math.abs(q)+Math.abs(r)+Math.abs(q+r))/2};
const distances=CELLS.map((_,i)=>CELLS.map((__,j)=>distance(i,j)));
export const nextNumber=board=>Math.floor(board.filter(x=>x!==null).length/2)+1;
export const legalMoves=board=>board.flatMap((x,i)=>x===null?[i]:[]);
export function scoringFactor(i,last,value,variant,bonuses){const d=distances[i][last];if(variant==='ripple')return d===1?2:d===2?1:0;if(variant==='echo')return d===2?1:0;if(d!==1)return 0;if(variant==='weighted')return bonuses[i];if(variant==='odd')return value%2?2:1;return 1}
export function pressure(board,last,values,variant,bonuses=Array(N).fill(1)){
 const sums=[0,0],largest=[0,0];
 board.forEach((owner,i)=>{if(owner===null)return;const points=values[i]*scoringFactor(i,last,values[i],variant,bonuses);sums[owner]+=points;largest[owner]=Math.max(largest[owner],points)});
 return variant==='shield'?sums.map((sum,i)=>sum-largest[i]):sums;
}
export function outcome(board,values,variant,bonuses){const empty=legalMoves(board);if(empty.length!==1)return null;const scores=pressure(board,empty[0],values,variant,bonuses);return {last:empty[0],scores,loser:scores[0]===scores[1]?null:scores[0]>scores[1]?0:1}}
export function place(board,values,cell,player){if(!Number.isInteger(cell)||cell<0||cell>=N||board[cell]!==null||legalMoves(board).length<=1)return false;const expected=board.filter(x=>x!==null).length%2;if(player!==expected)return false;values[cell]=nextNumber(board);board[cell]=player;return true}
export function makeBonuses(variant,rng=Math.random){const bonuses=Array(N).fill(1);if(variant==='weighted'){const ids=Array.from({length:N},(_,i)=>i);for(let i=N-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}ids.slice(0,5).forEach(i=>bonuses[i]=2)}return bonuses}
export function bestMove(inputBoard,turn,inputValues,variant,bonuses=Array(N).fill(1),options={}){
 const board=[...inputBoard],values=[...inputValues],legal=legalMoves(board),rng=options.rng??Math.random;
 if(legal.length<=1)return null;
 const utility=result=>result.loser===null?0:result.loser===turn?-1:1;
 // Exhaustive alpha-beta search is bounded to the final six moves.
 if(legal.length<=(options.exactLimit??7)){
  function solve(player,alpha,beta){const result=outcome(board,values,variant,bonuses);if(result)return utility(result);const number=nextNumber(board);let best=player===turn?-2:2;
   for(const i of legalMoves(board)){board[i]=player;values[i]=number;const score=solve(1-player,alpha,beta);board[i]=null;values[i]=0;
    if(player===turn){best=Math.max(best,score);alpha=Math.max(alpha,best)}else{best=Math.min(best,score);beta=Math.min(beta,best)}if(beta<=alpha)break;
   }return best;
  }
  let chosen=legal[0],best=-2;for(const i of legal){const number=nextNumber(board);board[i]=turn;values[i]=number;const score=solve(1-turn,-2,2);board[i]=null;values[i]=0;if(score>best){best=score;chosen=i}}return chosen;
 }
 // Earlier play estimates each move from independent random completions.
 let chosen=legal[0],best=-Infinity;const samples=options.samples??160;
 for(const candidate of legal){let total=0;for(let sample=0;sample<samples;sample++){
   const b=[...board],v=[...values];let moves=N-legal.length;v[candidate]=Math.floor(moves/2)+1;b[candidate]=turn;moves++;let player=1-turn;
   const remaining=legal.filter(i=>i!==candidate);for(let i=remaining.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}
   const last=remaining.pop();for(const cell of remaining){v[cell]=Math.floor(moves/2)+1;b[cell]=player;player=1-player;moves++}
   const scores=pressure(b,last,v,variant,bonuses);const delta=scores[1-turn]-scores[turn];total+=Math.sign(delta)+delta/1000;
  }const mean=total/samples;if(mean>best){best=mean;chosen=candidate}
 }return chosen;
}

export const OPPONENTS={
 local:{name:'Player 2',description:'Pass the device. Take turns as Teal and Coral.'},
 weak:{name:'Rookie',description:'A relaxed opponent that picks random legal spaces.'},
 normal:{name:'Pro',description:'Simulates possible games and solves the last four moves.'},
 hard:{name:'Final Boss',description:'Searches opposing replies and solves the last seven moves. Still beatable.'}
};
export function chooseMove(board,turn,values,variant,bonuses,difficulty='normal',options={}){
 const legal=legalMoves(board),rng=options.rng??Math.random;
 if(legal.length<=1)return null;
 if(difficulty==='weak')return legal[Math.floor(rng()*legal.length)];
 if(difficulty!=='hard')return bestMove(board,turn,values,variant,bonuses,{...options,samples:options.samples??80,exactLimit:5});
 if(legal.length<=8)return bestMove(board,turn,values,variant,bonuses,{...options,exactLimit:8});
 return treeMove(board,turn,values,variant,bonuses,options);
}
// Bounded adversarial Monte Carlo tree search. Nodes store moves, never boards.
function treeMove(board,turn,values,variant,bonuses,options){
 const rng=options.rng??Math.random,limit=options.iterations??16000,nodeLimit=options.nodeLimit??6000;
 const deadline=performance.now()+(options.timeMs??1200),initial=legalMoves(board),occupied=N-initial.length;
 const node=(move,player,untried)=>({move,player,untried,children:[],visits:0,total:0});
 const root=node(null,turn,[...initial]);let nodes=1,iterations=0;
 for(;iterations<limit;iterations++){
  if(iterations>0&&iterations%32===0&&performance.now()>=deadline)break;
  const b=[...board],v=[...values],path=[root];let current=root,moves=occupied;
  const apply=child=>{b[child.move]=current.player;v[child.move]=Math.floor(moves/2)+1;moves++;current=child;path.push(child)};
  while(current.untried.length===0&&current.children.length){
   let selected=null,best=-Infinity;
   for(const child of current.children){const value=(current.player===turn?1:-1)*child.total/child.visits+1.4*Math.sqrt(Math.log(current.visits+1)/child.visits);if(value>best){best=value;selected=child}}
   apply(selected);
  }
  if(current.untried.length&&N-moves>1&&nodes<nodeLimit){
   const index=Math.floor(rng()*current.untried.length),move=current.untried.splice(index,1)[0];
   const remaining=legalMoves(b).filter(i=>i!==move),child=node(move,1-current.player,remaining.length>1?remaining:[]);
   current.children.push(child);nodes++;apply(child);
  }
  const remaining=legalMoves(b);for(let i=remaining.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}
  const last=remaining.pop();let player=current.player;
  for(const cell of remaining){b[cell]=player;v[cell]=Math.floor(moves/2)+1;moves++;player=1-player}
  const scores=pressure(b,last,v,variant,bonuses),reward=Math.sign(scores[1-turn]-scores[turn]);
  for(const item of path){item.visits++;item.total+=reward}
 }
 if(options.stats)Object.assign(options.stats,{nodes,iterations});
 return root.children.reduce((best,child)=>!best||child.visits>best.visits?child:best,null)?.move??initial[0];
}
