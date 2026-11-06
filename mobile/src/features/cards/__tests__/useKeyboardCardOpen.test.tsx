import { act, renderHook } from '@testing-library/react-native';
import { AppState, Keyboard } from 'react-native';
import type { KeyboardCardOpenOptions } from '../useKeyboardCardOpen';
import { useKeyboardCardOpen } from '../useKeyboardCardOpen';
import type { Rect } from '../overlayGeometry';

const origin = { rect: { x: 12, y: 200, width: 100, height: 150 }, scrollKey: 'catalogue:sample' };
const fresh = { x: 16, y: 120, width: 158, height: 237 };
let visible = false;
let keyboardListeners: Map<string, () => void>;
let background: (state: string) => void;
let frameCallbacks: Map<number, FrameRequestCallback>, frameId = 0;
const previousAppState = AppState.currentState;
function options(): KeyboardCardOpenOptions {
  return { enabled: true, active: true, contentKey: 'en:seed', layoutKey: 'small-host',
    open: jest.fn(), measureCard: jest.fn((_id, done) => done(fresh)) };
}
function nextFrame() { const callbacks=[...frameCallbacks.values()];frameCallbacks.clear();for(const callback of callbacks)callback(0); }
const frames = () => act(() => { nextFrame();nextFrame(); });
beforeEach(() => {
  jest.useFakeTimers(); visible = false; keyboardListeners = new Map(); AppState.currentState = 'active';
  frameCallbacks=new Map();frameId=0;
  jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{frameCallbacks.set(++frameId,callback);return frameId;});
  jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>{if(id!=null)frameCallbacks.delete(id);});
  jest.spyOn(Keyboard, 'isVisible').mockImplementation(() => visible);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    keyboardListeners.set(name, callback as () => void);
    return { remove: () => { keyboardListeners.delete(name); } };
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, callback) => {
    background = callback as (state: string) => void;
    return { remove: () => {} };
  });
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); AppState.currentState = previousAppState; });

test('without a keyboard opens immediately and dismisses hardware-input focus', async () => {
  const settings = options();
  const view = await renderHook(() => useKeyboardCardOpen(settings));
  await act(() => view.result.current(0, origin));
  expect(settings.open).toHaveBeenCalledWith(0, origin);
  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
});

test('visible keyboard waits for hide/layout frames and remeasures before opening once', async () => {
  visible = true; const settings = options();
  const view = await renderHook((props:KeyboardCardOpenOptions) => useKeyboardCardOpen(props), { initialProps: settings });
  await act(() => view.result.current(0, origin));
  expect(settings.open).not.toHaveBeenCalled();
  await view.rerender({ ...settings, layoutKey: 'large-host' });
  await act(() => { visible = false; keyboardListeners.get('keyboardDidHide')!(); });
  expect(settings.open).not.toHaveBeenCalled();
  await frames();
  expect(settings.measureCard).toHaveBeenCalledWith(0, expect.any(Function));
  expect(settings.open).toHaveBeenCalledTimes(1);
  expect(settings.open).toHaveBeenCalledWith(0, { ...origin, rect: fresh });
  await act(() => { jest.advanceTimersByTime(2000); });
  expect(settings.open).toHaveBeenCalledTimes(1);
});

test.each(['content', 'unfocus', 'background', 'unmount'] as const)('pending keyboard open is cancelled by %s', async boundary => {
  visible = true; const settings = options();
  const view = await renderHook((props:KeyboardCardOpenOptions) => useKeyboardCardOpen(props), { initialProps: settings });
  await act(() => view.result.current(0, origin));
  const hidden = keyboardListeners.get('keyboardDidHide')!;
  if (boundary === 'content') await view.rerender({ ...settings, contentKey: 'cs:moon' });
  else if (boundary === 'unfocus') await view.rerender({ ...settings, active: false });
  else if (boundary === 'background') await act(() => background('background'));
  else await view.unmount();
  await act(() => { visible = false; hidden(); jest.advanceTimersByTime(2000); });
  expect(settings.open).not.toHaveBeenCalled();
});

test('missing keyboard events are bounded and stale source measurements cannot open after a new query', async () => {
  visible = true; const settings = options();
  let complete!: (rect: Rect | null) => void;
  settings.measureCard = jest.fn((_id, done) => { complete = done; });
  const view = await renderHook((props:KeyboardCardOpenOptions) => useKeyboardCardOpen(props), { initialProps: settings });
  await act(() => view.result.current(0, origin));
  await act(() => { jest.advanceTimersByTime(1540); });
  await frames();
  expect(settings.measureCard).toHaveBeenCalledTimes(1);
  await view.rerender({ ...settings, contentKey: 'en:moon' });
  await act(() => complete(fresh));
  expect(settings.open).not.toHaveBeenCalled();
});

test('a newer tap replaces the old request and layout changes reschedule settling', async () => {
  visible = true; const settings = options();
  const view = await renderHook((props:KeyboardCardOpenOptions) => useKeyboardCardOpen(props), { initialProps: settings });
  await act(() => { view.result.current(0, origin); view.result.current(7, origin); });
  await act(() => { visible = false; keyboardListeners.get('keyboardDidHide')!(); nextFrame(); });
  await view.rerender({ ...settings, layoutKey: 'settled-host' });
  expect(settings.open).not.toHaveBeenCalled();
  await frames();
  expect(settings.open).toHaveBeenCalledTimes(1);
  expect(settings.open).toHaveBeenCalledWith(7, { ...origin, rect: fresh });
});

test('missing hide events still open after the bounded wait using fresh measurements',async()=>{
  visible=true;const settings=options();
  const view=await renderHook(()=>useKeyboardCardOpen(settings));
  await act(()=>view.result.current(0,origin));
  await act(()=>{jest.advanceTimersByTime(1499);});
  expect(settings.open).not.toHaveBeenCalled();
  await act(()=>{jest.advanceTimersByTime(1);});await frames();
  expect(settings.open).toHaveBeenCalledWith(0,{...origin,rect:fresh});
});

test('a layout change invalidates a source measurement already in flight',async()=>{
  visible=true;const settings=options();const callbacks:((rect:Rect|null)=>void)[]=[];
  settings.measureCard=jest.fn((_id,done)=>{callbacks.push(done);});
  const view=await renderHook((props:KeyboardCardOpenOptions)=>useKeyboardCardOpen(props),{initialProps:settings});
  await act(()=>view.result.current(0,origin));
  await act(()=>{visible=false;keyboardListeners.get('keyboardDidHide')!();});await frames();
  await view.rerender({...settings,layoutKey:'new-host'});await frames();
  expect(callbacks).toHaveLength(2);
  await act(()=>callbacks[0](fresh));expect(settings.open).not.toHaveBeenCalled();
  const moved={...fresh,y:160};
  await act(()=>callbacks[1](moved));
  expect(settings.open).toHaveBeenCalledTimes(1);
  expect(settings.open).toHaveBeenCalledWith(0,{...origin,rect:moved});
});
