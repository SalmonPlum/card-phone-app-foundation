import type { Locale } from '../domain/contracts.ts';
import { en } from './en.ts';
import { cs } from './cs.ts';
import type { TranslationKey } from './en.ts';
export type { TranslationKey } from './en.ts';

export function resolveLocale(languageTags: readonly string[]): Locale {
  for (const tag of languageTags) {
    const language = tag.toLowerCase().split('-')[0];
    if (language === 'cs' || language === 'en') return language;
  }
  return 'en';
}
export function t(key: TranslationKey, locale: Locale, values: Record<string, string | number> = {}): string {
  const template = (locale === 'cs' ? cs : en)[key];
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => Object.hasOwn(values, name) ? String(values[name]) : placeholder);
}
