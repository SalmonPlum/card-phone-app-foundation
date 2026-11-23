import {createContext,useContext,useEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {historyStorage,type HistoryStorage} from '../platform/historyStorage';
import {HistoryController,type HistorySnapshot} from './HistoryController';
import {emptyHistory,HISTORY_LIFETIME} from './archive';
const fallback:HistorySnapshot={archive:emptyHistory(),ready:true,saving:false,error:null,recordingSessionId:null,currentSessionId:null};
const HistoryContext=createContext<(HistorySnapshot&{controller:HistoryController})|null>(null);
export function HistoryProvider({children,storage=historyStorage}:{children:ReactNode;storage?:HistoryStorage}){
  const [controller]=useState(()=>new HistoryController(storage));
  const snapshot=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  useEffect(()=>{void controller.load();},[controller]);
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state==='active')void controller.prune();});return()=>subscription.remove();},[controller]);
  const expiry=snapshot.archive.sessions.reduce((first,entry)=>Math.min(first,entry.firstRevealedAt+HISTORY_LIFETIME),Infinity);
  useEffect(()=>{
    if(!Number.isFinite(expiry))return;
    let timer:ReturnType<typeof setTimeout>;
    const tick=()=>{
      void controller.prune();
      const remaining=expiry-Date.now();
      if(remaining>0)timer=setTimeout(tick,Math.min(24*60*60*1000,remaining));
    };
    timer=setTimeout(tick,Math.max(1,Math.min(24*60*60*1000,expiry-Date.now())));
    return()=>clearTimeout(timer);
  },[controller,expiry]);
  return <HistoryContext.Provider value={{...snapshot,controller}}>{children}</HistoryContext.Provider>;
}
export function useHistory():HistorySnapshot&{controller:HistoryController|null}{return useContext(HistoryContext)??{...fallback,controller:null};}
