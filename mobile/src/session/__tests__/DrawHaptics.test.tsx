import {StrictMode, type ReactNode} from 'react';
import {act, renderHook} from '@testing-library/react-native';
import {AppState} from 'react-native';
import {sampleDeck} from '../../decks/sample';
import {HapticsProvider, useHapticsSettings} from '../../settings/HapticsProvider';
import {useSessionController} from '../useSessionController';
import type {HapticsStorage} from '../../platform/hapticsStorage';

const mockImpact = jest.fn(async (_style: string) => {});
jest.mock('expo-haptics', () => ({impactAsync: (style: string) => mockImpact(style), ImpactFeedbackStyle: {Light: 'light', Heavy: 'heavy'}}));
let mockId = 0;
jest.mock('expo-crypto', () => ({randomUUID: () => `haptic-session-${++mockId}`, getRandomValues: (values: Uint32Array) => {values.fill(0); return values;}}));
const originalState = AppState.currentState;
beforeEach(() => {mockId = 0; mockImpact.mockClear(); AppState.currentState = 'active';});
afterEach(() => {AppState.currentState = originalState;});
const flush = () => act(async () => {await Promise.resolve(); await Promise.resolve();});
async function setup(mode: 'automatic' | 'manual' = 'automatic', storage: HapticsStorage = {read: async () => null, write: async () => {}}) {
  function Wrapper({children}: {children: ReactNode}) {return <StrictMode><HapticsProvider storage={storage}>{children}</HapticsProvider></StrictMode>;}
  const view = await renderHook(() => ({session: useSessionController(sampleDeck, mode), haptics: useHapticsSettings()}), {wrapper: Wrapper});
  await flush();
  await act(() => view.result.current.session.reset());
  const complete = async () => {
    const s = view.result.current.session.state!;
    await act(() => view.result.current.session.complete(s.sessionId, s.epoch));
  };
  const draw = async () => {
    const s = view.result.current.session.state!;
    await act(() => view.result.current.session.draw({x: 620, y: 330, scale: 1, angle: 0}, s.sessionId, s.epoch));
    await complete(); await complete();
  };
  return {view, complete, draw};
}

test.each(['automatic', 'manual'] as const)('one pulse at completed %s reveal, never waiting, confirming or rerendering', async mode => {
  const {view, complete, draw} = await setup(mode);
  await draw();
  expect(mockImpact).not.toHaveBeenCalled();
  if (mode === 'manual') {
    const s = view.result.current.session.state!;
    expect(s.phase).toBe('awaitingReveal');
    await act(() => view.result.current.session.reveal(s.sessionId, s.epoch));
    expect(mockImpact).not.toHaveBeenCalled();
  }
  expect(view.result.current.session.state!.phase).toBe('flip');
  const token = view.result.current.session.state!;
  await complete();
  expect(view.result.current.session.state!.phase).toBe('reveal');
  expect(mockImpact).toHaveBeenCalledTimes(1);
  expect(mockImpact).toHaveBeenLastCalledWith('heavy');
  await view.rerender({});
  await act(() => view.result.current.session.complete(token.sessionId, token.epoch));
  await act(() => view.result.current.session.confirm());
  await complete();
  expect(mockImpact).toHaveBeenCalledTimes(1);
  await draw();
  if (mode === 'manual') {
    const s = view.result.current.session.state!;
    expect(s.phase).toBe('awaitingReveal');
    await act(() => view.result.current.session.reveal(s.sessionId, s.epoch));
  }
  await complete();
  expect(mockImpact).toHaveBeenCalledTimes(2);
});

test('disabled feedback never replays when enabled and does not reset the session', async () => {
  const {view, complete, draw} = await setup();
  const identity = view.result.current.session.state!.sessionId;
  await act(() => view.result.current.haptics.setEnabled(false));
  await draw(); await complete();
  expect(mockImpact).not.toHaveBeenCalled();
  await act(() => view.result.current.haptics.setEnabled(true));
  expect(view.result.current.session.state!.sessionId).toBe(identity);
  expect(mockImpact).not.toHaveBeenCalled();
});

