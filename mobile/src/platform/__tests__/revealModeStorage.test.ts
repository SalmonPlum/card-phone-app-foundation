import type {RevealModeStorage} from '../revealModeStorage';
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
const {revealModeStorage}=jest.requireActual('../revealModeStorage') as {revealModeStorage:RevealModeStorage};
beforeEach(()=>{mockValue=null;mockWriteError=false;mockDelayed=false;mockFiles.length=0;});
test('persists only a reveal mode in the app-private preference file',async()=>{
  expect(await revealModeStorage.read()).toBeNull();
  await revealModeStorage.write('manual');expect(await revealModeStorage.read()).toBe('manual');
  await revealModeStorage.write('automatic');expect(await revealModeStorage.read()).toBe('automatic');
  expect(mockFiles.every(([path,name])=>path==='private-documents'&&name==='app-reveal-mode.txt')).toBe(true);
});
test('storage failures propagate so Settings can keep working and offer retry',async()=>{
  mockWriteError=true;await expect(revealModeStorage.write('manual')).rejects.toThrow('unavailable');
});


test('delayed native write must complete before the adapter reports success',async()=>{
  mockDelayed=true;
  let completed=false;
  const request=revealModeStorage.write('manual').then(()=>{completed=true;});
  for(let i=0;i<5;i++)await Promise.resolve();
  expect(completed).toBe(false);
  mockFinish();await request;
  expect(await revealModeStorage.read()).toBe('manual');
});
test('delayed native write failure reaches the caller for localized saving retry',async()=>{
  mockDelayed=true;
  const request=revealModeStorage.write('automatic');
  const failure=expect(request).rejects.toThrow('delayed failure');
  for(let i=0;i<5;i++)await Promise.resolve();
  mockReject(new Error('delayed failure'));await failure;
});
