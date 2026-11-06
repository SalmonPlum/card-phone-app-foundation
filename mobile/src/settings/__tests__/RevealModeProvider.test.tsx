import {act,renderHook} from '@testing-library/react-native';
import type {ReactNode} from 'react';
import {RevealModeProvider,useRevealModeSettings} from '../../settings/RevealModeProvider';
import type {RevealModeStorage} from '../../platform/revealModeStorage';

function stored(initial:string|null=null){
  let value=initial;
  const storage:RevealModeStorage={read:jest.fn(async()=>value),write:jest.fn(async next=>{value=next;})};
  return storage;
}
function wrapper(storage:RevealModeStorage){return function Wrapper({children}:{children:ReactNode}){return <RevealModeProvider storage={storage}>{children}</RevealModeProvider>;};}
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
test('defaults to Automatic and restores only supported saved preferences',async()=>{
  for(const [saved,expected] of [[null,'automatic'],['xx','automatic'],['manual','manual'],['automatic','automatic']] as const){
    const view=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(stored(saved))});await flush();
    expect(view.result.current.mode).toBe(expected);expect(view.result.current.ready).toBe(true);await view.unmount();
  }
});
test('reveal mode persists across provider remount without storing a session',async()=>{
  const storage=stored();
  const first=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>first.result.current.setRevealMode('manual'));await flush();
  expect(first.result.current.mode).toBe('manual');
  expect(storage.write).toHaveBeenCalledWith('manual');
  await first.unmount();
  const second=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  expect(second.result.current.mode).toBe('manual');
});
test('explicit choice wins over a late startup read, including choosing the default',async()=>{
  let resolve!:(mode:string)=>void;
  const storage=stored();storage.read=jest.fn(()=>new Promise(done=>{resolve=done;}));
  const {result}=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setRevealMode('automatic'));
  await act(()=>resolve('manual'));await flush();
  expect(result.current.mode).toBe('automatic');
});
test('rapid choices write in order and stale failures cannot replace latest save status',async()=>{
  let reject!:(error:Error)=>void;
  const storage=stored();
  const write=jest.fn().mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=fail;})).mockResolvedValue(undefined);
  storage.write=write;
  const {result}=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setRevealMode('manual'));await flush();
  await act(()=>result.current.setRevealMode('automatic'));await flush();
  expect(write.mock.calls).toEqual([['manual']]);
  expect(result.current.mode).toBe('automatic');
  await act(()=>reject(new Error('old write failed')));await flush();
  expect(write.mock.calls).toEqual([['manual'],['automatic']]);
  expect(result.current.saveError).toBe(false);
});
test('save failure keeps reveal mode usable and retries the current choice',async()=>{
  const storage=stored();
  storage.write=jest.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined);
  const {result}=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setRevealMode('manual'));await flush();
  expect(result.current.mode).toBe('manual');expect(result.current.saveError).toBe(true);
  await act(()=>result.current.retrySave());await flush();
  expect(result.current.saveError).toBe(false);
  expect(storage.write).toHaveBeenLastCalledWith('manual');
});
test('a failed startup read falls back to Automatic without blocking changes',async()=>{
  const storage=stored();storage.read=jest.fn().mockRejectedValue(new Error('unavailable'));
  const {result}=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
  expect(result.current.mode).toBe('automatic');
  await act(()=>result.current.setRevealMode('manual'));await flush();expect(result.current.mode).toBe('manual');
});

test('initial loading blocks use of a stale default until storage resolves or a choice is made',async()=>{
 let finish!:(value:string)=>void;
 const storage=stored();storage.read=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
 const {result}=await renderHook(()=>useRevealModeSettings(),{wrapper:wrapper(storage)});await flush();
 expect(result.current.ready).toBe(false);
 await act(()=>result.current.setRevealMode('automatic'));expect(result.current.ready).toBe(true);
 await act(()=>finish('manual'));await flush();expect(result.current.mode).toBe('automatic');
});
