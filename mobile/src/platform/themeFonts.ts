import catalog from '../themes/fontCatalog.json';
import { fontAssets } from '../themes/fontAssets';
import { themeResource } from '../themes';
import { validateFontReferences } from '../themes/typography';

export async function loadThemeFonts(): Promise<void> {
  validateFontReferences(themeResource, catalog.fonts);
  // Loaded on demand so an older dev client can report a recoverable missing-module error.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadAsync } = require('expo-font') as typeof import('expo-font');
  await loadAsync(fontAssets);
}
