import {t} from '../i18n/locale';
import {Platform} from 'react-native';
import type {NotificationResponse,NotificationPermissionsStatus} from 'expo-notifications';
import type {Locale} from '../domain/contracts';

export const reminderIdentifier='foundation.daily-draw.v1';
export const reminderFeature='daily-draw-reminder-v1';
export const reminderChannel='daily-draw-reminder';
export type ReminderPermission={granted:boolean;canAskAgain:boolean};
export type ReminderResponse={key:string};
export type ReminderScheduler={
  getPermission():Promise<ReminderPermission>;
  requestPermission():Promise<ReminderPermission>;
  cancelOwned():Promise<void>;
  schedule(time:{hour:number;minute:number},locale:Locale):Promise<void>;
};
export type NotificationGateway=ReminderScheduler & {
  subscribeResponses(listener:(response:ReminderResponse)=>void):()=>void;
  getLastResponse():Promise<ReminderResponse|null>;
  clearResponse(key:string):Promise<void>;
};
export class NotificationsUnavailableError extends Error {
  readonly code='notifications-unavailable';
  constructor(){super('Notification support requires a rebuilt development app.');}
}
let configured=false;
function nativeNotifications() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native=require('expo-notifications') as typeof import('expo-notifications');
    if(!configured){
      native.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
      configured=true;
    }
    return native;
  } catch {throw new NotificationsUnavailableError();}
}
async function channel(locale:Locale='en') {
  const native=nativeNotifications();
  if(Platform.OS==='android')await native.setNotificationChannelAsync(reminderChannel,{
    // Omit sound: this Android bridge treats strings as custom resource filenames.
    name:t('dailyReminder',locale),importance:native.AndroidImportance.DEFAULT,
  });
}
async function permission(value:NotificationPermissionsStatus):Promise<ReminderPermission> {
  const native=nativeNotifications();
  const allowedIOS=[native.IosAuthorizationStatus.AUTHORIZED,native.IosAuthorizationStatus.PROVISIONAL,native.IosAuthorizationStatus.EPHEMERAL];
  if(Platform.OS==='android'&&value.granted){
    const existing=await native.getNotificationChannelAsync(reminderChannel);
    if(existing?.importance===native.AndroidImportance.NONE)return {granted:false,canAskAgain:false};
  }
  return {granted:Platform.OS==='ios'&&value.ios?allowedIOS.includes(value.ios.status):value.granted,canAskAgain:value.canAskAgain};
}
function response(value:NotificationResponse|null):ReminderResponse|null {
  if(!value||value.actionIdentifier!==nativeNotifications().DEFAULT_ACTION_IDENTIFIER)return null;
  const {request,date}=value.notification;
  if(request.identifier!==reminderIdentifier||request.content.data?.feature!==reminderFeature||!Number.isFinite(date))return null;
  return {key:`${request.identifier}:${date}:${value.actionIdentifier}`};
}
export const localNotifications:NotificationGateway={
  async getPermission(){return permission(await nativeNotifications().getPermissionsAsync());},
  async requestPermission(){await channel();return permission(await nativeNotifications().requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:false}}));},
  async cancelOwned(){
    const native=nativeNotifications();
    for(const request of await native.getAllScheduledNotificationsAsync()) {
      if(request.identifier===reminderIdentifier||request.content.data?.feature===reminderFeature)await native.cancelScheduledNotificationAsync(request.identifier);
    }
  },
  async schedule({hour,minute},locale){
    const native=nativeNotifications();await channel(locale);
    await native.scheduleNotificationAsync({identifier:reminderIdentifier,content:{
      title:t('drawReminderTitle',locale),
      body:t('drawReminderBody',locale),
      sound:'default',data:{feature:reminderFeature},
    },trigger:{type:native.SchedulableTriggerInputTypes.DAILY,hour,minute,...(Platform.OS==='android'?{channelId:reminderChannel,delivery:'bestEffort' as const}:{})}});
  },
  subscribeResponses(listener){
    const subscription=nativeNotifications().addNotificationResponseReceivedListener(value=>{const owned=response(value);if(owned)listener(owned);});
    return ()=>subscription.remove();
  },
  async getLastResponse(){return response(await nativeNotifications().getLastNotificationResponseAsync());},
  async clearResponse(key){const native=nativeNotifications();if(response(await native.getLastNotificationResponseAsync())?.key===key)await native.clearLastNotificationResponseAsync();},
};
