import {CELLS,N,MODES,scoringFactor,pressure,outcome,chooseMove,OPPONENTS,nextNumber,place,legalMoves,makeBonuses} from './engine.mjs';
const $=id=>document.getElementById(id),names=['Teal','Coral'];
let board=Array(N).fill(null),values=Array(N).fill(0),bonuses=makeBonuses('classic'),variant='classic',history=[],turn=0,inspected=8,thinking=false,epoch=0;
let strategyJob=null,resultsBeforeFinish=null,selectedCell=null,pendingReset=null,opponent='local';
let playMode='local';
let online={code:null,role:null,seat:null,connected:false,status:null,pending:false,state:null};
const TAP_KEY='last-hex-tap-twice-v1';
let tapTwice=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
try{const saved=localStorage.getItem(TAP_KEY);if(saved==='true'||saved==='false')tapTwice=saved==='true'}catch{}
$('tapTwice').checked=tapTwice;
$('tapTwice').onchange=()=>{tapTwice=$('tapTwice').checked;selectedCell=null;try{localStorage.setItem(TAP_KEY,String(tapTwice))}catch{}draw()};
const RESULTS_KEY='last-hex-results-v1';
let recentGames=[];
try{const saved=JSON.parse(localStorage.getItem(RESULTS_KEY)||'[]');if(Array.isArray(saved))recentGames=saved.filter(g=>g&&Object.hasOwn(MODES,g.variant)&&Number.isInteger(g.last)&&g.last>=0&&g.last<N&&Array.isArray(g.scores)&&g.scores.length===2&&g.scores.every(n=>Number.isFinite(n)&&n>=0)).slice(0,5)}catch{}
function saveResults(){try{localStorage.setItem(RESULTS_KEY,JSON.stringify(recentGames))}catch{}}
function recordResult(result){if(!result||resultsBeforeFinish!==null)return;resultsBeforeFinish=recentGames;recentGames=[{variant,last:result.last,scores:[...result.scores]},...recentGames].slice(0,5);saveResults()}
function drawResults(){
 $('recentCount').textContent=`${recentGames.length} / 5`;
 $('recentResults').replaceChildren();
 if(!recentGames.length){const li=document.createElement('li');li.className='empty-results';li.textContent='Finish a game to see its final scores here.';$('recentResults').append(li);return}
 recentGames.forEach((g,index)=>{
  const li=document.createElement('li'),heading=document.createElement('div'),scores=document.createElement('div'),note=document.createElement('div');
  heading.className='game-result-heading';const winner=g.scores[0]===g.scores[1]?'Draw':`${names[g.scores[0]<g.scores[1]?0:1]} wins`;
  heading.textContent=`${index===0?'Latest':index+' game'+(index===1?'':'s')+' ago'} · ${winner}`;
  scores.className='game-result-scores';g.scores.forEach((value,i)=>{const span=document.createElement('span');span.className=i===0?'teal-score':'coral-score';span.textContent=`${names[i]} ${value}`;scores.append(span)});
  note.className='game-result-note';note.textContent=`${MODES[g.variant].name} · Final hex ${g.last+1}`;
  li.append(heading,scores,note);$('recentResults').append(li);
 });
}
const isAI=()=>playMode==='local'&&opponent!=='local';
function draw(){
 const result=outcome(board,values,variant,bonuses),locked=thinking||Boolean(result)||(isAI()&&turn===1)||(playMode==='online'&&!onlineCanMove());
 $('board').innerHTML='';
 CELLS.forEach(([q,r],i)=>{
  const b=document.createElement('button'),owner=board[i];
  b.className='hex'+(selectedCell===i?' selected-cell':'')+(owner!==null?' owner'+owner:'')+(result?.last===i?' last':'')+(result&&scoringFactor(i,result.last,values[i],variant,bonuses)>0?' neighbor':'');
  b.style.left=(50+(q+r/2)*15)+'%';b.style.top=(12+r*15)+'%';b.disabled=locked||owner!==null;
  b.setAttribute('aria-label',`Hex ${i+1}, ${owner===null?'empty':names[owner]+' '+values[i]}${variant==='weighted'&&bonuses[i]===2?', double points':''}`);
  if(tapTwice)b.setAttribute('aria-pressed',String(selectedCell===i));
  b.innerHTML=`<span class="hexid">${result?.last===i?'◎':owner===null?'+':values[i]}</span>${owner===null?'':'<small>'+names[owner].toUpperCase()+'</small>'}${variant==='weighted'&&bonuses[i]===2?'<em>×2</em>':''}`;
  b.onclick=()=>selectHex(i);b.onpointerenter=b.onfocus=()=>{if(owner===null&&selectedCell===null){inspected=i;inspect()}};$('board').append(b);
 });
 $('tealCount').textContent=board.filter(x=>x===0).length;$('coralCount').textContent=board.filter(x=>x===1).length;
 $('moveCount').textContent=result?'ROUND COMPLETE':`MOVE ${String(history.length+1).padStart(2,'0')} / 20`;
 $('roundMode').textContent=MODES[variant].name.toUpperCase();$('turnDot').style.background=turn===0?'var(--teal)':'var(--coral)';
 $('turnText').textContent=result?(result.loser===null?'A perfectly balanced draw.':`${names[1-result.loser]} wins.`):thinking?'Coral is thinking…':`${names[turn]}, place your ${nextNumber(board)}.`;
 $('turnHint').textContent=result?'The final hex stays empty. More danger means defeat.':thinking?`${OPPONENTS[$('opponent').value].name} is choosing a space.`:(tapTwice?'Tap a hex to preview, then tap it again to place.':'You choose the space. The number is automatic.');
 $('placementStatus').hidden=selectedCell===null||Boolean(result);if(selectedCell!==null&&!result){const sums=pressure(board,selectedCell,values,variant,bonuses);$('placementStatus').textContent=`If left empty: Teal ${sums[0]} · Coral ${sums[1]}. Tap again to place ${nextNumber(board)}.`}
 $('nextNumber').textContent=result?'—':nextNumber(board);$('sequence').innerHTML=Array.from({length:10},(_,i)=>`<span class="${i+1<nextNumber(board)||result?'used':i+1===nextNumber(board)?'current':''}">${i+1}</span>`).join('');
 $('result').hidden=!result;if(result){inspected=result.last;$('result').textContent=`Hex ${String(result.last+1).padStart(2,'0')} is last · Teal ${result.scores[0]} : ${result.scores[1]} Coral. ${result.loser===null?'Equal points. Neither player loses.':names[result.loser]+' has more surrounding points and loses.'}`}
 $('undo').disabled=playMode==='online'||!history.length||thinking;drawResults();
 if(board[inspected]!==null)inspected=board.findIndex(x=>x===null);inspect();
}
function inspect(){const sums=pressure(board,inspected,values,variant,bonuses);$('inspectId').textContent=String(inspected+1).padStart(2,'0');for(let i=0;i<2;i++){$('pressure'+i).innerHTML=`${sums[i]}<span> pts</span>`;$('bar'+i).style.width=(sums[i]/Math.max(20,...sums)*100)+'%'}$('riskText').textContent=sums[0]===sums[1]?(sums[0]?'Balanced so far. This would be a draw.':'Even ground. No danger yet.'):`${names[sums[0]>sums[1]?0:1]} carries more danger here.`}
function selectHex(i){
 if(thinking||(isAI()&&turn===1)||(playMode==='online'&&!onlineCanMove())||board[i]!==null||outcome(board,values,variant,bonuses))return;
 if(tapTwice&&selectedCell!==i){selectedCell=i;inspected=i;draw();$('board').children[i].focus({preventScroll:true});return}
 if(playMode==='online'){sendOnlineMove(i);return}
 play(i,'human');
}
function play(i,source){if(source==='human'&&(thinking||(isAI()&&turn===1)))return;if(!place(board,values,i,turn))return;selectedCell=null;history.push({cell:i,player:turn,value:values[i],source});turn=1-turn;recordResult(outcome(board,values,variant,bonuses));draw();if(!outcome(board,values,variant,bonuses)&&isAI()&&turn===1)void bot()}
function askStrategy(difficulty){return new Promise(resolve=>{
 try{const w=new Worker('./strategy-worker.mjs',{type:'module'});
 const finish=move=>{clearTimeout(job.timer);w.terminate();if(strategyJob===job)strategyJob=null;resolve(move)};
 const job={worker:w,resolve:finish,timer:setTimeout(()=>finish(null),5000)};strategyJob=job;
 w.onmessage=({data})=>finish(data.move??null);w.onerror=()=>finish(null);
 w.postMessage({board,values,variant,bonuses,turn,difficulty});
 }catch{resolve(null)}
})}
async function bot(){const round=epoch,difficulty=$('opponent').value;thinking=true;draw();
 let choice=await askStrategy(difficulty);if(round!==epoch)return;
 let source=OPPONENTS[difficulty].name;
 if(!legalMoves(board).includes(choice)){choice=chooseMove(board,turn,values,variant,bonuses,'normal',{samples:30});source='fallback'}
 thinking=false;play(choice,source);
}
function reset(){selectedCell=null;resultsBeforeFinish=null;epoch++;if(strategyJob)strategyJob.resolve(null);board=Array(N).fill(null);values=Array(N).fill(0);bonuses=makeBonuses(variant);history=[];turn=0;thinking=false;inspected=8;$('modeDescription').textContent=MODES[variant].description;$('opponentDescription').textContent=OPPONENTS[$('opponent').value].description;draw()}
function requestReset(action,message){
 if(!history.length||outcome(board,values,variant,bonuses)){action();return}
 pendingReset=action;$('resetMessage').textContent=message;$('resetConfirm').showModal();
}
$('newGame').onclick=()=>requestReset(reset,'Start a new game? Your current round will be lost. Completed game results will stay saved.');
$('opponent').onchange=()=>{const next=$('opponent').value;$('opponent').value=opponent;if(next===opponent)return;requestReset(()=>{opponent=next;$('opponent').value=next;reset()},`Switch to ${OPPONENTS[next].name}? This starts a new round and discards your current moves.`)};
$('resetKeep').onclick=()=>{pendingReset=null;$('resetConfirm').close()};
$('resetDiscard').onclick=()=>{const action=pendingReset;pendingReset=null;$('resetConfirm').close();action?.()};
$('resetConfirm').oncancel=$('resetConfirm').onclose=()=>{pendingReset=null};
$('variants').innerHTML=Object.entries(MODES).map(([key,m])=>`<button data-mode="${key}" class="variant${key===variant?' selected':''}" aria-pressed="${key===variant}"><span class="varianticon">${m.icon}</span><span><strong>${m.name}</strong><small>${m.tag}</small></span><span class="radio"></span></button>`).join('');
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if((playMode==='online'&&online.code)||variant===b.dataset.mode)return;requestReset(()=>{variant=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});reset()},`Switch to ${MODES[b.dataset.mode].name}? This starts a new round and discards your current moves.`)});
$('undo').onclick=()=>{if(playMode==='online')return;selectedCell=null;if(resultsBeforeFinish!==null){recentGames=resultsBeforeFinish;resultsBeforeFinish=null;saveResults()}epoch++;const count=isAI()?Math.min(2,history.length):1;for(let i=0;i<count;i++){const h=history.pop();board[h.cell]=null;values[h.cell]=0;turn=h.player}thinking=false;draw()};
$('rulesOpen').onclick=()=>$('rules').showModal();$('rulesClose').onclick=$('rulesPlay').onclick=()=>$('rules').close();$('rules').onclick=e=>{if(e.target===$('rules')){const r=$('rules').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('rules').close()}};reset();

