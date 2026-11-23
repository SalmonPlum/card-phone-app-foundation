import type {DeckManifest} from '../domain/contracts';
import {validateDeck} from '../domain/deck';
export const HISTORY_LIFETIME=30*24*60*60*1000;
export const HISTORY_LIMIT=50;
export type HistorySession={sessionId:string;firstRevealedAt:number;finished:boolean;deck:DeckManifest;draws:{cardId:number;revealedAt:number}[]};
export type HistoryArchive={schemaVersion:1;enabled:boolean;sessions:HistorySession[]};
export const emptyHistory=():HistoryArchive=>({schemaVersion:1,enabled:false,sessions:[]});
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const timestamp=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=8_640_000_000_000_000;
function strings(value:unknown,result=new Set<string>()):Set<string>{
  if(typeof value==='string')result.add(value);
  else if(Array.isArray(value))value.forEach(item=>strings(item,result));
  else if(object(value))Object.entries(value).forEach(([key,item])=>{result.add(key);strings(item,result);});
  return result;
}
/** Asset references may outlive their bundle; validate shape without requiring current images. */
export function parseHistoryArchive(raw:string|null):HistoryArchive {
  if(raw===null)return emptyHistory();
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.schemaVersion!==1||typeof value.enabled!=='boolean'||!Array.isArray(value.sessions)||value.sessions.length>HISTORY_LIMIT)throw new Error('Invalid history archive');
  const ids=new Set<string>();
  for(const entry of value.sessions){
    if(!object(entry)||typeof entry.sessionId!=='string'||!entry.sessionId.trim()||ids.has(entry.sessionId)||!timestamp(entry.firstRevealedAt)||typeof entry.finished!=='boolean'
      ||!object(entry.deck)||entry.deck.schemaVersion!==2||!Array.isArray(entry.deck.cards)||entry.deck.cards.length<1||entry.deck.cards.length>100||!Array.isArray(entry.draws)||entry.draws.length!==entry.deck.cards.length)throw new Error('Invalid history session');
    ids.add(entry.sessionId);
    const deck=validateDeck(entry.deck,strings(entry.deck));
    const seen=new Set<number>();
    for(const [index,draw] of entry.draws.entries()){
      if(!object(draw)||typeof draw.cardId!=='number'||draw.cardId!==deck.cards[index].id||seen.has(draw.cardId)||!timestamp(draw.revealedAt))throw new Error('Invalid history draw');
      seen.add(draw.cardId);
    }
    if(entry.firstRevealedAt!==entry.draws[0].revealedAt)throw new Error('Invalid history date');
  }
  return value as HistoryArchive;
}
export function retainedSessions(sessions:HistorySession[],now:number):HistorySession[]{
  return sessions.filter(session=>now-session.firstRevealedAt<HISTORY_LIFETIME).sort((a,b)=>b.firstRevealedAt-a.firstRevealedAt).slice(0,HISTORY_LIMIT);
}
