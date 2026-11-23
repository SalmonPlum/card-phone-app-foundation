import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateInfo} from '../generate-info.ts';
test('compile both locales, reject stale output, support omission and contextual failures',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'info-fixture-')),out=join(dir,'out.json');
  try {
    await writeFile(join(dir,'page.json'),JSON.stringify({en:'en.md',cs:'cs.md'}));
    await writeFile(join(dir,'en.md'),'---\nmenuLabel: About me\n---\n# About me');
    await assert.rejects(generateInfo(dir,out),/cs\.md/);
    await writeFile(join(dir,'cs.md'),'---\nmenuLabel: O mně\n---\n# O mně');
    await generateInfo(dir,out);
    assert.equal(JSON.parse(await readFile(out,'utf8')).cs.menuLabel,'O mně');
    await generateInfo(dir,out,true);
    await writeFile(join(dir,'en.md'),'---\nmenuLabel: Info\n---\n# Changed');
    await assert.rejects(generateInfo(dir,out,true),/stale|generate:info/i);
    await writeFile(join(dir,'page.json'),JSON.stringify({en:'../en.md',cs:'cs.md'}));
    await assert.rejects(generateInfo(dir,out),/path|filename/i);
    await writeFile(join(dir,'page.json'),JSON.stringify({en:'en.md'}));
    await assert.rejects(generateInfo(dir,out),/en.*cs|locale/i);
    await writeFile(join(dir,'page.json'),JSON.stringify({en:'en.md',cs:'cs.md'}));
    await writeFile(join(dir,'cs.md'),'broken');
    await assert.rejects(generateInfo(dir,out),/cs\.md.*metadata/i);
    await writeFile(join(dir,'page.json'),'null');
    await generateInfo(dir,out); assert.equal(JSON.parse(await readFile(out,'utf8')),null);
  } finally {await rm(dir,{recursive:true,force:true});}
});