// Online mode is initialized only when the online controls are present.
if (typeof window !== 'undefined' && $('playMode')) {
 let socket=null, resume=null, lastRecordedGame=null;
 const key='last-hex-online-session-v1';
 const status=msg=>{$('onlineStatus').textContent=msg};
 const save=()=>{try{if(resume)sessionStorage.setItem(key,JSON.stringify(resume));else sessionStorage.removeItem(key)}catch{}};
 const err=e=>{const message=e||'Connection failed.';status(message);for(const [dialog,id] of [['createDialog','createError'],['joinDialog','joinError']])if($(dialog).open){$(id).textContent=message;$(id).hidden=false}};
 $('roomVariant').innerHTML=Object.entries(MODES).map(([key,m])=>`<option value="${key}">${m.name}</option>`).join('');
 $('roomVariant').onchange=()=>{$('roomVariantDescription').textContent=MODES[$('roomVariant').value].description};
 $('openCreate').onclick=()=>{$('roomVariant').value=variant;$('roomVariant').onchange();$('createError').hidden=true;$('createDialog').showModal()};
 $('openJoin').onclick=()=>{$('joinError').hidden=true;$('joinDialog').showModal();$('roomInput').focus()};
 $('closeCreate').onclick=()=>$('createDialog').close();$('closeJoin').onclick=()=>$('joinDialog').close();
 function request(event,payload,callback){if(!socket?.connected){err('Connecting to the server. Try again.');return}socket.timeout(5000).emit(event,payload,(error,result)=>{if(error){online.pending=false;draw();err('Request timed out. Check the board and try again.');return}callback(result)})}
 function apply(state){if(!state||state.code!==online.code)return;const previous=online.state,oldGame=previous?.gameId;if(online.role==='player'&&(state.yourSeat===0||state.yourSeat===1))online.seat=state.yourSeat;online.state=state;online.status=state.status;online.pending=false;board=[...state.board];values=[...state.values];bonuses=[...state.bonuses];variant=state.variant;turn=state.turn;history=[...state.history];selectedCell=null;if(oldGame!==state.gameId)resultsBeforeFinish=null;
  document.querySelectorAll('[data-mode]').forEach(x=>{const selected=x.dataset.mode===variant;x.classList.toggle('selected',selected);x.setAttribute('aria-pressed',String(selected));x.disabled=true});
  $('modeDescription').textContent=MODES[variant].description;
  const role=online.role==='spectator'?'Spectator':`You are ${names[online.seat]}`;
  $('roomInfo').textContent=`Room ${state.code} · ${role} · Spectators: ${state.spectatorCount}`;
  if(oldGame&&oldGame!==state.gameId){$('matchNotice').textContent=online.role==='spectator'?'Rematch started · Spectating':`Rematch started · You are ${names[online.seat]}`;$('matchNotice').hidden=false}
  $('copyRoom').hidden=false;$('leaveRoom').hidden=false;
  const canRematch=state.status==='finished'&&online.role==='player',opponentRequested=canRematch&&state.rematch[1-online.seat],ownRequest=canRematch&&state.rematch[online.seat];
  $('rematch').hidden=!canRematch||opponentRequested;$('rematchResponse').hidden=!opponentRequested;
  $('rematch').disabled=Boolean(ownRequest)||!state.connectedPlayers.every(Boolean);$('acceptRematch').disabled=!state.connectedPlayers.every(Boolean);$('declineRematch').disabled=false;
  $('rematch').innerHTML=ownRequest?'Rematch requested <span>✓</span>':'Request rematch <span>↗</span>';
  const decline=state.rematchDeclinedBy;let rematchNotice=opponentRequested?'Your opponent requests a rematch.':ownRequest?'Waiting for your opponent.':canRematch&&decline!==null&&decline!==undefined?(decline===online.seat?'You declined the rematch.':'Your opponent declined the rematch.'):'';
  $('rematchMessage').textContent=rematchNotice;$('rematchMessage').hidden=!rematchNotice;
  const wasOffered=previous?.gameId===state.gameId&&previous?.rematch?.[1-online.seat];
  if(opponentRequested&&!wasOffered)$('rematchResponse').scrollIntoView?.({behavior:'smooth',block:'center'});
  if(!online.connected)status('Disconnected. Reconnecting…');else if(state.status==='waiting')status('Waiting for the second player.');else if(state.status==='abandoned')status('Game abandoned. Leave the room to start again.');else if(!state.connectedPlayers.every(Boolean))status('Waiting for a player to reconnect.');else if(state.status==='finished')status(state.rematch[online.seat]?'Rematch requested. Waiting for the other player.':'Game finished.');else status(online.role==='spectator'?'Watching live.':turn===online.seat?'Your turn.':'Opponent’s turn.');
  if(state.result&&online.role==='player'&&lastRecordedGame!==state.gameId){recordResult(state.result);lastRecordedGame=state.gameId}
  draw();
 }
 function connect(){if(socket)return;if(typeof window.io!=='function'){err('Online mode needs the Node server. Run npm start and open localhost:3000.');return}socket=window.io();socket.on('connect',()=>{online.connected=true;if(resume){request('room:resume',resume,r=>{if(!r.ok){resume=null;save();online.code=null;err(r.error);draw();return}online.code=r.code;online.role=r.role;online.seat=r.seat;apply(r.state)})}else status('Connected. Create or join a room.');draw()});socket.on('disconnect',()=>{online.connected=false;online.pending=false;if(online.role==='spectator'){clearOnlineRoom();status('Disconnected. Enter the code to watch again.')}else status('Disconnected. Reconnecting…');draw()});socket.on('room:state',apply);socket.on('rematch:offer',apply);socket.on('room:closed',()=>{resume=null;save();clearOnlineRoom();err('Room expired.');draw()});socket.on('room:replaced',()=>{resume=null;save();clearOnlineRoom();err('This player seat was opened in another connection.');draw()})}
 function entered(r){if(!r.ok){err(r.error);return}const joined=$('joinDialog').open;online.code=r.code;online.role=r.role;online.seat=r.seat;resume=r.token?{code:r.code,token:r.token}:null;save();if($('createDialog').open)$('createDialog').close();if($('joinDialog').open)$('joinDialog').close();apply(r.state);$('matchNotice').textContent=`${joined?'You joined':'Room created'} · ${r.code} · ${r.role==='spectator'?'Spectator':names[r.seat]}`;$('matchNotice').hidden=false;if(joined)$('matchNotice').scrollIntoView?.({behavior:'smooth',block:'center'})}
 function clearOnlineRoom(){resume=null;save();online={code:null,role:null,seat:null,connected:!!socket?.connected,status:null,pending:false,state:null};$('roomInfo').textContent='';$('copyRoom').hidden=$('leaveRoom').hidden=$('rematch').hidden=true;$('matchNotice').hidden=true;$('rematchResponse').hidden=true;$('rematchMessage').hidden=true;document.querySelectorAll('[data-mode]').forEach(x=>x.disabled=false)}
 function switchToLocal(){clearOnlineRoom();if(socket){socket.disconnect();socket=null}online.connected=false;playMode='local';$('playMode').value='local';$('localControls').hidden=false;$('onlineControls').hidden=true;$('newGame').hidden=false;reset()}
 $('playMode').onchange=()=>{const next=$('playMode').value;$('playMode').value=playMode;if(next===playMode)return;if(next==='local'){if(online.code){if(!confirm('Leave this room and switch to local play? An active game will be abandoned.'))return;if(socket?.connected){request('room:leave',{},r=>{if(!r?.ok){err(r?.error);return}switchToLocal()});return}}switchToLocal();return}requestReset(()=>{playMode='online';$('playMode').value='online';$('localControls').hidden=true;$('onlineControls').hidden=false;$('newGame').hidden=true;reset();try{resume=JSON.parse(sessionStorage.getItem(key)||'null')}catch{resume=null}connect();if(socket?.connected&&resume)request('room:resume',resume,r=>{if(!r.ok){resume=null;save();err(r.error);return}online.code=r.code;online.role=r.role;online.seat=r.seat;apply(r.state);$('matchNotice').textContent=`Rejoined room ${r.code} · ${names[r.seat]}`;$('matchNotice').hidden=false})},'Switch play mode? Your current round will be lost.')};
 $('createRoom').onclick=()=>request('room:create',{variant:$('roomVariant').value,seat:Number($('roomColor').value),allowSpectators:$('allowSpectators').checked},entered);
 $('joinRoom').onclick=()=>request('room:join',{code:$('roomInput').value,role:'player'},entered);
 $('copyRoom').onclick=async()=>{try{await navigator.clipboard.writeText(online.code);status('Room code copied.')}catch{status(`Room code: ${online.code}`)}};
 $('leaveRoom').onclick=()=>{if(!confirm('Leave this room? An active game will be abandoned.'))return;request('room:leave',{},r=>{if(!r?.ok){err(r?.error);return}clearOnlineRoom();status('Left the room. Create or join another.');reset()})};
 $('rematch').onclick=$('acceptRematch').onclick=()=>request('game:rematch',{gameId:online.state?.gameId},r=>{if(!r.ok)err(r.error)});
 $('declineRematch').onclick=()=>request('game:decline-rematch',{gameId:online.state?.gameId},r=>{if(!r.ok)err(r.error)});
 window.lastHexOnlineSend=(cell)=>{online.pending=true;draw();request('game:move',{cell,gameId:online.state.gameId,revision:online.state.revision},r=>{online.pending=false;if(!r.ok){if(r.state)apply(r.state);err(r.error)}draw()})};
}
function onlineCanMove(){return online.connected&&online.status==='playing'&&online.role==='player'&&online.seat===turn&&!online.pending&&online.state?.connectedPlayers.every(Boolean)}
function sendOnlineMove(cell){window.lastHexOnlineSend?.(cell)}
