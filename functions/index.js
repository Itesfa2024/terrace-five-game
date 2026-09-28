'use strict';
const {initializeApp}=require('firebase-admin/app');
const {getDatabase}=require('firebase-admin/database');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {randomInt}=require('node:crypto');
const engine=require('./engine');
initializeApp();
const db=getDatabase();
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
exports.game=onCall({region:'us-central1',maxInstances:20,timeoutSeconds:30},async request=>{
 const uid=request.auth?.uid;if(!uid)throw new HttpsError('unauthenticated','Please sign in again.');
 const data=request.data||{};const action=data.action;
 if(!['create','join','sync','claimHost','start','rematch','answer'].includes(action))throw new HttpsError('invalid-argument','Unknown action.');
 // Per-identity rate limit: 60 calls/minute, including failed join attempts.
 const now=Date.now(),bucket=Math.floor(now/60000);const rate=await db.ref('limits/'+uid).transaction(v=>{if(!v||v.bucket!==bucket)return {bucket,count:1};if(v.count>=60)return;return {bucket,count:v.count+1};});
 if(!rate.committed)throw new HttpsError('resource-exhausted','Too many requests. Please wait a minute.');
 try{
  if(action==='create'){
   // Bound room creation to one per identity each minute.
   const limit=await db.ref('creation/'+uid).transaction(v=>v&&now-v<60000?undefined:now);
   if(!limit.committed)throw new HttpsError('resource-exhausted','Please wait one minute before creating another room.');
   const room=engine.create(uid,data.name,now);
   for(let attempt=0;attempt<5;attempt++){let code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');const tx=await db.ref('rooms/'+code).transaction(v=>!v||v.expiresAt<=now?room:undefined);if(tx.committed)return {code,serverNow:Date.now()};}
   throw new HttpsError('unavailable','Could not create a room. Try again.');
  }
  const code=String(data.code||'').toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))throw new HttpsError('invalid-argument','Enter a valid six-character room code.');
  const roomRef=db.ref('rooms/'+code);
  // Prime local cache so a first null transaction callback does not look like a missing room.
  const initial=await roomRef.get();if(!initial.exists())throw new HttpsError('not-found','Room not found. Check your code.');
  let fault;
  const tx=await roomRef.transaction(value=>{try{fault=null;return engine.apply(value,uid,action,data,Date.now());}catch(e){fault=e;return;}});
  if(!tx.committed){if(fault)throw fault;throw new HttpsError('aborted','Room changed. Please retry.');}
  return {code,serverNow:Date.now()};
 }catch(e){if(e instanceof HttpsError)throw e;if(e.code&&['invalid-argument','not-found','failed-precondition','permission-denied','resource-exhausted','already-exists'].includes(e.code))throw new HttpsError(e.code,e.message);console.error('Game request failed',e);throw new HttpsError('internal','Something went wrong. Please retry.');}
});
// Room expiry and bounded housekeeping. Client deadline sync handles normal transitions;
// this sweep also advances unattended games using their original absolute deadlines.
exports.housekeeping=onSchedule({schedule:'every 1 minutes',region:'us-central1',maxInstances:1},async()=>{
 const now=Date.now();const rooms=await db.ref('rooms').get();
 await Promise.all(Object.keys(rooms.val()||{}).map(code=>db.ref('rooms/'+code).transaction(r=>{if(!r)return;if(r.expiresAt<=now)return null;return engine.advance(r,now);} )));
 for(const root of ['limits','creation']){const old=await db.ref(root).get();const updates={};old.forEach(c=>{const v=c.val();if(root==='limits'?v.bucket<Math.floor(now/60000)-120:v<now-7200000)updates[c.key]=null;});if(Object.keys(updates).length)await db.ref(root).update(updates);}
});
