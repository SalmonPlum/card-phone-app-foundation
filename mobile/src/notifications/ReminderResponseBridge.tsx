import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useRootNavigationState,useRouter} from 'expo-router';
import type {NotificationGateway,ReminderResponse} from '../platform/localNotifications';
import {useReminderSettings} from './ReminderProvider';

export function useReminderResponses(gateway:NotificationGateway,ready:boolean,openDraw:()=>void) {
  const [pending,setPending]=useState<ReminderResponse|null>(null);
  const [active,setActive]=useState(AppState.currentState==='active');
  const seen=useRef(new Set<string>());
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>setActive(state==='active'));
    return ()=>subscription.remove();
  },[]);
  useEffect(()=>{
    let live=true,events=0,remove:(()=>void)|undefined;
    const receive=(value:ReminderResponse)=>{
      if(!live)return;
      events++;
      if(!seen.current.has(value.key))setPending(previous=>previous?.key===value.key?previous:value);
    };
    try {
      remove=gateway.subscribeResponses(receive);
      void gateway.getLastResponse().then(value=>{if(live&&events===0&&value)receive(value);},()=>{});
    } catch { /* An older client must still open normally. */ }
    return ()=>{live=false;remove?.();};
  },[gateway]);
  useEffect(()=>{
    if(!ready||!active||!pending||seen.current.has(pending.key))return;
    try {openDraw();} catch {return;}
    seen.current.add(pending.key);
    // Bound process-local deduplication; native response clearing survives restarts.
    if(seen.current.size>64)seen.current.delete(seen.current.values().next().value!);
    void gateway.clearResponse(pending.key).catch(()=>{});
  },[gateway,ready,active,pending,openDraw]);
}
export function ReminderResponseBridge() {
  const {gateway,ready}=useReminderSettings();
  const root=useRootNavigationState(),router=useRouter();
  const openDraw=useCallback(()=>router.navigate('/'),[router]);
  useReminderResponses(gateway,ready&&!!root?.key,openDraw);
  return null;
}
