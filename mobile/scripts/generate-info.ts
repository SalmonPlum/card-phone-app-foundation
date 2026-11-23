import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseInfoMarkdown,type InfoPage} from '../src/info/markdown.ts';

export async function generateInfo(resourceDir:string,output:string,check=false):Promise<void> {
  let config:unknown;
  try {config=JSON.parse(await readFile(resolve(resourceDir,'page.json'),'utf8'));}
  catch(error){throw new Error(`info/page.json: ${String(error)}`);}
  let page:InfoPage=null;
  if(config!==null){
    if(typeof config!=='object'||Array.isArray(config)||Object.keys(config).sort().join(',')!=='cs,en')throw new Error('info/page.json: expected en and cs locale filenames, or null');
    const files=config as Record<string,unknown>;
    page={} as NonNullable<InfoPage>;
    for(const locale of ['en','cs'] as const){
      const filename=files[locale];
      if(typeof filename!=='string'||! /^[A-Za-z0-9_-]+\.md$/.test(filename)||basename(filename)!==filename)throw new Error(`info/page.json: invalid ${locale} Markdown filename/path`);
      try {page[locale]=parseInfoMarkdown(await readFile(resolve(resourceDir,filename),'utf8'));}
      catch(error){throw new Error(`info/${filename}: ${String(error)}`);}
    }
  }
  const serialized=JSON.stringify(page,null,2)+'\n';
  if(check){
    let actual='';try {actual=await readFile(output,'utf8');}catch{}
    if(actual!==serialized)throw new Error('Generated Info resource is missing or stale; run npm run generate:info');
  } else await writeFile(output,serialized);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  await generateInfo(resolve(root,'resources/info'),resolve(root,'src/info/generated.json'),process.argv.includes('--check'));
  console.log(process.argv.includes('--check')?'Info resources validated; generated output matches.':'Generated bundled Info resource.');
}
