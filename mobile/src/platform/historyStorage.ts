import type {HistoryArchive} from '../history/archive';
export type HistoryStorage={read():Promise<string|null>;write(archive:HistoryArchive):Promise<void>};
async function files(){
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs=require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  if(!fs.documentDirectory)throw new Error('Private storage unavailable');
  const directory=fs.documentDirectory+'app-drawing-history/';
  const exists=(await fs.getInfoAsync(directory)).exists;
  const names=exists?await fs.readDirectoryAsync(directory):[];
  const generations=names.filter(name=>/^history-[1-9]\d*\.json$/.test(name)).map(name=>({name,generation:Number(name.slice(8,-5))}));
  if(generations.some(file=>!Number.isSafeInteger(file.generation)))throw new Error('Invalid history generation');
  generations.sort((a,b)=>b.generation-a.generation);
  return {fs,directory,generations};
}
export const historyStorage:HistoryStorage={
  async read(){const {fs,directory,generations}=await files();return generations.length?fs.readAsStringAsync(directory+generations[0].name):null;},
  async write(archive){
    const {fs,directory,generations}=await files();
    const next=(generations[0]?.generation??0)+1;if(!Number.isSafeInteger(next))throw new Error('History generation exhausted');
    await fs.makeDirectoryAsync(directory,{intermediates:true});
    const pending=directory+'pending.json';
    await fs.writeAsStringAsync(pending,JSON.stringify(archive));
    // Fresh destination on the same private filesystem: publish after complete writing.
    await fs.moveAsync({from:pending,to:directory+`history-${next}.json`});
    for(const file of generations)await fs.deleteAsync(directory+file.name,{idempotent:true});
  },
};
