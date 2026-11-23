import {act,renderHook} from '@testing-library/react-native';
import {AppState} from 'react-native';
import {useReminderResponses} from '../ReminderResponseBridge';
import type {NotificationGateway,ReminderResponse} from '../../platform/localNotifications';
let deliver:(response:ReminderResponse)=>void;
const initialState=AppState.currentState;
beforeEach(()=>{AppState.currentState='active';});afterEach(()=>{AppState.currentState=initialState;});
function gateway(last:ReminderResponse|null=null):NotificationGateway {
  return {getPermission:async()=>({granted:true,canAskAgain:true}),requestPermission:async()=>({granted:true,canAskAgain:true}),cancelOwned:async()=>{},schedule:async()=>{},subscribeResponses:listener=>{deliver=listener;return jest.fn();},getLastResponse:async()=>last,clearResponse:jest.fn(async()=>{})};
}
test('cold response waits for navigation readiness and listener duplicate opens Draw once',async()=>{
  const native=gateway({key:'first'}),open=jest.fn();
  const view=await renderHook(({ready}:{ready:boolean})=>useReminderResponses(native,ready,open),{initialProps:{ready:false}});
  expect(open).not.toHaveBeenCalled();await act(()=>deliver({key:'first'}));await view.rerender({ready:true});
  expect(open).toHaveBeenCalledTimes(1);await act(()=>deliver({key:'first'}));expect(open).toHaveBeenCalledTimes(1);
  expect(native.clearResponse).toHaveBeenCalledWith('first');
});
test('different daily deliveries open independently even though native schedule ID is reused',async()=>{
  const native=gateway(),open=jest.fn();await renderHook(()=>useReminderResponses(native,true,open));
  await act(()=>deliver({key:'schedule:day1'}));await act(()=>deliver({key:'schedule:day2'}));expect(open).toHaveBeenCalledTimes(2);
});
test('a late cold-response query cannot overwrite a newer live tap',async()=>{
  const native=gateway(),open=jest.fn();let finish!:(value:ReminderResponse)=>void;native.getLastResponse=()=>new Promise(resolve=>{finish=resolve;});
  const view=await renderHook(({ready}:{ready:boolean})=>useReminderResponses(native,ready,open),{initialProps:{ready:false}});
  await act(()=>deliver({key:'new'}));await act(()=>finish({key:'old'}));await view.rerender({ready:true});
  expect(native.clearResponse).toHaveBeenCalledWith('new');expect(native.clearResponse).not.toHaveBeenCalledWith('old');expect(open).toHaveBeenCalledTimes(1);
});
test('native module errors and late unmounted callbacks do not crash or navigate',async()=>{
  const native=gateway(),open=jest.fn();native.getLastResponse=async()=>{throw new Error('native unavailable');};
  const view=await renderHook(()=>useReminderResponses(native,true,open));await view.unmount();await act(()=>deliver({key:'late'}));expect(open).not.toHaveBeenCalled();
});
