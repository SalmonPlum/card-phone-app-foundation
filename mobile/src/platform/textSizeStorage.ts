import type { TextSize } from '../settings/textSize';

export type TextSizeStorage = { read: () => Promise<string | null>; write: (size: TextSize) => Promise<void> };

async function textSizeFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document, 'app-text-size.txt');
}

export const textSizeStorage: TextSizeStorage = {
  async read() { const file = await textSizeFile(); return file.exists ? file.text() : null; },
  async write(size) {
    const file = await textSizeFile();
    if (!file.exists) file.create();
    await file.write(size);
  },
};
