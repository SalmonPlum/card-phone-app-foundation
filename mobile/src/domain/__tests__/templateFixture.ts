import type {DeckManifest} from '../contracts.ts';
import {deckFixture} from './fixtures.ts';
/** Content key order deliberately differs from template order. */
export function templateFixture():DeckManifest {
 const base=deckFixture(1);
 return {...base,schemaVersion:2,detailTemplate:{sections:[
  {id:'reflection',titles:{en:'Reflect',cs:'Zamyšlení'}},
  {id:'guidance',titles:{en:'Try this',cs:'Vyzkoušejte'}},
  {id:'context',titles:{en:'Context',cs:'Souvislosti'}},
 ]},cards:[{...base.cards[0],translations:{
  en:{name:'Custom card',sections:{context:'English context.',guidance:'English guidance.',reflection:'First paragraph.\n\nSecond paragraph.'}},
  cs:{name:'Vlastní karta',sections:{guidance:'České doporučení.',context:'České souvislosti.',reflection:'První odstavec.\n\nDruhý odstavec.'}},
 }}]};
}
