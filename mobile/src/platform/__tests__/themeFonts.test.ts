import catalog from '../../themes/fontCatalog.json';

let mockResolve!: () => void, mockReject!: (error: Error) => void;
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => new Promise<void>((resolve, reject) => { mockResolve = resolve; mockReject = reject; })),
}));
const { loadThemeFonts } = jest.requireActual('../themeFonts') as typeof import('../themeFonts');
const native = jest.requireMock('expo-font') as { loadAsync: jest.Mock };
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('native font completion is awaited and the complete offline alias registry is passed', async () => {
  let complete = false;
  const loading = loadThemeFonts().then(() => { complete = true; }); await flush();
  expect(complete).toBe(false);
  const sources = native.loadAsync.mock.calls.at(-1)![0];
  expect(Object.keys(sources).sort()).toEqual(catalog.fonts.map(font => font.alias).sort());
  expect(Object.values(sources).every(source => source !== undefined)).toBe(true);
  mockResolve(); await loading;
  expect(complete).toBe(true);
});

test('native load rejection reaches startup recovery instead of claiming fonts are ready', async () => {
  const loading = loadThemeFonts();
  const failed = expect(loading).rejects.toThrow('native failure'); await flush();
  mockReject(new Error('native failure')); await failed;
});
