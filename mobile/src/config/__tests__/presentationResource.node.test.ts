import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {validatePresentation, defaultMenuIcons} from '../presentationResource.ts';

test('defaults preserve foundation text, Markdown label and route icons',()=>{
  assert.deepEqual(validatePresentation({schemaVersion:1}),{schemaVersion:1,texts:{},menuIcons:{},infoMenuLabel:undefined});
  assert.deepEqual(defaultMenuIcons,{index:'cards',catalogue:'grid',history:'clock',info:'info',settings:'settings'});
});
test('accepts bilingual text, exact placeholders and all bundled icons',()=>{
  const resource={schemaVersion:1,texts:{stop:{en:'Finish reading',cs:'Dokončit vykládání'},cardPosition:{en:'{total} cards: {position}',cs:'{position} z {total}'}},menuIcons:{index:'grid',catalogue:'cards',history:'info',info:'settings',settings:'clock'},infoMenuLabel:{en:'Our story',cs:'Náš příběh'}};
  assert.deepEqual(validatePresentation(resource),resource);
});
for(const [name,resource,path] of [
  ['null',null,'presentation'],['array',[],'presentation'],['version',{schemaVersion:2},'schemaVersion'],
  ['missing version',{},'schemaVersion'],['unknown root',{schemaVersion:1,menuOrder:[]},'menuOrder'],
  ['unknown text',{schemaVersion:1,texts:{typo:{en:'A',cs:'B'}}},'texts.typo'],
  ['blank text',{schemaVersion:1,texts:{stop:{en:' ',cs:'B'}}},'texts.stop.en'],
  ['missing locale',{schemaVersion:1,texts:{stop:{en:'A'}}},'texts.stop.cs'],
  ['extra locale',{schemaVersion:1,infoMenuLabel:{en:'A',cs:'B',de:'C'}},'infoMenuLabel.de'],
  ['nonstring',{schemaVersion:1,texts:{stop:{en:1,cs:'B'}}},'texts.stop.en'],
  ['null texts',{schemaVersion:1,texts:null},'texts'],
  ['missing placeholder',{schemaVersion:1,texts:{drawnCount:{en:'Cards',cs:'Karty: {count}'}}},'texts.drawnCount.en'],
  ['extra placeholder',{schemaVersion:1,texts:{stop:{en:'Finish {count}',cs:'Konec'}}},'texts.stop.en'],
  ['malformed placeholder',{schemaVersion:1,texts:{stop:{en:'Finish {oops',cs:'Konec'}}},'texts.stop.en'],
  ['info placeholder',{schemaVersion:1,infoMenuLabel:{en:'{count}',cs:'Info'}},'infoMenuLabel.en'],
  ['unknown route',{schemaVersion:1,menuIcons:{draw:'cards'}},'menuIcons.draw'],
  ['unknown icon',{schemaVersion:1,menuIcons:{index:'star'}},'menuIcons.index'],
  ['prototype text',JSON.parse('{"schemaVersion":1,"texts":{"__proto__":{"en":"A","cs":"B"}}}'),'texts.__proto__'],
  ['prototype route',JSON.parse('{"schemaVersion":1,"menuIcons":{"constructor":"cards"}}'),'menuIcons.constructor'],
] as const){test(`rejects ${name} with field context`,()=>assert.throws(()=>validatePresentation(resource),error=>error instanceof Error&&error.message.includes(path)));}
