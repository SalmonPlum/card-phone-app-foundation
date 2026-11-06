import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import type {RevealMode} from '../domain/contracts';
import {revealModeStorage,type RevealModeStorage} from '../platform/revealModeStorage';

type RevealModeSettings={ready:boolean;mode:RevealMode;setRevealMode:(mode:RevealMode)=>void;saveError:boolean;retrySave:()=>void};
const RevealModeContext=createContext<RevealModeSettings|null>(null);

export function RevealModeProvider({children,storage=revealModeStorage}:{children:ReactNode;storage?:RevealModeStorage}) {
  const [ready,setReady]=useState(false);
  const [mode,setMode]=useState<RevealMode>('automatic'),[saveError,setSaveError]=useState(false);
  const current=useRef<RevealMode>('automatic'),revision=useRef(0),live=useRef(true);
  const writes=useRef<Promise<void>>(Promise.resolve());
  useEffect(()=>{
    live.current=true;
    return()=>{live.current=false;};
  },[]);
  useEffect(()=>{
    let active=true;
    const version=revision.current;
    void Promise.resolve().then(()=>storage.read()).then(saved=>{
      if(active&&revision.current===version&&(saved==='automatic'||saved==='manual')){
        current.current=saved;setMode(saved);
      }
    },()=>{}).then(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  },[storage]);
  const setRevealMode=useCallback((next:RevealMode)=>{
    if(next!=='automatic'&&next!=='manual') return;
    current.current=next;
    const version=++revision.current;
    setMode(next);setReady(true);setSaveError(false);
    // Serialize I/O; an older write cannot finish after the newest choice.
    const request=writes.current.catch(()=>{}).then(()=>storage.write(next));
    writes.current=request;
    void request.then(()=>{
      if(live.current&&revision.current===version) setSaveError(false);
    },()=>{
      if(live.current&&revision.current===version) setSaveError(true);
    });
  },[storage]);
  const retrySave=useCallback(()=>setRevealMode(current.current),[setRevealMode]);
  const value=useMemo(()=>({ready,mode,setRevealMode,saveError,retrySave}),[ready,mode,setRevealMode,saveError,retrySave]);
  return <RevealModeContext.Provider value={value}>{children}</RevealModeContext.Provider>;
}

export function useRevealModeSettings():RevealModeSettings {
  const settings=useContext(RevealModeContext);
  return settings ?? {mode:'automatic',ready:true,setRevealMode:()=>{},saveError:false,retrySave:()=>{}};
}
