import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { sampleDeck } from '../../../decks/sample';
import { CardGrid } from '../CardGrid';
import { CardDetails } from '../CardDetails';

// The preset's Image mock skips the native component's intrinsic-size styles.
// Exercise both installed platform implementations at that boundary instead.
const native = jest.requireActual('react-native') as {
  Image: unknown;
  useWindowDimensions: typeof ReactNative.useWindowDimensions;
};
const nativeImages = [
  ['iOS', jest.requireActual('react-native/Libraries/Image/Image.ios').default],
  ['Android', jest.requireActual('react-native/Libraries/Image/Image.android').default],
] as const;
const card = {
  ...sampleDeck.cards[0],
  translations: {
    ...sampleDeck.cards[0].translations,
    cs: { ...sampleDeck.cards[0].translations.cs, faceAsset: 'localized' },
  },
};
const assets = {
  'sample.seed': { uri: 'seed.png', width: 238, height: 358 },
  localized: { uri: 'localized.png', width: 600, height: 900 },
};

describe.each(nativeImages)('%s native image sizing', (_platform, Image) => {
  beforeEach(() => {
    jest.spyOn(native, 'Image', 'get').mockReturnValue(Image);
    jest.spyOn(native, 'useWindowDimensions').mockReturnValue({ width: 360, height: 800, scale: 3, fontScale: 1 });
  });
  afterEach(() => jest.restoreAllMocks());

  test.each([
    ['en', 238 / 358, 'seed.png'],
    ['cs', 2 / 3, 'localized.png'],
  ] as const)('constrains %s artwork to its two-column tile without a source-sized native height', async (locale, ratio, uri) => {
    await render(<CardGrid cards={[card, { ...card, id: 1 }]} locale={locale} assetRegistry={assets} onOpen={jest.fn()} scrollKey="geometry" />);
    const tile = ReactNative.StyleSheet.flatten(screen.getByTestId('card-tile-0').props.style);
    const face = screen.getByTestId('card-face-0');
    const nativeStyle = ReactNative.StyleSheet.flatten(face.props.style);
    // 360 dp viewport: two 158 dp tiles + 12 dp gutter + 16 dp each side.
    expect(tile.width).toBe(158);
    expect(nativeStyle.width).toBe('100%');
    // A definite intrinsic height lets Yoga expand width back to the source's
    // width using aspectRatio, overflowing the 158 dp tile (238/600 dp here).
    expect(nativeStyle.height).toBeUndefined();
    expect(nativeStyle.aspectRatio).toBeCloseTo(ratio);
    expect(face.props.source[0].uri).toBe(uri);
    expect(face.props.resizeMode).toBe('contain');
  });

  test.each([
    { uri: 'unknown.png' },
    { uri: 'invalid.png', width: 0, height: 0 },
  ])('keeps fallback proportions without intrinsic dimensions: %j', async source => {
    await render(<CardDetails card={card} locale="en" assetRegistry={{ 'sample.seed': source }} />);
    const face = screen.getByTestId('detail-face-0');
    const nativeStyle = ReactNative.StyleSheet.flatten(face.props.style);
    expect(nativeStyle.height).toBeUndefined();
    expect(nativeStyle.aspectRatio).toBeCloseTo(238 / 358);
    expect(face.props.resizeMode).toBe('contain');
  });
});
