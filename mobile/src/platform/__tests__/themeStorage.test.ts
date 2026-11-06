import type {ThemeStorage} from '../themeStorage';
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
const {themeStorage}=jest.requireActual('../themeStorage') as {themeStorage:ThemeStorage};
beforeEach(()=>{mockValue=null;mockWriteError=false;mockDelayed=false;mockFiles.length=0;});
test('persists only a theme ID in the app-private preference file',async()=>{
  expect(await themeStorage.read()).toBeNull();
  await themeStorage.write('celestial-midnight');expect(await themeStorage.read()).toBe('celestial-midnight');
  await themeStorage.write('solstice-ochre');expect(await themeStorage.read()).toBe('solstice-ochre');
  expect(mockFiles.every(([path,name])=>path==='private-documents'&&name==='app-theme.txt')).toBe(true);
});
test('storage failures propagate so Settings can keep working and offer retry',async()=>{
  mockWriteError=true;await expect(themeStorage.write('celestial-midnight')).rejects.toThrow('unavailable');
});


test('delayed native write must complete before the adapter reports success',async()=>{
  mockDelayed=true;
  let completed=false;
  const request=themeStorage.write('celestial-midnight').then(()=>{completed=true;});
  for(let i=0;i<5;i++)await Promise.resolve();
  expect(completed).toBe(false);
  mockFinish();await request;
  expect(await themeStorage.read()).toBe('celestial-midnight');
});
test('delayed native write failure reaches the caller for localized saving retry',async()=>{
  mockDelayed=true;
  const request=themeStorage.write('solstice-ochre');
  const failure=expect(request).rejects.toThrow('delayed failure');
  for(let i=0;i<5;i++)await Promise.resolve();
  mockReject(new Error('delayed failure'));await failure;
});
