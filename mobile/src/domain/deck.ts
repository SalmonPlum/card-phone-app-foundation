import type { Card, DeckManifest, Locale, LocalizedCard } from './contracts.ts';

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path}: expected an object`);
  return value as Record<string, unknown>;
}
function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${path}: expected nonblank text`);
}

/** Upgrade original fixed-field content without changing or discarding its text. */
function normalizeLegacy(deck:Record<string,unknown>):Record<string,unknown> {
  if(deck.schemaVersion!==1) return deck;
  if(!Array.isArray(deck.cards)) throw new Error('cards: expected an array');
  return {...deck,schemaVersion:2,detailTemplate:{sections:[
    {id:'meaning',titles:{cs:'Význam',en:'Meaning'}},
    {id:'description',titles:{cs:'Popis',en:'Description'}},
  ]},cards:deck.cards.map((value,index)=>{
    const card=record(value,`cards[${index}]`);
    const translations=record(card.translations,`cards[${index}].translations`);
    const convert=(locale:Locale)=>{
      const path=`cards[${index}].translations.${locale}`;
      const translation=record(translations[locale],path);
      const {meaning,description,...rest}=translation;
      text(meaning,`${path}.meaning`);text(description,`${path}.description`);
      return {...rest,sections:{meaning,description}};
    };
    return {...card,translations:{cs:convert('cs'),en:convert('en')}};
  })};
}

/** Validate bundled content before creating sessions or rendering assets. */
export function validateDeck(input: unknown, assetKeys: ReadonlySet<string>): DeckManifest {
  const deck = normalizeLegacy(record(input, 'deck'));
  const asset = (value: unknown, path: string) => {
    text(value, path);
    if (!assetKeys.has(value)) throw new Error(`${path}: unknown asset key "${value}"`);
  };
  if (deck.schemaVersion !== 2) throw new Error('schemaVersion: supported versions are 1 and 2');
  text(deck.id, 'id'); text(deck.version, 'version');
  const name = record(deck.name, 'name');
  for (const locale of ['cs', 'en'] as const) text(name[locale], `name.${locale}`);
  asset(deck.backAsset, 'backAsset');
  if (deck.localizedBackAssets !== undefined) {
    const backs = record(deck.localizedBackAssets, 'localizedBackAssets');
    for (const locale of ['cs', 'en'] as const) {
      if (Object.hasOwn(backs, locale)) asset(backs[locale], `localizedBackAssets.${locale}`);
    }
  }
  const template=record(deck.detailTemplate,'detailTemplate');
  if(!Array.isArray(template.sections)||template.sections.length===0) throw new Error('detailTemplate.sections: expected at least one section');
  const sectionIds=new Set<string>();
  for(const [index,value] of template.sections.entries()) {
    const path=`detailTemplate.sections[${index}]`,section=record(value,path);
    text(section.id,`${path}.id`);
    if(!/^[a-z][a-z0-9_-]*$/.test(section.id)) throw new Error(`${path}.id: expected a lowercase section identifier`);
    if(sectionIds.has(section.id)) throw new Error(`${path}.id: duplicate section ID ${section.id}`);
    sectionIds.add(section.id);
    const titles=record(section.titles,`${path}.titles`);
    for(const locale of ['cs','en'] as const) text(titles[locale],`${path}.titles.${locale}`);
  }
  if (!Array.isArray(deck.cards) || deck.cards.length < 1 || deck.cards.length > 100) throw new Error('cards: expected 1–100 cards');
  const ids = new Set<number>();
  for (const [index, value] of deck.cards.entries()) {
    const path = `cards[${index}]`;
    const card = record(value, path);
    if (typeof card.id !== 'number' || !Number.isSafeInteger(card.id) || card.id < 0) throw new Error(`${path}.id: expected a nonnegative safe integer`);
    if (ids.has(card.id)) throw new Error(`${path}.id: duplicate card ID ${card.id}`);
    ids.add(card.id);
    asset(card.faceAsset, `${path}.faceAsset`);
    const translations = record(card.translations, `${path}.translations`);
    for (const locale of ['cs', 'en'] as const) {
      const translation = record(translations[locale], `${path}.translations.${locale}`);
      text(translation.name,`${path}.translations.${locale}.name`);
      const sections=record(translation.sections,`${path}.translations.${locale}.sections`);
      for(const id of sectionIds) {
        const sectionPath=`${path}.translations.${locale}.sections.${id}`;
        if(!Object.hasOwn(sections,id)) throw new Error(`${sectionPath}: missing section content`);
        text(sections[id],sectionPath);
      }
      for(const id of Object.keys(sections)) if(!sectionIds.has(id)) throw new Error(`${path}.translations.${locale}.sections.${id}: undeclared section`);
      if (Object.hasOwn(translation, 'faceAsset')) asset(translation.faceAsset, `${path}.translations.${locale}.faceAsset`);
    }
  }
  // Every field consumed by DeckManifest has been checked above; array order is untouched.
  return deck as DeckManifest;
}

export function localizeCard(card: Card, locale: Locale): LocalizedCard {
  const { name, sections, faceAsset } = card.translations[locale];
  return { id: card.id, name, sections, faceAsset: faceAsset ?? card.faceAsset };
}
export function localizeBackAsset(deck: DeckManifest, locale: Locale): string {
  return deck.localizedBackAssets?.[locale] ?? deck.backAsset;
}

export function localizeCardSections(deck:Pick<DeckManifest,'detailTemplate'>,card:Card,locale:Locale):{id:string;title:string;content:string}[] {
  return deck.detailTemplate.sections.map(section=>({id:section.id,title:section.titles[locale],content:card.translations[locale].sections[section.id]}));
}
