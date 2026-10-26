import { useCallback, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import type { DeckManifest, Pose, SessionEvent, SessionState } from '../../domain/contracts';
import { createSession, transition } from '../../domain/session';
import { choosePacketSize } from '../../domain/shuffle';
import { secureRandomSource } from '../../platform/secureRandom';

export function usePreviewSession(deck: DeckManifest) {
 const current=useRef<SessionState|null>(null), [state,setState]=useState<SessionState|null>(null), [error,setError]=useState(false);
 const blocked=useRef(false), pending=useRef<{sessionId:string;epoch:number}|null>(null);
 const publish=useCallback((next:SessionState)=>{current.current=next;setState(next);},[]);
 const reset=useCallback(()=>{try { const next=createSession(deck,Crypto.randomUUID(),secureRandomSource); blocked.current=false;pending.current=null;setError(false);publish(next); } catch {blocked.current=true;setError(true);} },[deck,publish]);
 const send=useCallback((event:SessionEvent)=>{if(blocked.current||!current.current)return; const next=transition(current.current,event); if(next!==current.current)publish(next);},[publish]);
 const complete=useCallback((sessionId:string,epoch:number)=>{
   const s=current.current;if(blocked.current||!s||s.sessionId!==sessionId||s.epoch!==epoch)return;
   try {let packetSize: number|undefined; if((s.phase==='ready'&&s.remainingIds.length>1)||(s.phase==='contact'&&!s.drawQueued&&s.sourceIds.length>0)) packetSize=choosePacketSize(s.sourceIds.length,s.remainingIds.length,s.receivedIds.length===0,secureRandomSource);
     send({type:'PHASE_COMPLETE',sessionId,epoch,packetSize});
   } catch {pending.current={sessionId,epoch};blocked.current=true;setError(true);}
 },[send]);
 const retry=useCallback(()=>{const token=pending.current;blocked.current=false;setError(false);pending.current=null;if(token)complete(token.sessionId,token.epoch);else reset();},[complete,reset]);
 const draw=useCallback((pose:Pose,sessionId:string,epoch:number)=>{const s=current.current;if(s?.sessionId===sessionId&&s.epoch===epoch)send({type:'DRAW',pose});},[send]);
 return {state,error,reset,retry,draw,complete,confirm:()=>send({type:'CONFIRM'}),stop:()=>send({type:'STOP'})};
}
