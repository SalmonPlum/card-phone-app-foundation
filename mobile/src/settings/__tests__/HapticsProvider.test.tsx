import {act,renderHook} from '@testing-library/react-native';
import type {ReactNode} from 'react';
import {HapticsProvider,useHapticsSettings} from '../../settings/HapticsProvider';
import type {HapticsStorage} from '../../platform/hapticsStorage';

function stored(initial:string|null=null){
  let value=initial;
  const storage:HapticsStorage={read:jest.fn(async()=>value),write:jest.fn(async next=>{value=String(next);})};
  return storage;
}
function wrapper(storage:HapticsStorage){return function Wrapper({children}:{children:ReactNode}){return <HapticsProvider storage={storage}>{children}</HapticsProvider>;};}
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
test('defaults on and restores only supported saved preferences',async()=>{
  for(const [saved,expected] of [[null,true],['xx',true],['false',false],['true',true]] as const){
    const view=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(stored(saved))});await flush();
    expect(view.result.current.enabled).toBe(expected);expect(view.result.current.ready).toBe(true);await view.unmount();
  }
});
test('haptics preference persists across provider remount without storing a session',async()=>{
  const storage=stored();
  const first=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>first.result.current.setEnabled(false));await flush();
  expect(first.result.current.enabled).toBe(false);
  expect(storage.write).toHaveBeenCalledWith(false);
  await first.unmount();
  const second=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  expect(second.result.current.enabled).toBe(false);
});
test('explicit choice wins over a late startup read, including choosing the default',async()=>{
  let resolve!:(value:string)=>void;
  const storage=stored();storage.read=jest.fn(()=>new Promise(done=>{resolve=done;}));
  const {result}=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setEnabled(true));
  await act(()=>resolve('false'));await flush();
  expect(result.current.enabled).toBe(true);
});
test('rapid choices write in order and stale failures cannot replace latest save status',async()=>{
  let reject!:(error:Error)=>void;
  const storage=stored();
  const write=jest.fn().mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=fail;})).mockResolvedValue(undefined);
  storage.write=write;
  const {result}=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setEnabled(false));await flush();
  await act(()=>result.current.setEnabled(true));await flush();
  expect(write.mock.calls).toEqual([[false]]);
  expect(result.current.enabled).toBe(true);
  await act(()=>reject(new Error('old write failed')));await flush();
  expect(write.mock.calls).toEqual([[false],[true]]);
  expect(result.current.saveError).toBe(false);
});
test('save failure keeps haptics preference usable and retries the current choice',async()=>{
  const storage=stored();
  storage.write=jest.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined);
  const {result}=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setEnabled(false));await flush();
  expect(result.current.enabled).toBe(false);expect(result.current.saveError).toBe(true);
  await act(()=>result.current.retrySave());await flush();
  expect(result.current.saveError).toBe(false);
  expect(storage.write).toHaveBeenLastCalledWith(false);
});
test('a failed startup read falls back on without blocking changes',async()=>{
  const storage=stored();storage.read=jest.fn().mockRejectedValue(new Error('unavailable'));
  const {result}=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
  expect(result.current.enabled).toBe(true);
  await act(()=>result.current.setEnabled(false));await flush();expect(result.current.enabled).toBe(false);
});

test('initial loading blocks use of a stale default until storage resolves or a choice is made',async()=>{
 let finish!:(value:string)=>void;
 const storage=stored();storage.read=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
 const {result}=await renderHook(()=>useHapticsSettings(),{wrapper:wrapper(storage)});await flush();
 expect(result.current.ready).toBe(false);
 await act(()=>result.current.setEnabled(true));expect(result.current.ready).toBe(true);
 await act(()=>finish('false'));await flush();expect(result.current.enabled).toBe(true);
});