test('a loading preference cannot pulse or replay after hydration', async () => {
  let finish!: (saved: string) => void;
  const {view, complete, draw} = await setup('automatic', {read: () => new Promise(resolve => {finish = resolve;}), write: async () => {}});
  await draw(); await complete();
  expect(mockImpact).not.toHaveBeenCalled();
  await act(() => finish('true')); await flush();
  await view.rerender({});
  expect(mockImpact).not.toHaveBeenCalled();
});

test.each(['background', 'inactive'] as const)('a reveal while %s never pulses on resume', async state => {
  const {view, complete, draw} = await setup();
  await draw();
  AppState.currentState = state;
  await complete();
  expect(mockImpact).not.toHaveBeenCalled();
  AppState.currentState = 'active';
  await view.rerender({});
  expect(mockImpact).not.toHaveBeenCalled();
});

test('reset and stale completion cannot pulse for an abandoned flip', async () => {
  const {view, draw} = await setup();
  await draw();
  const old = view.result.current.session.state!;
  await act(() => view.result.current.session.reset());
  await act(() => view.result.current.session.complete(old.sessionId, old.epoch));
  expect(mockImpact).not.toHaveBeenCalled();
  expect(view.result.current.session.state!.phase).toBe('regrip');
});


test('a restored disabled preference suppresses reveal feedback', async () => {
  const {view, complete, draw} = await setup('automatic', {read: async () => 'false', write: async () => {}});
  expect(view.result.current.haptics.enabled).toBe(false);
  await draw(); await complete();
  expect(view.result.current.session.state!.phase).toBe('reveal');
  expect(mockImpact).not.toHaveBeenCalled();
});

test('native failure does not prevent revealing and confirming a card', async () => {
  mockImpact.mockRejectedValueOnce(new Error('unsupported'));
  const {view, complete, draw} = await setup();
  await draw(); await complete();
  expect(view.result.current.session.error).toBe(false);
  expect(view.result.current.session.state!.phase).toBe('reveal');
  await act(() => view.result.current.session.confirm());
  expect(view.result.current.session.state!.phase).toBe('resume');
});


test('gentle feedback follows each packet landing, followed by stronger reveal feedback', async () => {
  const {view, complete} = await setup();
  await complete(); // regrip -> ready
  await complete(); // ready -> strip
  expect(view.result.current.session.state!.phase).toBe('strip');
  expect(mockImpact).not.toHaveBeenCalled();
  const strip = view.result.current.session.state!;
  await complete();
  expect(view.result.current.session.state!.phase).toBe('contact');
  expect(mockImpact.mock.calls).toEqual([['light']]);
  await act(() => view.result.current.session.complete(strip.sessionId, strip.epoch));
  await view.rerender({});
  expect(mockImpact).toHaveBeenCalledTimes(1);
  await complete(); await complete();
  expect(mockImpact.mock.calls).toEqual([['light'], ['light']]);
  const contact = view.result.current.session.state!;
  await act(() => view.result.current.session.draw({x:620,y:330,scale:1,angle:0}, contact.sessionId, contact.epoch));
  await complete(); await complete(); await complete();
  expect(view.result.current.session.state!.phase).toBe('reveal');
  expect(mockImpact.mock.calls).toEqual([['light'], ['light'], ['heavy']]);
});

test.each(['disabled', 'loading', 'background', 'deferred'] as const)('%s shuffle contact advances without feedback or replay', async reason => {
  const storage:HapticsStorage = {read: reason === 'loading' ? () => new Promise(() => {}) : async () => reason === 'disabled' ? 'false' : null, write: async () => {}};
  const {view, complete} = await setup('automatic', storage);
  await complete(); await complete();
  const strip = view.result.current.session.state!;
  expect(strip.phase).toBe('strip');
  if (reason === 'background') AppState.currentState = 'background';
  await act(() => view.result.current.session.complete(strip.sessionId, strip.epoch, reason !== 'deferred'));
  expect(view.result.current.session.state!.phase).toBe('contact');
  expect(mockImpact).not.toHaveBeenCalled();
  AppState.currentState = 'active';
  await act(() => view.result.current.haptics.setEnabled(true));
  await view.rerender({});
  expect(mockImpact).not.toHaveBeenCalled();
});
