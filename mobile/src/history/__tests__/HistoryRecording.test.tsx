import {act,renderHook} from '@testing-library/react-native';
import type {ReactNode} from 'react';
import {HistoryProvider,useHistory} from '../HistoryProvider';
import {useSessionController} from '../../session/useSessionController';
import {SessionProvider,useSession} from '../../session/SessionProvider';
import type {HistoryStorage} from '../../platform/historyStorage';
import {HISTORY_LIFETIME} from '../archive';
import {sampleDeck} from '../../decks/sample';
import {HapticsProvider} from '../../settings/HapticsProvider';
let mockId=0;
jest.mock('expo-crypto',()=>({randomUUID:()=>`history-${++mockId}`,getRandomValues:(values:Uint32Array)=>{values.fill(0);return values;}}));
const storage=():HistoryStorage=>({read:async()=>null,write:jest.fn(async()=>{})});
beforeEach(()=>{mockId=0;});

test.each(['automatic','manual'] as const)('%s captures at reveal with haptics off and suppressed deferred feedback',async mode=>{
  const saved=storage();
  function Wrapper({children}:{children:ReactNode}){return <HistoryProvider storage={saved}><HapticsProvider storage={{read:async()=> 'false',write:async()=>{}}}>{children}</HapticsProvider></HistoryProvider>;}
  const {result}=await renderHook(()=>({session:useSessionController(sampleDeck,mode),history:useHistory()}),{wrapper:Wrapper});
  await act(()=>result.current.session.reset());
  const existing=result.current.session.state!;
  await act(()=>result.current.history.controller!.setEnabled(true));
  expect(result.current.session.state).toBe(existing);expect(result.current.history.recordingSessionId).toBeNull();
  await act(()=>result.current.session.reset());const first=result.current.session.state!;
  await act(()=>result.current.session.draw({x:620,y:330,scale:1,angle:0},first.sessionId,first.epoch));
  for(let i=0;i<2;i++){const s=result.current.session.state!;await act(()=>result.current.session.complete(s.sessionId,s.epoch));}
  expect(result.current.history.archive.sessions).toEqual([]);
  if(mode==='manual'){const s=result.current.session.state!;await act(()=>result.current.session.reveal(s.sessionId,s.epoch));expect(result.current.history.archive.sessions).toEqual([]);}
  const flip=result.current.session.state!;expect(flip.phase).toBe('flip');
  await act(()=>result.current.session.complete(flip.sessionId,flip.epoch,false));
  expect(result.current.history.archive.sessions[0].draws).toHaveLength(1);
  expect(result.current.session.state!.phase).toBe('reveal');
  await act(()=>result.current.session.complete(flip.sessionId,flip.epoch,false));expect(result.current.history.archive.sessions[0].draws).toHaveLength(1);
});
test('root initialization waits for restored preference, but a failed read keeps drawing available',async()=>{
  let finish!:(value:string|null)=>void;const saved=storage();saved.read=()=>new Promise(resolve=>{finish=resolve;});
  function Wrapper({children}:{children:ReactNode}){return <HistoryProvider storage={saved}><SessionProvider>{children}</SessionProvider></HistoryProvider>;}
  const first=await renderHook(()=>({session:useSession(),history:useHistory()}),{wrapper:Wrapper});
  expect(first.result.current.session.state).toBeNull();expect(mockId).toBe(0);
  await act(()=>finish(JSON.stringify({schemaVersion:1,enabled:true,sessions:[]})));
  expect(first.result.current.history.recordingSessionId).toBe('history-1');await first.unmount();
  saved.read=async()=>{throw new Error('disk');};const failed=await renderHook(()=>({session:useSession(),history:useHistory()}),{wrapper:Wrapper});
  expect(failed.result.current.session.state).not.toBeNull();expect(failed.result.current.history.error).toBe('load');
});


test('expiry remains scheduled beyond the first 24 hours while the app stays open',async()=>{
  jest.useFakeTimers();jest.setSystemTime(1_800_000_000_000);
  try{
    const first=Date.now()-HISTORY_LIFETIME+2*24*60*60*1000;
    const saved:HistoryStorage={read:async()=>JSON.stringify({schemaVersion:1,enabled:true,sessions:[{sessionId:'old',firstRevealedAt:first,finished:true,deck:{...sampleDeck,cards:[sampleDeck.cards[0]]},draws:[{cardId:0,revealedAt:first}]}]}),write:async()=>{}};
    function Wrapper({children}:{children:ReactNode}){return <HistoryProvider storage={saved}>{children}</HistoryProvider>;}
    const view=await renderHook(()=>useHistory(),{wrapper:Wrapper});expect(view.result.current.archive.sessions).toHaveLength(1);
    await act(()=>jest.advanceTimersByTime(24*60*60*1000));expect(view.result.current.archive.sessions).toHaveLength(1);
    await act(()=>jest.advanceTimersByTime(24*60*60*1000));expect(view.result.current.archive.sessions.length).toBe(0);
    await view.unmount();
  }finally{jest.useRealTimers();}
});
