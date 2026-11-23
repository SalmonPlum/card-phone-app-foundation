export type HapticsStorage = {read:()=>Promise<string|null>;write:(enabled:boolean)=>Promise<void>};

// Load native storage on demand so a dev client lacking the new module can
// still change haptic feedback for this run and report a recoverable save failure.
async function hapticsFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {File,Paths}=require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document,'app-haptics.txt');
}
export const hapticsStorage:HapticsStorage={
  async read(){const file=await hapticsFile();return file.exists?file.text():null;},
  async write(enabled){
    const file=await hapticsFile();
    if(!file.exists) file.create();
    await file.write(String(enabled));
  },
};
