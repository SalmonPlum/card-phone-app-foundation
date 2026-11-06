import {act,renderHook} from '@testing-library/react-native';
import type {ReactNode} from 'react';
import {TextSizeProvider,useTextSizeSettings} from '../../settings/TextSizeProvider';
import type {TextSizeStorage} from '../../platform/textSizeStorage';

function stored(initial:string|null=null){
  let value=initial;
  const storage:TextSizeStorage={read:jest.fn(async()=>value),write:jest.fn(async next=>{value=next;})};
  return storage;
}
function wrapper(storage:TextSizeStorage){return function Wrapper({children}:{children:ReactNode}){return <TextSizeProvider storage={storage}>{children}</TextSizeProvider>;};}
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
test('defaults to Standard and restores only supported saved preferences',async()=>{
  for(const [saved,expected] of [[null,'standard'],['xx','standard'],['large','large'],['small','small'],['standard','standard']] as const){
    const view=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(stored(saved))});await flush();
    expect(view.result.current.size).toBe(expected);expect(view.result.current.ready).toBe(true);await view.unmount();
  }
});
test('text size persists across provider remount without storing a session',async()=>{
  const storage=stored();
  const first=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>first.result.current.setTextSize('large'));await flush();
  expect(first.result.current.size).toBe('large');
  expect(storage.write).toHaveBeenCalledWith('large');
  await first.unmount();
  const second=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  expect(second.result.current.size).toBe('large');
});
test('explicit choice wins over a late startup read, including choosing the default',async()=>{
  let resolve!:(mode:string)=>void;
  const storage=stored();storage.read=jest.fn(()=>new Promise(done=>{resolve=done;}));
  const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setTextSize('standard'));
  await act(()=>resolve('large'));await flush();
  expect(result.current.size).toBe('standard');
});
test('rapid choices write in order and stale failures cannot replace latest save status',async()=>{
  let reject!:(error:Error)=>void;
  const storage=stored();
  const write=jest.fn().mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=fail;})).mockResolvedValue(undefined);
  storage.write=write;
  const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setTextSize('large'));await flush();
  await act(()=>result.current.setTextSize('standard'));await flush();
  expect(write.mock.calls).toEqual([['large']]);
  expect(result.current.size).toBe('standard');
  await act(()=>reject(new Error('old write failed')));await flush();
  expect(write.mock.calls).toEqual([['large'],['standard']]);
  expect(result.current.saveError).toBe(false);
});
test('save failure keeps text size usable and retries the current choice',async()=>{
  const storage=stored();
  storage.write=jest.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined);
  const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setTextSize('large'));await flush();
  expect(result.current.size).toBe('large');expect(result.current.saveError).toBe(true);
  await act(()=>result.current.retrySave());await flush();
  expect(result.current.saveError).toBe(false);
  expect(storage.write).toHaveBeenLastCalledWith('large');
});
test('a failed startup read falls back to Standard without blocking changes',async()=>{
  const storage=stored();storage.read=jest.fn().mockRejectedValue(new Error('unavailable'));
  const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
  expect(result.current.size).toBe('standard');
  await act(()=>result.current.setTextSize('large'));await flush();expect(result.current.size).toBe('large');
});

test('initial loading blocks use of a stale default until storage resolves or a choice is made',async()=>{
 let finish!:(value:string)=>void;
 const storage=stored();storage.read=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
 const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
 expect(result.current.ready).toBe(false);
 await act(()=>result.current.setTextSize('standard'));expect(result.current.ready).toBe(true);
 await act(()=>finish('large'));await flush();expect(result.current.size).toBe('standard');
});

test('startup retry ignores the first read and fallback keeps current size without writing a default',async()=>{
 let oldRead!:(value:string)=>void;
 const storage=stored();
 storage.read=jest.fn().mockImplementationOnce(()=>new Promise<string>(resolve=>{oldRead=resolve;})).mockResolvedValue('small');
 const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
 await act(()=>result.current.retryTextSizeRestore());await flush();
 expect(result.current.size).toBe('small');expect(result.current.scale).toBe(.9);
 await act(()=>oldRead('large'));await flush();expect(result.current.size).toBe('small');
 await act(()=>result.current.keepCurrentTextSize());await flush();
 expect(storage.write).not.toHaveBeenCalled();
});

test('continuing startup invalidates a stalled restore and permits later explicit selections',async()=>{
 let finish!:(value:string)=>void;
 const storage=stored();storage.read=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
 const {result}=await renderHook(()=>useTextSizeSettings(),{wrapper:wrapper(storage)});await flush();
 await act(()=>result.current.keepCurrentTextSize());
 expect(result.current.ready).toBe(true);
 await act(()=>finish('large'));await flush();expect(result.current.size).toBe('standard');
 await act(()=>result.current.setTextSize('large'));await flush();
 expect(result.current.scale).toBe(1.15);expect(storage.write).toHaveBeenLastCalledWith('large');
});
