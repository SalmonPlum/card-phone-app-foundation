const mockFiles=new Map<string,string>();let mockFailMove=false,mockFailDelete=false;
jest.mock('expo-file-system/legacy',()=>({
  documentDirectory:'file:///private/',
  getInfoAsync:async(path:string)=>({exists:path==='file:///private/app-drawing-history/'||mockFiles.has(path)}),
  makeDirectoryAsync:async()=>{},
  readDirectoryAsync:async()=>[...mockFiles.keys()].map(path=>path.split('/').at(-1)),
  readAsStringAsync:async(path:string)=>mockFiles.get(path),
  writeAsStringAsync:async(path:string,value:string)=>{mockFiles.set(path,value);},
  moveAsync:async({from,to}:{from:string;to:string})=>{if(mockFailMove)throw new Error('publish');mockFiles.set(to,mockFiles.get(from)!);mockFiles.delete(from);},
  deleteAsync:async(path:string)=>{if(mockFailDelete)throw new Error('cleanup');mockFiles.delete(path);},
}));
const {historyStorage}=jest.requireActual('../historyStorage') as typeof import('../historyStorage');
beforeEach(()=>{mockFiles.clear();mockFailMove=false;mockFailDelete=false;});
const base='file:///private/app-drawing-history/';
test('ignores pending files and reads only newest committed data without corrupt-data fallback',async()=>{
  mockFiles.set(base+'pending.json','uncommitted');expect(await historyStorage.read()).toBeNull();
  mockFiles.set(base+'history-1.json','older');mockFiles.set(base+'history-2.json','invalid newest');
  expect(await historyStorage.read()).toBe('invalid newest');
});
test('publishes whole new generations and a failed move leaves previous saved data intact',async()=>{
  await historyStorage.write({schemaVersion:1,enabled:false,sessions:[]});const old=await historyStorage.read();
  mockFailMove=true;await expect(historyStorage.write({schemaVersion:1,enabled:true,sessions:[]})).rejects.toThrow('publish');
  expect(await historyStorage.read()).toBe(old);
  mockFailMove=false;await historyStorage.write({schemaVersion:1,enabled:true,sessions:[]});
  expect(JSON.parse((await historyStorage.read())!).enabled).toBe(true);
  expect([...mockFiles.keys()].filter(path=>path.includes('history-'))).toHaveLength(1);
});
test('cleanup failure surfaces but cannot make an older archive authoritative again',async()=>{
  mockFiles.set(base+'history-1.json','old');mockFailDelete=true;
  await expect(historyStorage.write({schemaVersion:1,enabled:false,sessions:[]})).rejects.toThrow('cleanup');
  expect(JSON.parse((await historyStorage.read())!).sessions).toEqual([]);
});
