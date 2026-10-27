import { useLocales } from 'expo-localization';
import { resolveLocale } from './locale';

export function useLocale() {
  return resolveLocale(useLocales().map(locale => locale.languageTag));
}
