import type { Locale } from '../domain/contracts';

export type LanguageStorage = {read:()=>Promise<string|null>;write:(locale:Locale)=>Promise<void>};

// Load native storage on demand so a dev client lacking the new module can
// still change language for this run and report a recoverable save failure.
async function languageFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {File,Paths}=require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document,'app-language.txt');
}
export const languageStorage:LanguageStorage={
  async read(){const file=await languageFile();return file.exists?file.text():null;},
  async write(locale){
    const file=await languageFile();
    if(!file.exists) file.create();
    await file.write(locale);
  },
};
