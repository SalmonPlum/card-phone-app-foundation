import {Platform} from 'react-native';
const {localNotifications,reminderIdentifier,reminderFeature}=jest.requireActual('../localNotifications') as typeof import('../localNotifications');
const mockPermission=jest.fn(),mockRequest=jest.fn(),mockCancel=jest.fn(async(_id:string)=>{}),mockSchedule=jest.fn(async(_request:unknown)=>''),mockChannel=jest.fn(async(..._args:unknown[])=>{});
const mockGetChannel=jest.fn(async()=>null as {importance:number}|null);
const mockScheduled=jest.fn(),mockLast=jest.fn(),mockClear=jest.fn(async()=>{}),mockRemove=jest.fn();
let mockListener:(response:unknown)=>void;
jest.mock('expo-notifications',()=>({
  getPermissionsAsync:()=>mockPermission(),requestPermissionsAsync:()=>mockRequest(),
  getAllScheduledNotificationsAsync:()=>mockScheduled(),cancelScheduledNotificationAsync:(id:string)=>mockCancel(id),
  scheduleNotificationAsync:(request:unknown)=>mockSchedule(request),setNotificationChannelAsync:(...args:unknown[])=>mockChannel(...args),
  getNotificationChannelAsync:()=>mockGetChannel(),setNotificationHandler:jest.fn(),AndroidImportance:{NONE:0,DEFAULT:3},SchedulableTriggerInputTypes:{DAILY:'daily'},
  IosAuthorizationStatus:{AUTHORIZED:2,PROVISIONAL:3,EPHEMERAL:4},DEFAULT_ACTION_IDENTIFIER:'default',
  addNotificationResponseReceivedListener:(listener:(response:unknown)=>void)=>{mockListener=listener;return {remove:mockRemove};},
  getLastNotificationResponseAsync:()=>mockLast(),clearLastNotificationResponseAsync:()=>mockClear(),
}));
const originalOS=Platform.OS;
beforeEach(()=>{jest.clearAllMocks();Object.defineProperty(Platform,'OS',{value:'android',configurable:true});mockPermission.mockResolvedValue({granted:true,canAskAgain:true});mockRequest.mockResolvedValue({granted:true,canAskAgain:true});mockScheduled.mockResolvedValue([]);mockGetChannel.mockResolvedValue(null);});
afterEach(()=>Object.defineProperty(Platform,'OS',{value:originalOS,configurable:true}));
function response(date:number,feature=reminderFeature,actionIdentifier='default') {
  return {actionIdentifier,notification:{date,request:{identifier:reminderIdentifier,content:{data:{feature}}}}};
}
test('schedules an ordinary local daily trigger with fixed owned identity and localized copy',async()=>{
  await localNotifications.schedule({hour:17,minute:25},'cs');
  expect(mockSchedule).toHaveBeenCalledWith({identifier:'foundation.daily-draw.v1',content:{title:'Čas vytáhnout si karty',body:'Zastavte se na chvíli a vytáhněte si své karty.',sound:'default',data:{feature:'daily-draw-reminder-v1'}},trigger:{type:'daily',hour:17,minute:25,channelId:'daily-draw-reminder',delivery:'bestEffort'}});
  expect(mockRequest).not.toHaveBeenCalled();
});
test('cancels only owned scheduled requests and leaves unrelated notifications alone',async()=>{
  mockScheduled.mockResolvedValue([{identifier:reminderIdentifier,content:{data:{}}},{identifier:'older-owned',content:{data:{feature:reminderFeature}}},{identifier:'other-feature',content:{data:{feature:'other'}}}]);
  await localNotifications.cancelOwned();expect(mockCancel.mock.calls).toEqual([[reminderIdentifier],['older-owned']]);
});
test('Android permission request creates a channel first and never requests exact alarm access',async()=>{
  await localNotifications.requestPermission();expect(mockChannel).toHaveBeenCalled();expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(mockChannel.mock.invocationCallOrder[0]).toBeLessThan(mockRequest.mock.invocationCallOrder[0]);
});
test.each([2,3,4])('iOS authorization status %s permits local notifications',async status=>{
  Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});mockPermission.mockResolvedValue({granted:false,canAskAgain:false,ios:{status}});
  expect(await localNotifications.getPermission()).toEqual({granted:true,canAskAgain:false});
});
test('iOS schedules local calendar time without Android-only channel/delivery options',async()=>{
  Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});await localNotifications.schedule({hour:9,minute:0},'en');
  expect(mockSchedule.mock.calls[0][0]).toMatchObject({trigger:{type:'daily',hour:9,minute:0}});expect(mockChannel).not.toHaveBeenCalled();
});
test('only default taps on owned notifications become responses; recurring deliveries have distinct keys',async()=>{
  const handled=jest.fn();const remove=localNotifications.subscribeResponses(handled);
  mockListener(response(100));mockListener(response(200));mockListener(response(200,'other'));mockListener(response(200,reminderFeature,'dismiss'));
  expect(handled.mock.calls).toEqual([[{key:'foundation.daily-draw.v1:100:default'}],[{key:'foundation.daily-draw.v1:200:default'}]]);
  remove();expect(mockRemove).toHaveBeenCalledTimes(1);
});
test('clearing a handled response never clears a newer or unrelated notification',async()=>{
  mockLast.mockResolvedValue(response(200));await localNotifications.clearResponse('foundation.daily-draw.v1:100:default');expect(mockClear).not.toHaveBeenCalled();
  await localNotifications.clearResponse('foundation.daily-draw.v1:200:default');expect(mockClear).toHaveBeenCalledTimes(1);
});


test('an individually blocked reminder channel is inactive despite global notification permission',async()=>{
  mockGetChannel.mockResolvedValue({importance:0});
  expect(await localNotifications.getPermission()).toEqual({granted:false,canAskAgain:false});
  expect(await localNotifications.requestPermission()).toEqual({granted:false,canAskAgain:false});
});
test('default channel sound uses the OS fallback without a custom sound filename',async()=>{
  await localNotifications.requestPermission();
  await localNotifications.schedule({hour:9,minute:0},'en');
  for(const [channel,options] of mockChannel.mock.calls) {
    expect(channel).toBe('daily-draw-reminder');
    // The installed Android bridge treats every sound string as a bundled filename.
    expect(options).not.toHaveProperty('sound');
  }
  expect(mockSchedule.mock.calls[0][0]).toMatchObject({content:{sound:'default'}});
});
test('a client missing native notification modules reports a recoverable unavailable error',async()=>{
  jest.resetModules();
  jest.doMock('expo-notifications',()=>{throw new Error('Cannot find native module ExpoNotificationScheduler');});
    const missing=jest.requireActual('../localNotifications') as typeof import('../localNotifications');
  await expect(missing.localNotifications.getPermission()).rejects.toMatchObject({code:'notifications-unavailable'});
});
