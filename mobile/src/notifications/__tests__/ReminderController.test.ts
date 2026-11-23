import {ReminderController} from '../ReminderController';
import type {ReminderStorage} from '../../platform/reminderStorage';
import type {ReminderScheduler} from '../../platform/localNotifications';
const on = JSON.stringify({schemaVersion:1,enabled:true,hour:9,minute:0});
function fixture(raw:string|null=null) {
  let saved=raw;
  const storage:ReminderStorage={read:jest.fn(async()=>saved),write:jest.fn(async next=>{saved=JSON.stringify(next);})};
  const gateway:ReminderScheduler={
    getPermission:jest.fn(async()=>({granted:true,canAskAgain:true})),
    requestPermission:jest.fn(async()=>({granted:true,canAskAgain:true})),
    cancelOwned:jest.fn(async()=>{}),schedule:jest.fn(async()=>{}),
  };
  const controller=new ReminderController(storage,gateway,'en');
  return {controller,storage,gateway};
}
const deferred=<T,>()=>{let resolve!:(value:T)=>void;let reject!:(error:Error)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test.each([null,'invalid',JSON.stringify({schemaVersion:2,enabled:true,hour:9,minute:0}),JSON.stringify({schemaVersion:1,enabled:true,hour:24,minute:0})])('defaults off at 09:00 for missing/invalid saved settings',async raw=>{
  const {controller,gateway}=fixture(raw);await controller.start();
  expect(controller.getSnapshot()).toMatchObject({ready:true,active:false,preferences:{enabled:false,hour:9,minute:0}});
  expect(gateway.requestPermission).not.toHaveBeenCalled();expect(gateway.schedule).not.toHaveBeenCalled();
});
test('restores and reconciles daily scheduling without prompting at startup',async()=>{
  const {controller,gateway}=fixture(on);await controller.start();await controller.start();
  expect(gateway.requestPermission).not.toHaveBeenCalled();
  expect(gateway.schedule).toHaveBeenCalledTimes(1);
  expect(gateway.schedule).toHaveBeenCalledWith({hour:9,minute:0},'en');
  expect(controller.getSnapshot()).toMatchObject({active:true,busy:false,error:null});
});
test('permission is requested only by enable; denial persists off and offers settings recovery',async()=>{
  const {controller,gateway,storage}=fixture();await controller.start();
  jest.mocked(gateway.requestPermission).mockResolvedValue({granted:false,canAskAgain:false});
  await controller.setEnabled(true);
  expect(controller.getSnapshot()).toMatchObject({active:false,permissionDenied:true,canAskAgain:false,preferences:{enabled:false}});
  expect(storage.write).toHaveBeenLastCalledWith({schemaVersion:1,enabled:false,hour:9,minute:0});
  expect(gateway.schedule).not.toHaveBeenCalled();
});
test('a delayed saved enabled preference cannot undo an explicit off choice',async()=>{
  const {controller,gateway,storage}=fixture(on);const read=deferred<string|null>();jest.mocked(storage.read).mockReturnValue(read.promise);
  const startup=controller.start();await controller.setEnabled(false);read.resolve(on);await startup;
  expect(controller.getSnapshot().preferences.enabled).toBe(false);expect(gateway.schedule).not.toHaveBeenCalled();
});
test('disable during an outstanding enable permission prompt wins without a stale schedule',async()=>{
  const {controller,gateway}=fixture();await controller.start();const permission=deferred<{granted:boolean;canAskAgain:boolean}>();
  jest.mocked(gateway.requestPermission).mockReturnValue(permission.promise);
  const enabling=controller.setEnabled(true);await Promise.resolve();
  const disabling=controller.setEnabled(false);permission.resolve({granted:true,canAskAgain:true});await Promise.all([enabling,disabling]);
  expect(controller.getSnapshot()).toMatchObject({active:false,busy:false,preferences:{enabled:false}});
  expect(gateway.schedule).not.toHaveBeenCalled();
});
test('rapid time changes serialize in-flight work and leave the latest schedule and save',async()=>{
  const {controller,gateway,storage}=fixture(on);await controller.start();const schedule=deferred<void>();
  jest.mocked(gateway.schedule).mockImplementationOnce(()=>schedule.promise);
  const first=controller.setTime(10,15);for(let i=0;i<8;i++)await Promise.resolve();
  const second=controller.setTime(11,45);schedule.resolve();await Promise.all([first,second]);
  expect(gateway.schedule).toHaveBeenLastCalledWith({hour:11,minute:45},'en');
  expect(storage.write).toHaveBeenLastCalledWith({schemaVersion:1,enabled:true,hour:11,minute:45});
  expect(controller.getSnapshot()).toMatchObject({active:true,error:null,preferences:{hour:11,minute:45}});
});
test('revocation on resume cancels owned reminders and never prompts',async()=>{
  const {controller,gateway}=fixture(on);await controller.start();
  jest.mocked(gateway.getPermission).mockResolvedValue({granted:false,canAskAgain:false});await controller.refresh();
  expect(controller.getSnapshot()).toMatchObject({active:false,permissionDenied:true,preferences:{enabled:false}});
  expect(gateway.requestPermission).not.toHaveBeenCalled();
});
test('resume while a permission prompt is pending does not invalidate explicit enable',async()=>{
  const {controller,gateway}=fixture();await controller.start();const permission=deferred<{granted:boolean;canAskAgain:boolean}>();
  jest.mocked(gateway.requestPermission).mockReturnValue(permission.promise);const enable=controller.setEnabled(true);await Promise.resolve();
  const refresh=controller.refresh();permission.resolve({granted:true,canAskAgain:true});await Promise.all([enable,refresh]);
  expect(controller.getSnapshot()).toMatchObject({active:true,preferences:{enabled:true}});
});
test('language changes replace the owned reminder with localized copy',async()=>{
  const {controller,gateway}=fixture(on);await controller.start();await controller.setLocale('cs');
  expect(gateway.schedule).toHaveBeenLastCalledWith({hour:9,minute:0},'cs');
});
test('failed saving remains visible while the scheduled reminder works and retry persists it',async()=>{
  const {controller,storage}=fixture();await controller.start();jest.mocked(storage.write).mockRejectedValueOnce(new Error('disk'));
  await controller.setEnabled(true);expect(controller.getSnapshot()).toMatchObject({active:true,error:'storage'});
  await controller.retry();expect(controller.getSnapshot()).toMatchObject({active:true,error:null});
});
test('failed scheduling stays inactive and retry restores it',async()=>{
  const {controller,gateway}=fixture();await controller.start();jest.mocked(gateway.schedule).mockRejectedValueOnce(new Error('native'));
  await controller.setEnabled(true);expect(controller.getSnapshot()).toMatchObject({active:false,error:'update'});
  await controller.retry();expect(controller.getSnapshot()).toMatchObject({active:true,error:null});
});
test('failed cancellation does not claim that an active reminder was removed',async()=>{
  const {controller,gateway}=fixture(on);await controller.start();jest.mocked(gateway.cancelOwned).mockRejectedValueOnce(new Error('native'));
  await controller.setEnabled(false);expect(controller.getSnapshot()).toMatchObject({active:true,error:'update',preferences:{enabled:false}});
  await controller.retry();expect(controller.getSnapshot()).toMatchObject({active:false,error:null});
});
test('failed startup read preserves unknown existing schedules until a successful retry',async()=>{
  const {controller,gateway,storage}=fixture(on);jest.mocked(storage.read).mockRejectedValueOnce(new Error('disk'));
  await controller.start();expect(controller.getSnapshot()).toMatchObject({ready:true,error:'storage'});expect(gateway.cancelOwned).not.toHaveBeenCalled();
  await controller.retry();expect(controller.getSnapshot().active).toBe(true);
});
test('stale native failures cannot overwrite a later successful off choice',async()=>{
  const {controller,gateway}=fixture(on);await controller.start();const pending=deferred<void>();jest.mocked(gateway.schedule).mockReturnValueOnce(pending.promise);
  const old=controller.setTime(10,0);for(let i=0;i<8;i++)await Promise.resolve();const latest=controller.setEnabled(false);
  pending.reject(new Error('old native failure'));await Promise.all([old,latest]);
  expect(controller.getSnapshot()).toMatchObject({active:false,error:null,preferences:{enabled:false}});
});


test.each(['time','language'] as const)('explicit enable permission survives a coalesced %s change',async change=>{
  const {controller,gateway}=fixture();await controller.start();let granted=false;
  jest.mocked(gateway.getPermission).mockImplementation(async()=>({granted,canAskAgain:true}));
  jest.mocked(gateway.requestPermission).mockImplementation(async()=>{granted=true;return {granted:true,canAskAgain:true};});
  const enable=controller.setEnabled(true);
  const edit=change==='time'?controller.setTime(10,0):controller.setLocale('cs');
  await Promise.all([enable,edit]);
  expect(gateway.requestPermission).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot()).toMatchObject({active:true,permissionDenied:false,preferences:{enabled:true}});
});
test('disabling during a pending save wins even if the old write fails',async()=>{
  const {controller,storage}=fixture(on);await controller.start();const write=deferred<void>();
  jest.mocked(storage.write).mockReturnValueOnce(write.promise);const old=controller.setTime(12,15);
  for(let i=0;i<12;i++)await Promise.resolve();const latest=controller.setEnabled(false);write.reject(new Error('old write'));
  await Promise.all([old,latest]);expect(controller.getSnapshot()).toMatchObject({active:false,error:null,preferences:{enabled:false}});
  expect(storage.write).toHaveBeenLastCalledWith({schemaVersion:1,enabled:false,hour:12,minute:15});
});
