export type ThemeStorage = { read: () => Promise<string | null>; write: (id: string) => Promise<void> };

async function themeFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document, 'app-theme.txt');
}

export const themeStorage: ThemeStorage = {
  async read() { const file = await themeFile(); return file.exists ? file.text() : null; },
  async write(id) {
    const file = await themeFile();
    if (!file.exists) file.create();
    await file.write(id);
  },
};
