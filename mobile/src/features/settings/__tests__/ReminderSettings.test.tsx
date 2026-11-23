import {act,fireEvent,render,screen} from '@testing-library/react-native';
import {Linking,Platform} from 'react-native';
import {LanguageProvider} from '../../../i18n/LanguageProvider';
import {ReminderProvider} from '../../../notifications/ReminderProvider';
import {ReminderSettings} from '../ReminderSettings';
import type {NotificationGateway} from '../../../platform/localNotifications';
import type {ReminderStorage} from '../../../platform/reminderStorage';
jest.mock('@react-native-community/datetimepicker',()=>{
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {View}=require('react-native');return {__esModule:true,default:(props:unknown)=><View testID="reminder-time-picker" {...props as object}/>};
});
const originalOS=Platform.OS;
beforeEach(()=>Object.defineProperty(Platform,'OS',{value:'android',configurable:true}));
afterEach(()=>Object.defineProperty(Platform,'OS',{value:originalOS,configurable:true}));
const flush=()=>act(async()=>{for(let i=0;i<25;i++)await Promise.resolve();});
async function setup(granted=true) {
  const gateway:NotificationGateway={getPermission:jest.fn(async()=>({granted,canAskAgain:false})),requestPermission:jest.fn(async()=>({granted,canAskAgain:false})),cancelOwned:jest.fn(async()=>{}),schedule:jest.fn(async()=>{}),subscribeResponses:()=>()=>{},getLastResponse:async()=>null,clearResponse:async()=>{}};
  const storage:ReminderStorage={read:async()=>null,write:jest.fn(async()=>{})};
  const language={read:async()=>null,write:async()=>{}};
  await render(<LanguageProvider storage={language}><ReminderProvider gateway={gateway} storage={storage}><ReminderSettings/></ReminderProvider></LanguageProvider>);await flush();
  return {gateway,storage};
}
test('starts off without requesting permission and enables a saved daily reminder',async()=>{
  const {gateway,storage}=await setup();
  expect(screen.getByRole('switch',{name:'Daily reminder'}).props.accessibilityState.checked).toBe(false);
  expect(screen.getByRole('button',{name:'Reminder time: 09:00'})).toBeVisible();
  expect(gateway.requestPermission).not.toHaveBeenCalled();
  await fireEvent(screen.getByRole('switch'),'valueChange',true);await flush();
  expect(screen.getByText('Daily at about 09:00')).toBeVisible();
  expect(storage.write).toHaveBeenLastCalledWith({schemaVersion:1,enabled:true,hour:9,minute:0});
});
test('dismissing time picker changes nothing; selecting a time replaces the reminder',async()=>{
  const {gateway}=await setup();await fireEvent(screen.getByRole('switch'),'valueChange',true);await flush();
  await fireEvent.press(screen.getByRole('button',{name:'Reminder time: 09:00'}));
  await fireEvent(screen.getByTestId('reminder-time-picker'),'dismiss');await flush();
  expect(screen.getByRole('button',{name:'Reminder time: 09:00'})).toBeVisible();
  expect(gateway.schedule).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button',{name:'Reminder time: 09:00'}));
  await fireEvent(screen.getByTestId('reminder-time-picker'),'valueChange',{nativeEvent:{}},new Date(2000,0,15,18,35));await flush();
  expect(screen.getByRole('button',{name:'Reminder time: 18:35'})).toBeVisible();
  expect(gateway.schedule).toHaveBeenLastCalledWith({hour:18,minute:35},'en');
});
test('denied permission keeps reminder off and offers a user-invoked settings link',async()=>{
  const open=jest.spyOn(Linking,'openSettings').mockResolvedValue();
  try {
    await setup(false);await fireEvent(screen.getByRole('switch'),'valueChange',true);await flush();
    expect(screen.getByRole('switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByText('Notifications are blocked. Enable them in app settings.')).toBeVisible();
    expect(open).not.toHaveBeenCalled();await fireEvent.press(screen.getByRole('button',{name:'Open app settings'}));expect(open).toHaveBeenCalledTimes(1);
  } finally {open.mockRestore();}
});
test('schedule failure explains that reminder is not active and retries',async()=>{
  const {gateway}=await setup();jest.mocked(gateway.schedule).mockRejectedValueOnce(new Error('native'));
  await fireEvent(screen.getByRole('switch'),'valueChange',true);await flush();
  expect(screen.getByRole('alert')).toHaveTextContent(/Could not update the reminder/);
  expect(screen.queryByText('Daily at about 09:00')).toBeNull();
  await fireEvent.press(screen.getByRole('button',{name:'Try again'}));await flush();
  expect(screen.getByText('Daily at about 09:00')).toBeVisible();expect(screen.queryByRole('alert')).toBeNull();
});


test('iOS time changes remain a draft until Done; Cancel keeps the saved time',async()=>{
  Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const {storage}=await setup();
  await fireEvent.press(screen.getByRole('button',{name:'Reminder time: 09:00'}));
  await fireEvent(screen.getByTestId('reminder-time-picker'),'valueChange',{nativeEvent:{}},new Date(2000,0,15,20,10));
  await fireEvent.press(screen.getByRole('button',{name:'Cancel'}));
  expect(screen.getByRole('button',{name:'Reminder time: 09:00'})).toBeVisible();
  await fireEvent.press(screen.getByRole('button',{name:'Reminder time: 09:00'}));
  await fireEvent(screen.getByTestId('reminder-time-picker'),'valueChange',{nativeEvent:{}},new Date(2000,0,15,20,10));
  await fireEvent.press(screen.getByRole('button',{name:'Done'}));await flush();
  expect(storage.write).toHaveBeenLastCalledWith({schemaVersion:1,enabled:false,hour:20,minute:10});
});
