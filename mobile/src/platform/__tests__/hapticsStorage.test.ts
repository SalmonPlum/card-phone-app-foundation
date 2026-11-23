import type {HapticsStorage} from '../hapticsStorage';
let mockValue:string|null=null,mockWriteError=false,mockDelayed=false;
let mockFinish!:()=>void,mockReject!:(error:Error)=>void;
const mockFiles:string[][]=[];
jest.mock('expo-file-system',()=>({
  Paths:{document:'private-documents'},
  File:class{
    constructor(path:string,name:string){mockFiles.push([path,name]);}
    get exists(){return mockValue!==null;}
    async text(){return mockValue;}
    create(){mockValue='';}
    async write(value:string){
      if(mockDelayed) await new Promise<void>((resolve,reject)=>{mockFinish=resolve;mockReject=reject;});
      if(mockWriteError)throw new Error('unavailable');mockValue=value;
    }
  },
}));
const {hapticsStorage}=jest.requireActual('../hapticsStorage') as {hapticsStorage:HapticsStorage};
beforeEach(()=>{mockValue=null;mockWriteError=false;mockDelayed=false;mockFiles.length=0;});
test('persists only a boolean preference in the app-private preference file',async()=>{
  expect(await hapticsStorage.read()).toBeNull();
  await hapticsStorage.write(false);expect(await hapticsStorage.read()).toBe('false');
  await hapticsStorage.write(true);expect(await hapticsStorage.read()).toBe('true');
  expect(mockFiles.every(([path,name])=>path==='private-documents'&&name==='app-haptics.txt')).toBe(true);
});
test('storage failures propagate so Settings can keep working and offer retry',async()=>{
  mockWriteError=true;await expect(hapticsStorage.write(false)).rejects.toThrow('unavailable');
});


test('delayed native write must complete before the adapter reports success',async()=>{
  mockDelayed=true;
  let completed=false;
  const request=hapticsStorage.write(false).then(()=>{completed=true;});
  for(let i=0;i<5;i++)await Promise.resolve();
  expect(completed).toBe(false);
  mockFinish();await request;
  expect(await hapticsStorage.read()).toBe('false');
});
test('delayed native write failure reaches the caller for localized saving retry',async()=>{
  mockDelayed=true;
  const request=hapticsStorage.write(true);
  const failure=expect(request).rejects.toThrow('delayed failure');
  for(let i=0;i<5;i++)await Promise.resolve();
  mockReject(new Error('delayed failure'));await failure;
});
