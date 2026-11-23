import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {hapticsStorage,type HapticsStorage} from '../platform/hapticsStorage';

type HapticsSettings={ready:boolean;enabled:boolean;setEnabled:(enabled:boolean)=>void;saveError:boolean;retrySave:()=>void};
const HapticsContext=createContext<HapticsSettings|null>(null);

export function HapticsProvider({children,storage=hapticsStorage}:{children:ReactNode;storage?:HapticsStorage}) {
  const [ready,setReady]=useState(false);
  const [enabled,setEnabledState]=useState<boolean>(true),[saveError,setSaveError]=useState(false);
  const current=useRef<boolean>(true),revision=useRef(0),live=useRef(true);
  const writes=useRef<Promise<void>>(Promise.resolve());
  useEffect(()=>{
    live.current=true;
    return()=>{live.current=false;};
  },[]);
  useEffect(()=>{
    let active=true;
    const version=revision.current;
    void Promise.resolve().then(()=>storage.read()).then(saved=>{
      if(active&&revision.current===version&&(saved==='true'||saved==='false')){
        current.current=saved==='true';setEnabledState(saved==='true');
      }
    },()=>{}).then(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  },[storage]);
  const setEnabled=useCallback((next:boolean)=>{
    if(typeof next!=='boolean') return;
    current.current=next;
    const version=++revision.current;
    setEnabledState(next);setReady(true);setSaveError(false);
    // Serialize I/O; an older write cannot finish after the newest choice.
    const request=writes.current.catch(()=>{}).then(()=>storage.write(next));
    writes.current=request;
    void request.then(()=>{
      if(live.current&&revision.current===version) setSaveError(false);
    },()=>{
      if(live.current&&revision.current===version) setSaveError(true);
    });
  },[storage]);
  const retrySave=useCallback(()=>setEnabled(current.current),[setEnabled]);
  const value=useMemo(()=>({ready,enabled,setEnabled,saveError,retrySave}),[ready,enabled,setEnabled,saveError,retrySave]);
  return <HapticsContext.Provider value={value}>{children}</HapticsContext.Provider>;
}

export function useHapticsSettings():HapticsSettings {
  const settings=useContext(HapticsContext);
  return settings ?? {enabled:true,ready:true,setEnabled:()=>{},saveError:false,retrySave:()=>{}};
}
