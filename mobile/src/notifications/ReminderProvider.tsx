import {createContext,useContext,useEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {useAppLocale} from '../i18n/LanguageProvider';
import {localNotifications,type NotificationGateway} from '../platform/localNotifications';
import {reminderStorage,type ReminderStorage} from '../platform/reminderStorage';
import {ReminderController} from './ReminderController';
import {defaultReminder} from './reminderPreferences';

type ReminderSettings=ReturnType<ReminderController['getSnapshot']> & {
  setEnabled:ReminderController['setEnabled'];setTime:ReminderController['setTime'];retry:ReminderController['retry'];gateway:NotificationGateway;
};
const ReminderContext=createContext<ReminderSettings|null>(null);
export function ReminderProvider({children,storage=reminderStorage,gateway=localNotifications}:{children:ReactNode;storage?:ReminderStorage;gateway?:NotificationGateway}) {
  const locale=useAppLocale();
  const [controller]=useState(()=>new ReminderController(storage,gateway,locale));
  const snapshot=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  useEffect(()=>{void controller.start();},[controller]);
  useEffect(()=>{void controller.setLocale(locale);},[controller,locale]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{if(state==='active')void controller.refresh();});
    return ()=>subscription.remove();
  },[controller]);
  return <ReminderContext.Provider value={{...snapshot,setEnabled:controller.setEnabled,setTime:controller.setTime,retry:controller.retry,gateway}}>{children}</ReminderContext.Provider>;
}
export function useReminderSettings():ReminderSettings {
  return useContext(ReminderContext)??{preferences:defaultReminder(),ready:true,active:false,busy:false,error:null,permissionDenied:false,canAskAgain:true,setEnabled:async()=>{},setTime:async()=>{},retry:async()=>{},gateway:localNotifications};
}
