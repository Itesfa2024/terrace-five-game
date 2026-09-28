'use strict';
const {randomInt,randomUUID}=require('node:crypto');
const bank=require('./bank');
const ROUND_MS=20000, REVEAL_MS=8000, TTL_MS=2*60*60*1000, MAX_PLAYERS=12;
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function cleanName(value){if(typeof value!=='string')fail('invalid-argument','Enter a display name.');const n=value.trim().replace(/\s+/g,' ');if(n.length<1||n.length>20||/[\u0000-\u001f\u007f]/.test(n))fail('invalid-argument','Use a name of 1–20 characters.');return n;}
function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function deck(){return shuffled([...new Set(bank.map(q=>q.category))]).map(c=>{const list=bank.filter(q=>q.category===c);const q=list[randomInt(list.length)];const order=shuffled([0,1,2,3]);return {...q,options:order.map(i=>q.options[i]),correct:order.indexOf(q.correct)};});}
function create(uid,name,now){return {expiresAt:now+TTL_MS,public:{host:uid,status:'lobby',round:0,gameId:randomUUID(),players:{[uid]:{name:cleanName(name),score:0,lastSeen:now}}},private:{deck:deck(),answers:{}}};}
function question(r){const q=r.private.deck[r.public.round];r.public.question={category:q.category,text:q.text,options:q.options};delete r.public.result;r.public.submitted={};}
function advance(r,now){const p=r.public;while((p.status==='question'||p.status==='reveal')&&now>=p.deadline){if(p.status==='question'){const q=r.private.deck[p.round],answers=(r.private.answers||{})[p.round]||{},outcomes={};for(const [uid,player] of Object.entries(p.players)){const a=answers[uid];const correct=a!==undefined&&a===q.correct;player.score+=correct?100:0;outcomes[uid]={choice:a===undefined?-1:a,correct,points:correct?100:0};}p.result={correct:q.correct,explanation:q.explanation,source:q.source,outcomes};p.status='reveal';p.deadline+=REVEAL_MS;}else if(p.round===4){p.status='finished';delete p.deadline;}else{p.round++;p.status='question';p.deadline+=ROUND_MS;question(r);}}return r;}
function apply(room,uid,action,data,now){if(!room||room.expiresAt<=now)fail('not-found','This room has expired or does not exist.');const r=structuredClone(room),p=r.public;advance(r,now);
 if(action==='join'){if(p.players[uid]){p.players[uid].lastSeen=now;return r;}if(p.status!=='lobby')fail('failed-precondition','The game has started. Join a new room.');if(Object.keys(p.players).length>=MAX_PLAYERS)fail('resource-exhausted','This room is full (12 players).');const name=cleanName(data.name);if(Object.values(p.players).some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))fail('already-exists','That name is taken in this room.');p.players[uid]={name,score:0,lastSeen:now};return r;}
 if(!p.players[uid])fail('permission-denied','Join the room first.');
 p.players[uid].lastSeen=now;
 if(action==='sync')return r;
 if(action==='claimHost'){if(now-p.players[p.host].lastSeen<45000)fail('failed-precondition','The host is still connected.');p.host=uid;return r;}
 if(action==='start'||action==='rematch'){if(p.host!==uid)fail('permission-denied','Only the host can start.');if(action==='start'&&p.status!=='lobby'||action==='rematch'&&p.status!=='finished')fail('failed-precondition','The room is not ready for this action.');if(Object.values(p.players).filter(x=>now-x.lastSeen<45000).length<2)fail('failed-precondition','At least two connected players are needed.');for(const player of Object.values(p.players))player.score=0;p.gameId=randomUUID();p.round=0;p.status='question';p.deadline=now+ROUND_MS;r.private={deck:deck(),answers:{}};question(r);return r;}
 if(action==='answer'){if(p.status!=='question'||data.gameId!==p.gameId||data.round!==p.round)fail('failed-precondition','This round has closed.');if(!Number.isInteger(data.choice)||data.choice<0||data.choice>3)fail('invalid-argument','Choose one of the four answers.');r.private.answers=r.private.answers||{};const answers=r.private.answers[p.round]||(r.private.answers[p.round]={});if(answers[uid]!==undefined){if(answers[uid]===data.choice)return r;fail('already-exists','Your first answer is already locked.');}answers[uid]=data.choice;p.submitted=p.submitted||{};p.submitted[uid]=true;return r;}
 fail('invalid-argument','Unknown action.');
}
module.exports={create,apply,advance,deck,ROUND_MS,REVEAL_MS,TTL_MS,MAX_PLAYERS};
