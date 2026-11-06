import type { RevealMode } from '../domain/contracts';

export type RevealModeStorage = {read:()=>Promise<string|null>;write:(mode:RevealMode)=>Promise<void>};

// Load native storage on demand so a dev client lacking the new module can
// still change reveal mode for this run and report a recoverable save failure.
async function revealModeFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {File,Paths}=require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document,'app-reveal-mode.txt');
}
export const revealModeStorage:RevealModeStorage={
  async read(){const file=await revealModeFile();return file.exists?file.text():null;},
  async write(mode){
    const file=await revealModeFile();
    if(!file.exists) file.create();
    await file.write(mode);
  },
};
