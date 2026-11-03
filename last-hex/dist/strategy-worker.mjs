import {chooseMove} from './engine.mjs';
self.onmessage=({data:d})=>{try{self.postMessage({move:chooseMove(d.board,d.turn,d.values,d.variant,d.bonuses,d.difficulty)})}catch{self.postMessage({error:true})}};
