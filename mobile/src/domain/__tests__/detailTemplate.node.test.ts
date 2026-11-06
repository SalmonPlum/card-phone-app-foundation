import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../deck.ts';
import {fixtureAssetKeys} from './fixtures.ts';
import {templateFixture} from './templateFixture.ts';

test('schema 2 validates and localizes every section in template order, not content key order',()=>{
 const input=templateFixture(),snapshot=JSON.stringify(input);
 const deck=api.validateDeck(input,fixtureAssetKeys);
 assert.equal(deck,input);assert.equal(JSON.stringify(input),snapshot);
 assert.deepEqual(api.localizeCardSections(deck,deck.cards[0],'en'),[
  {id:'reflection',title:'Reflect',content:'First paragraph.\n\nSecond paragraph.'},
  {id:'guidance',title:'Try this',content:'English guidance.'},
  {id:'context',title:'Context',content:'English context.'},
 ]);
 assert.equal(api.localizeCardSections(deck,deck.cards[0],'cs')[2].title,'Souvislosti');
 const other=templateFixture();other.detailTemplate.sections.reverse();
 assert.equal(api.localizeCardSections(other,other.cards[0],'en')[0].id,'context');
});
for(const [name,change] of [
 ['empty template',(d:any)=>{d.detailTemplate.sections=[];}],
 ['missing template',(d:any)=>{delete d.detailTemplate;}],
 ['duplicate ID',(d:any)=>{d.detailTemplate.sections[1].id='reflection';}],
 ['unsafe ID',(d:any)=>{d.detailTemplate.sections[0].id='__proto__';}],
 ['invalid ID',(d:any)=>{d.detailTemplate.sections[0].id='Two Words';}],
 ['blank title',(d:any)=>{d.detailTemplate.sections[0].titles.cs=' ';}],
 ['missing title',(d:any)=>{delete d.detailTemplate.sections[0].titles.en;}],
 ['missing section',(d:any)=>{delete d.cards[0].translations.en.sections.context;}],
 ['blank section',(d:any)=>{d.cards[0].translations.cs.sections.guidance='\n ';}],
 ['unknown section',(d:any)=>{d.cards[0].translations.en.sections.extra='Lost text';}],
 ['missing content map',(d:any)=>{delete d.cards[0].translations.cs.sections;}],
 ['array content',(d:any)=>{d.cards[0].translations.en.sections=[];}],
] as const)test(`rejects ${name} instead of silently hiding content`,()=>{
 const input=templateFixture();change(input);assert.throws(()=>api.validateDeck(input,fixtureAssetKeys));
});

test('schema 1 normalization preserves names, full text, artwork overrides and identity without mutation',()=>{
 const legacy={schemaVersion:1,id:'old',version:'1.0',name:{cs:'Stará sada',en:'Old deck'},backAsset:'back',localizedBackAssets:{cs:'cs-back'},cards:[{id:0,faceAsset:'face',translations:{
  cs:{name:'Původní',meaning:'Původní význam',description:'Dlouhý popis.\n\nDruhý odstavec.',faceAsset:'cs-face'},
  en:{name:'Original',meaning:'Original meaning',description:'Full description.\n\nSecond paragraph.'},
 }}]};
 const snapshot=JSON.stringify(legacy),deck=api.validateDeck(legacy,fixtureAssetKeys);
 assert.equal(deck.schemaVersion,2);assert.equal(JSON.stringify(legacy),snapshot);
 assert.deepEqual(api.localizeCardSections(deck,deck.cards[0],'cs'),[
  {id:'meaning',title:'Význam',content:legacy.cards[0].translations.cs.meaning},
  {id:'description',title:'Popis',content:legacy.cards[0].translations.cs.description},
 ]);
 assert.equal(api.localizeCard(deck.cards[0],'cs').faceAsset,'cs-face');assert.equal(deck.localizedBackAssets?.cs,'cs-back');
 const broken=structuredClone(legacy);broken.cards[0].translations.en.description='';
 assert.throws(()=>api.validateDeck(broken,fixtureAssetKeys),/description/);
});
