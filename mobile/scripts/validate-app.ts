import {readFile} from 'node:fs/promises';
import {validatePresentation} from '../src/config/presentationResource.ts';

const resource=new URL('../resources/app/presentation.json',import.meta.url);
try {
  validatePresentation(JSON.parse(await readFile(resource,'utf8')));
  console.log('App presentation resource validated.');
} catch(error){
  console.error(`resources/app/presentation.json: ${error instanceof Error?error.message:String(error)}`);
  process.exitCode=1;
}
