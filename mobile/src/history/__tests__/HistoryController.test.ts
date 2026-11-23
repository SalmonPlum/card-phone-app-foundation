import {HistoryController} from '../HistoryController';
import {HISTORY_LIFETIME,parseHistoryArchive} from '../archive';
import type {HistoryStorage} from '../../platform/historyStorage';
import {sampleDeck} from '../../decks/sample';
import {createSession,transition} from '../../domain/session';
import type {SessionState} from '../../domain/contracts';
let now:number;
function fixture(raw:string|null=null){
  let saved=raw;
  const storage:HistoryStorage={read:jest.fn(async()=>saved),write:jest.fn(async value=>{saved=JSON.stringify(value);})};
  const controller=new HistoryController(storage,()=>now);
  return {controller,storage,saved:()=>saved};
}
const session=(id='s')=>createSession(sampleDeck,id,{nextUint32:()=>0});
function reveal(controller:HistoryController,state:SessionState,cardId=sampleDeck.cards[0].id){
  const before={...state,phase:'flip' as const,selectedId:cardId,drawnIds:[...state.drawnIds,cardId]};
  const after=transition(before,{type:'PHASE_COMPLETE',sessionId:before.sessionId,epoch:before.epoch});
  controller.transition(before,after,sampleDeck);return after;
}
beforeEach(()=>{now=1_800_000_000_000;});
test('default off; enabling waits for a new session and never backfills',async()=>{
  const {controller}=fixture();await controller.load();const old=session();controller.beginSession(old,sampleDeck);
  await controller.setEnabled(true);reveal(controller,old);expect(controller.getSnapshot().archive.sessions).toEqual([]);
  const fresh=session('fresh');controller.beginSession(fresh,sampleDeck);reveal(controller,fresh);
  expect(controller.getSnapshot().archive.sessions[0]).toMatchObject({sessionId:'fresh',finished:false,draws:[{cardId:0,revealedAt:now}]});
});
test('immediate reveal capture is ordered and deduplicated without requiring confirmation',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);const first=session();controller.beginSession(first,sampleDeck);
  const one=reveal(controller,first);reveal(controller,first);now+=1000;reveal(controller,one,sampleDeck.cards[1].id);
  const entry=controller.getSnapshot().archive.sessions[0];expect(entry.draws.map(draw=>draw.cardId)).toEqual([0,7]);
  expect(entry.deck.cards.map(card=>card.id)).toEqual([0,7]);
  expect(entry.deck.cards[0].translations.cs.sections).toEqual(sampleDeck.cards[0].translations.cs.sections);
});
test('waiting/queued cards are not recorded; Stop marks a saved session finished',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);const initial=session();controller.beginSession(initial,sampleDeck);
  controller.transition(initial,{...initial,phase:'awaitingReveal',selectedId:0},sampleDeck);expect(controller.getSnapshot().archive.sessions).toHaveLength(0);
  const shown=reveal(controller,initial);const resumed=transition(shown,{type:'CONFIRM'});controller.transition(shown,resumed,sampleDeck);
  controller.transition(resumed,{...resumed,phase:'results'},sampleDeck);expect(controller.getSnapshot().archive.sessions[0].finished).toBe(true);
});
test('disable stops immediately and re-enable cannot resume that session',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);const first=session();controller.beginSession(first,sampleDeck);const one=reveal(controller,first);
  await controller.setEnabled(false);await controller.setEnabled(true);reveal(controller,one,7);
  expect(controller.getSnapshot().archive.sessions[0].draws).toHaveLength(1);
  expect(controller.getSnapshot().recordingSessionId).toBeNull();
});
test('delete/clear keep other entries and suppress recreation by the active session',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);
  const first=session('first');controller.beginSession(first,sampleDeck);reveal(controller,first);now++;
  const second=session('second');controller.beginSession(second,sampleDeck);const shown=reveal(controller,second);
  await controller.deleteSessions(['second']);reveal(controller,shown,7);
  expect(controller.getSnapshot().archive.sessions.map(item=>item.sessionId)).toEqual(['first']);
  await controller.clear();reveal(controller,shown,8);expect(controller.getSnapshot().archive.sessions).toEqual([]);
  expect(controller.getSnapshot().archive.enabled).toBe(true);
});
test('retains newest 50 sessions and expires them at the 30-day boundary',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);
  for(let i=0;i<51;i++){const state=session(String(i));controller.beginSession(state,sampleDeck);reveal(controller,state);now++;}
  expect(controller.getSnapshot().archive.sessions).toHaveLength(50);expect(controller.getSnapshot().archive.sessions[0].sessionId).toBe('50');
  now+=HISTORY_LIFETIME;await controller.prune();expect(controller.getSnapshot().archive.sessions).toEqual([]);
  reveal(controller,session('50'),7);expect(controller.getSnapshot().archive.sessions).toEqual([]);
});
test('restored records keep original content and a restarted session gets separate eligibility',async()=>{
  const {controller,saved}=fixture();await controller.load();await controller.setEnabled(true);const first=session();controller.beginSession(first,sampleDeck);reveal(controller,first);await controller.retry();
  const restored=fixture(saved());await restored.controller.load();const fresh=session('new');restored.controller.beginSession(fresh,sampleDeck);
  expect(restored.controller.getSnapshot().archive.sessions[0].sessionId).toBe('s');
  expect(restored.controller.getSnapshot().recordingSessionId).toBe('new');
  const parsed=parseHistoryArchive(saved()!);expect(parsed.sessions[0].deck.cards[0].translations.en.name).toBe('Seed');
});
test('invalid or unreadable storage is preserved; recovery cannot enroll the already-running session',async()=>{
  const {controller,storage}=fixture('{bad');await controller.load();expect(controller.getSnapshot()).toMatchObject({ready:true,error:'load'});
  controller.beginSession(session(),sampleDeck);await controller.setEnabled(true);expect(storage.write).not.toHaveBeenCalled();
  await controller.clear();expect(controller.getSnapshot().error).toBeNull();expect(controller.getSnapshot().archive.sessions).toEqual([]);
});
test('failed write is recoverable and an old in-flight write cannot resurrect a deleted record',async()=>{
  const {controller,storage}=fixture();await controller.load();await controller.setEnabled(true);
  let finish!:(value?:void)=>void;jest.mocked(storage.write).mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
  const first=session();controller.beginSession(first,sampleDeck);reveal(controller,first);await Promise.resolve();await Promise.resolve();
  const removing=controller.deleteSessions(['s']);finish();await removing;expect(JSON.parse((await storage.read())!).sessions).toEqual([]);
  jest.mocked(storage.write).mockRejectedValueOnce(new Error('disk'));await controller.setEnabled(false);expect(controller.getSnapshot().error).toBe('save');
  await controller.retry();expect(controller.getSnapshot().error).toBeNull();
});


