import type {reminderStorage as Adapter} from '../reminderStorage';
let mockValue:string|null=null,mockFinish:()=>void;
const mockWrite=jest.fn();
jest.mock('expo-file-system',()=>({Paths:{document:'private-documents'},File:class {
  get exists(){return mockValue!==null;}
  async text(){return mockValue;}
  create(){mockValue='';}
  async write(value:string){await mockWrite(value);mockValue=value;}
}}));
const {reminderStorage}=jest.requireActual('../reminderStorage') as {reminderStorage:typeof Adapter};
beforeEach(()=>{mockValue=null;mockWrite.mockReset().mockResolvedValue(undefined);});
test('a saved reminder survives a fresh read with hour, minute and enabled intact',async()=>{
  expect(await reminderStorage.read()).toBeNull();
  await reminderStorage.write({schemaVersion:1,enabled:true,hour:18,minute:45});
  expect(JSON.parse((await reminderStorage.read())!)).toEqual({schemaVersion:1,enabled:true,hour:18,minute:45});
});
test('native writing must complete before success is reported and failures propagate',async()=>{
  mockWrite.mockImplementationOnce(()=>new Promise<void>(resolve=>{mockFinish=resolve;}));let done=false;
  const request=reminderStorage.write({schemaVersion:1,enabled:false,hour:9,minute:0}).then(()=>{done=true;});
  await Promise.resolve();await Promise.resolve();expect(done).toBe(false);mockFinish();await request;expect(done).toBe(true);
  mockWrite.mockRejectedValueOnce(new Error('disk unavailable'));
  await expect(reminderStorage.write({schemaVersion:1,enabled:true,hour:9,minute:0})).rejects.toThrow('disk unavailable');
});
