import { StrictMode, useLayoutEffect } from 'react';
import { act, render,renderHook } from '@testing-library/react-native';
import {useSessionController} from '../useSessionController';
import {sampleDeck} from '../../decks/sample';
import { configuredDeck } from '../../decks';
import { SessionProvider, useSession } from '../SessionProvider';

let mockId = 0;
let mockEntropyFailure = false;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `provider-session-${++mockId}`,
  getRandomValues: (values: Uint32Array) => {
    if (mockEntropyFailure) throw new Error('native entropy unavailable');
    values.fill(0);
    return values;
  },
}));

let current: ReturnType<typeof useSession>;
function Consumer() {
  const session = useSession();
  useLayoutEffect(() => { current = session; }, [session]);
  return null;
}

beforeEach(() => { mockId = 0; mockEntropyFailure = false; });

// A consumer reset effect, a provider render reset or StrictMode effect replay
// must never replace the live identity.
test('initializes once and shares the configured session across consumers and rerenders', async () => {
  const view = await render(<StrictMode><SessionProvider><Consumer /></SessionProvider></StrictMode>);
  expect(current.state).toMatchObject({ sessionId: 'provider-session-1', deckId: configuredDeck.id, phase: 'regrip', drawnIds: [] });
  expect([...current.state!.remainingIds].sort()).toEqual(configuredDeck.cards.map(card => card.id).sort());
  const initial = current.state;
  await view.rerender(<StrictMode><SessionProvider><Consumer /><Consumer /></SessionProvider></StrictMode>);
  expect(current.state).toBe(initial);
});

// Moving ownership back into the screen loses the committed card on remount.
test('consumer unmount and remount preserves identity, remaining cards, committed draws and phase', async () => {
  const view = await render(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).not.toBeNull();
  const initial = current.state!;
  await act(() => current.draw({ x: 620, y: 330, angle: .12, scale: 1 }, initial.sessionId, initial.epoch));
  const lower = current.state!;
  await act(() => current.complete(lower.sessionId, lower.epoch));
  expect(current.state).toMatchObject({ phase: 'lift', drawnIds: [initial.remainingIds[0]] });
  expect(current.state!.remainingIds).toHaveLength(configuredDeck.cards.length - 1);
  const committed = current.state;
  await view.rerender(<SessionProvider>{null}</SessionProvider>);
  await view.rerender(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).toBe(committed);
});

// Accepting stale callbacks after reset can advance or draw from a new deck.
test('explicit reset creates a fresh identity and rejects old draw and completion tokens', async () => {
  await render(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).not.toBeNull();
  const old = current.state!;
  await act(() => current.reset());
  const fresh = current.state!;
  expect(fresh).toMatchObject({ sessionId: 'provider-session-2', phase: 'regrip', epoch: 0, drawnIds: [] });
  await act(() => {
    current.complete(old.sessionId, old.epoch);
    current.draw({ x: 1, y: 1, angle: 0, scale: 1 }, old.sessionId, old.epoch);
  });
  expect(current.state).toBe(fresh);
  await act(() => current.complete(fresh.sessionId, fresh.epoch));
  expect(current.state!.phase).toBe('ready');
});

// A module singleton would accidentally retain a session after app recreation.
test('an independent provider mount starts a fresh session', async () => {
  const first = await render(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).not.toBeNull();
  const prior = current.state!;
  await act(() => current.stop());
  expect(current.state!.phase).toBe('results');
  await first.unmount();
  await render(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).toMatchObject({ sessionId: 'provider-session-2', phase: 'regrip', drawnIds: [] });
  expect(current.state!.sessionId).not.toBe(prior.sessionId);
  expect(current.state!.remainingIds).toHaveLength(configuredDeck.cards.length);
});

// Retrying from an init effect loop would consume entropy without user action.
test('initial entropy failure remains stable until retry and recovers safely', async () => {
  mockEntropyFailure = true;
  const view = await render(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.error).toBe(true);
  expect(current.state).toBeNull();
  await view.rerender(<SessionProvider><Consumer /><Consumer /></SessionProvider>);
  expect(current.error).toBe(true);
  await act(() => current.retry());
  expect(current.error).toBe(true);
  expect(current.state).toBeNull();
  mockEntropyFailure = false;
  // No automatic retry on a consumer remount, even once entropy is available.
  await view.rerender(<SessionProvider>{null}</SessionProvider>);
  await view.rerender(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.error).toBe(true);
  expect(current.state).toBeNull();
  await act(() => current.retry());
  expect(current.error).toBe(false);
  expect(current.state).toMatchObject({ sessionId: 'provider-session-3', phase: 'regrip', drawnIds: [] });
  expect(current.state!.remainingIds).toHaveLength(configuredDeck.cards.length);
  const recovered = current.state;
  await view.rerender(<SessionProvider><Consumer /></SessionProvider>);
  expect(current.state).toBe(recovered);
});

test('using a session outside the provider reports a clear programmer error', async () => {
  await expect(render(<Consumer />)).rejects.toThrow(/useSession.*SessionProvider/);
});

test('controller snapshots manual preference, rejects repeats and resets away an old reveal token',async()=>{
 const view=await renderHook(({mode,ready}:{mode:'automatic'|'manual';ready:boolean})=>useSessionController(sampleDeck,mode,ready),{initialProps:{mode:'manual',ready:false}});
 await act(()=>view.result.current.reset());
 let state=view.result.current.state!;
 await act(()=>view.result.current.draw({x:620,y:330,scale:1,angle:0},state.sessionId,state.epoch));expect(view.result.current.state).toBe(state);
 await view.rerender({mode:'manual',ready:true});
 await act(()=>view.result.current.draw({x:620,y:330,scale:1,angle:0},state.sessionId,state.epoch));
 await view.rerender({mode:'automatic',ready:true});
 for(let i=0;i<2;i++) {state=view.result.current.state!;await act(()=>view.result.current.complete(state.sessionId,state.epoch));}
 state=view.result.current.state!;expect(state.phase).toBe('awaitingReveal');
 await act(()=>{view.result.current.reveal(state.sessionId,state.epoch);view.result.current.reveal(state.sessionId,state.epoch);view.result.current.confirm();});
 expect(view.result.current.state!.phase).toBe('flip');
 await act(()=>view.result.current.reset());const fresh=view.result.current.state;
 await act(()=>view.result.current.reveal(state.sessionId,state.epoch));expect(view.result.current.state).toBe(fresh);
});