test('a late startup read cannot restore data after explicit confirmed clear',async()=>{
  const {controller,storage}=fixture();let finish!:(raw:string)=>void;
  jest.mocked(storage.read).mockReturnValue(new Promise(resolve=>{finish=resolve;}));const loading=controller.load();
  await controller.clear();finish(JSON.stringify({schemaVersion:1,enabled:true,sessions:[]}));await loading;
  expect(controller.getSnapshot().archive.enabled).toBe(false);expect(controller.getSnapshot().error).toBeNull();
});


test('rejects legacy-shaped deck snapshots rather than accepting unnormalized reader data',()=>{
  const deck={...sampleDeck,schemaVersion:1,detailTemplate:undefined,cards:[{id:0,faceAsset:'sample.seed',translations:{en:{name:'Seed',meaning:'Meaning',description:'Description'},cs:{name:'Semínko',meaning:'Význam',description:'Popis'}}}]};
  const raw=JSON.stringify({schemaVersion:1,enabled:true,sessions:[{sessionId:'legacy',firstRevealedAt:now,finished:true,deck,draws:[{cardId:0,revealedAt:now}]}]});
  expect(()=>parseHistoryArchive(raw)).toThrow();
});


test('recovering a failed load leaves its existing session unenrolled until reset',async()=>{
  const {controller,storage}=fixture();jest.mocked(storage.read).mockRejectedValueOnce(new Error('disk'));await controller.load();
  const existing=session('existing');controller.beginSession(existing,sampleDeck);
  jest.mocked(storage.read).mockResolvedValue(JSON.stringify({schemaVersion:1,enabled:true,sessions:[]}));await controller.retry();
  reveal(controller,existing);expect(controller.getSnapshot().archive.sessions).toHaveLength(0);
  const fresh=session('fresh');controller.beginSession(fresh,sampleDeck);reveal(controller,fresh);expect(controller.getSnapshot().archive.sessions[0].sessionId).toBe('fresh');
});
test('saved content, template and artwork remain isolated from later deck edits',async()=>{
  const {controller}=fixture();await controller.load();await controller.setEnabled(true);
  const deck=JSON.parse(JSON.stringify(sampleDeck)) as typeof sampleDeck;controller.beginSession(session(),deck);reveal(controller,session());
  deck.cards[0].translations.en.name='Changed name';deck.detailTemplate.sections[0].titles.en='Changed section';
  const saved=controller.getSnapshot().archive.sessions[0];expect(saved.deck.cards[0].translations.en.name).toBe('Seed');expect(saved.deck.detailTemplate.sections[0].titles.en).toBe('Meaning');
});
