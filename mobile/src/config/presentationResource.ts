import {en,type TranslationKey} from '../i18n/en.ts';
import {cs} from '../i18n/cs.ts';
import type {Locale} from '../domain/contracts.ts';

export const defaultMenuIcons = {index:'cards',catalogue:'grid',history:'clock',info:'info',settings:'settings'} as const;
export type MenuRoute = keyof typeof defaultMenuIcons;
export type MenuIcon = typeof defaultMenuIcons[MenuRoute];
export type LocalizedText = Readonly<Record<Locale,string>>;
export type AppPresentation = Readonly<{
  schemaVersion:1;
  texts:Readonly<Partial<Record<TranslationKey,LocalizedText>>>;
  menuIcons:Readonly<Partial<Record<MenuRoute,MenuIcon>>>;
  infoMenuLabel?:LocalizedText;
}>;
const iconNames = new Set<string>(Object.values(defaultMenuIcons));
function fail(path:string,message:string):never {throw new Error(`${path}: ${message}`);}
function object(value:unknown,path:string):Record<string,unknown> {
  if(value===null||typeof value!=='object'||Array.isArray(value))fail(path,'expected an object');
  return value as Record<string,unknown>;
}
function fields(value:Record<string,unknown>,allowed:readonly string[],path:string){
  for(const key of Object.keys(value))if(!allowed.includes(key))fail(`${path}.${key}`,'unknown field');
}
function placeholders(text:string):string[] {
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]))].sort();
}
function localized(value:unknown,path:string,base:LocalizedText):LocalizedText {
  const input=object(value,path);
  fields(input,['en','cs'],path);
  for(const locale of ['en','cs'] as const){
    const text=input[locale];
    if(typeof text!=='string'||!text.trim())fail(`${path}.${locale}`,'expected nonblank text');
    const expected=placeholders(base[locale]);
    if(/[{}]/.test(text.replace(/\{\w+\}/g,''))||JSON.stringify(placeholders(text))!==JSON.stringify(expected)){
      fail(`${path}.${locale}`,`expected placeholders: ${expected.map(key=>`{${key}}`).join(', ')||'(none)'}`);
    }
  }
  return {en:input.en as string,cs:input.cs as string};
}
/** Author input is unknown until every field, locale and placeholder is checked. */
export function validatePresentation(value:unknown):AppPresentation {
  const input=object(value,'presentation');
  fields(input,['schemaVersion','texts','menuIcons','infoMenuLabel'],'presentation');
  if(input.schemaVersion!==1)fail('presentation.schemaVersion','expected 1');
  const texts:Partial<Record<TranslationKey,LocalizedText>>={};
  if(Object.hasOwn(input,'texts')){
    for(const [key,value] of Object.entries(object(input.texts,'presentation.texts'))){
      if(!Object.hasOwn(en,key))fail(`presentation.texts.${key}`,'unknown translation key');
      const typed=key as TranslationKey;
      texts[typed]=localized(value,`presentation.texts.${key}`,{en:en[typed],cs:cs[typed]});
    }
  }
  const menuIcons:Partial<Record<MenuRoute,MenuIcon>>={};
  if(Object.hasOwn(input,'menuIcons')){
    for(const [route,icon] of Object.entries(object(input.menuIcons,'presentation.menuIcons'))){
      if(!Object.hasOwn(defaultMenuIcons,route))fail(`presentation.menuIcons.${route}`,'unknown route');
      if(typeof icon!=='string'||!iconNames.has(icon))fail(`presentation.menuIcons.${route}`,`expected one of: ${[...iconNames].join(', ')}`);
      menuIcons[route as MenuRoute]=icon as MenuIcon;
    }
  }
  const infoMenuLabel=Object.hasOwn(input,'infoMenuLabel')?localized(input.infoMenuLabel,'presentation.infoMenuLabel',{en:'',cs:''}):undefined;
  return {schemaVersion:1,texts,menuIcons,infoMenuLabel};
}
