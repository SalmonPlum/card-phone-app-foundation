import {act,renderHook} from '@testing-library/react-native';
import type {ReactNode} from 'react';
import {LanguageProvider,useLanguageSettings} from '../LanguageProvider';
import type {LanguageStorage} from '../../platform/languageStorage';

function stored(initial:string|null=null){
  let value=initial;
  const storage:LanguageStorage={read:jest.fn(async()=>value),write:jest.fn(async next=>{value=next;})};
  return storage;
}
function wrapper(storage:LanguageStorage){return function Wrapper({children}:{children:ReactNode}){return <LanguageProvider storage={storage}>{children}</LanguageProvider>;};}
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
test('defaults to English and restores only supported saved preferences',async()=>{
  for(const [saved,expected] of [[null,'en'],['xx','en'],['cs','cs'],['en','en']] as const){
    const view=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(stored(saved))});await flush();
    expect(view.result.current.locale).toBe(expected);await view.unmount();
  }
});
test('language persists across provider remount without storing a session',async()=>{
  const storage=stored();
  const first=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>first.result.current.setLanguage('cs'));await flush();
  expect(first.result.current.locale).toBe('cs');
  expect(storage.write).toHaveBeenCalledWith('cs');
  await first.unmount();
  const second=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  expect(second.result.current.locale).toBe('cs');
});
test('explicit choice wins over a late startup read, including choosing the default',async()=>{
  let resolve!:(locale:string)=>void;
  const storage=stored();storage.read=jest.fn(()=>new Promise(done=>{resolve=done;}));
  const {result}=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setLanguage('en'));
  await act(()=>resolve('cs'));await flush();
  expect(result.current.locale).toBe('en');
});
test('rapid choices write in order and stale failures cannot replace latest save status',async()=>{
  let reject!:(error:Error)=>void;
  const storage=stored();
  const write=jest.fn().mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=fail;})).mockResolvedValue(undefined);
  storage.write=write;
  const {result}=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setLanguage('cs'));await flush();
  await act(()=>result.current.setLanguage('en'));await flush();
  expect(write.mock.calls).toEqual([['cs']]);
  expect(result.current.locale).toBe('en');
  await act(()=>reject(new Error('old write failed')));await flush();
  expect(write.mock.calls).toEqual([['cs'],['en']]);
  expect(result.current.saveError).toBe(false);
});
test('save failure keeps language usable and retries the current choice',async()=>{
  const storage=stored();
  storage.write=jest.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined);
  const {result}=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  await act(()=>result.current.setLanguage('cs'));await flush();
  expect(result.current.locale).toBe('cs');expect(result.current.saveError).toBe(true);
  await act(()=>result.current.retrySave());await flush();
  expect(result.current.saveError).toBe(false);
  expect(storage.write).toHaveBeenLastCalledWith('cs');
});
test('a failed startup read falls back to English without blocking changes',async()=>{
  const storage=stored();storage.read=jest.fn().mockRejectedValue(new Error('unavailable'));
  const {result}=await renderHook(()=>useLanguageSettings(),{wrapper:wrapper(storage)});await flush();
  expect(result.current.locale).toBe('en');
  await act(()=>result.current.setLanguage('cs'));await flush();expect(result.current.locale).toBe('cs');
});
