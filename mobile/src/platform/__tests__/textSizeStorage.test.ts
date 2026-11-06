import type {TextSizeStorage} from '../textSizeStorage';
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
const {textSizeStorage}=jest.requireActual('../textSizeStorage') as {textSizeStorage:TextSizeStorage};
beforeEach(()=>{mockValue=null;mockWriteError=false;mockDelayed=false;mockFiles.length=0;});
test('persists only a text size in the app-private preference file',async()=>{
  expect(await textSizeStorage.read()).toBeNull();
  await textSizeStorage.write('large');expect(await textSizeStorage.read()).toBe('large');
  await textSizeStorage.write('standard');expect(await textSizeStorage.read()).toBe('standard');
  expect(mockFiles.every(([path,name])=>path==='private-documents'&&name==='app-text-size.txt')).toBe(true);
});
test('storage failures propagate so Settings can keep working and offer retry',async()=>{
  mockWriteError=true;await expect(textSizeStorage.write('large')).rejects.toThrow('unavailable');
});


test('delayed native write must complete before the adapter reports success',async()=>{
  mockDelayed=true;
  let completed=false;
  const request=textSizeStorage.write('large').then(()=>{completed=true;});
  for(let i=0;i<5;i++)await Promise.resolve();
  expect(completed).toBe(false);
  mockFinish();await request;
  expect(await textSizeStorage.read()).toBe('large');
});
test('delayed native write failure reaches the caller for localized saving retry',async()=>{
  mockDelayed=true;
  const request=textSizeStorage.write('standard');
  const failure=expect(request).rejects.toThrow('delayed failure');
  for(let i=0;i<5;i++)await Promise.resolve();
  mockReject(new Error('delayed failure'));await failure;
});
