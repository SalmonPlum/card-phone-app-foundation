import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import type {Locale} from '../domain/contracts';
import {languageStorage,type LanguageStorage} from '../platform/languageStorage';

type LanguageSettings={locale:Locale;setLanguage:(locale:Locale)=>void;saveError:boolean;retrySave:()=>void};
const LanguageContext=createContext<LanguageSettings|null>(null);

export function LanguageProvider({children,storage=languageStorage}:{children:ReactNode;storage?:LanguageStorage}) {
  const [locale,setLocale]=useState<Locale>('en'),[saveError,setSaveError]=useState(false);
  const current=useRef<Locale>('en'),revision=useRef(0),live=useRef(true);
  const writes=useRef<Promise<void>>(Promise.resolve());
  useEffect(()=>{
    live.current=true;
    return()=>{live.current=false;};
  },[]);
  useEffect(()=>{
    let active=true;
    const version=revision.current;
    void Promise.resolve().then(()=>storage.read()).then(saved=>{
      if(active&&revision.current===version&&(saved==='en'||saved==='cs')){
        current.current=saved;setLocale(saved);
      }
    },()=>{});
    return()=>{active=false;};
  },[storage]);
  const setLanguage=useCallback((next:Locale)=>{
    if(next!=='en'&&next!=='cs') return;
    current.current=next;
    const version=++revision.current;
    setLocale(next);setSaveError(false);
    // Serialize I/O; an older write cannot finish after the newest choice.
    const request=writes.current.catch(()=>{}).then(()=>storage.write(next));
    writes.current=request;
    void request.then(()=>{
      if(live.current&&revision.current===version) setSaveError(false);
    },()=>{
      if(live.current&&revision.current===version) setSaveError(true);
    });
  },[storage]);
  const retrySave=useCallback(()=>setLanguage(current.current),[setLanguage]);
  const value=useMemo(()=>({locale,setLanguage,saveError,retrySave}),[locale,setLanguage,saveError,retrySave]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useAppLocale():Locale {return useContext(LanguageContext)?.locale ?? 'en';}
export function useLanguageSettings():LanguageSettings {
  const settings=useContext(LanguageContext);
  if(!settings) throw new Error('Language settings require LanguageProvider');
  return settings;
}
