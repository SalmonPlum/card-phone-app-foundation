import { CardFace } from '../../features/cards/CardTile';
import type { Card } from '../../domain/contracts';
import { useLayoutEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { CardArtwork } from '../CardArtwork';
import { ArtworkProvider, artworkSize } from '../ArtworkProvider';
import type { ArtworkResource } from '../../domain/artwork';
import { ThemeProvider, useThemeSettings } from '../../themes/ThemeProvider';

const registry = { front: { uri: 'front' }, paper: { uri: 'paper' }, mask: { uri: 'mask' } };
const resource: ArtworkResource = { schemaVersion: 1, assets: { front: { width: 600, height: 900, layers: [
  { id: 'paper', asset: 'paper' }, { id: 'field', asset: 'mask', tint: { role: 'background', fallback: '#28554a' }, opacity: .7 },
] } } };
const storage = { read: async () => null, write: async () => {} };
let setTheme: (value: string) => void;
function ThemeControl() { const state = useThemeSettings(); useLayoutEffect(() => { setTheme = state.setTheme; }, [state]); return null; }
function Artwork({ loaded = jest.fn(), error = jest.fn() }) {
  return <CardArtwork assetKey="front" source={registry.front} registry={registry} testID="art" style={{ width: 200, height: 300 }} onLoadEnd={loaded} onError={error}/>;
}
test('raw fixed artwork retains its native single-image path and intrinsic sizing', async () => {
  const loaded = jest.fn();
  await render(<Artwork loaded={loaded}/>);
  expect(screen.getByTestId('art').type).toBe('Image');
  expect(screen.getByTestId('art').props.source).toBe(registry.front);
  await fireEvent(screen.getByTestId('art'), 'loadEnd'); expect(loaded).toHaveBeenCalledTimes(1);
  const size = jest.spyOn(Image, 'resolveAssetSource').mockReturnValue({ width: 800, height: 1200 } as ReturnType<typeof Image.resolveAssetSource>);
  expect(artworkSize('front', registry, {})).toEqual({ width: 800, height: 1200 });
  expect(artworkSize('front', registry, resource.assets)).toEqual({ width: 600, height: 900 });
  size.mockRestore();
});
test('ordered native layers use theme tint only on masks and retain every image across theme changes', async () => {
  const loaded = jest.fn();
  await render(<ThemeProvider storage={storage}><ArtworkProvider artwork={resource}><ThemeControl/><Artwork loaded={loaded}/></ArtworkProvider></ThemeProvider>);
  const paper = screen.getByTestId('art-layer-paper'), field = screen.getByTestId('art-layer-field');
  expect(paper.props.source).toBe(registry.paper); expect(StyleSheet.flatten(paper.props.style).tintColor).toBeUndefined();
  expect(field).toHaveStyle({ tintColor: '#1a382b', opacity: .7 });
  await fireEvent(paper, 'loadEnd'); expect(loaded).not.toHaveBeenCalled();
  await fireEvent(field, 'loadEnd'); expect(loaded).toHaveBeenCalledTimes(1);
  await act(() => setTheme('celestial-midnight'));
  expect(screen.getByTestId('art-layer-paper')).toBe(paper); expect(screen.getByTestId('art-layer-field')).toBe(field);
  expect(field).toHaveStyle({ tintColor: '#191f2f' }); expect(loaded).toHaveBeenCalledTimes(1);
});
test('layer errors replace partial composition with complete fallback and only fatal fallback failure reports an error', async () => {
  const loaded = jest.fn(), error = jest.fn();
  await render(<ArtworkProvider artwork={resource}><Artwork loaded={loaded} error={error}/></ArtworkProvider>);
  await fireEvent(screen.getByTestId('art-layer-field'), 'error');
  expect(screen.queryByTestId('art-layer-paper')).toBeNull();
  expect(error).not.toHaveBeenCalled(); expect(loaded).not.toHaveBeenCalled();
  expect(screen.getByTestId('art-fallback').props.source).toBe(registry.front);
  await fireEvent(screen.getByTestId('art-fallback'), 'error');
  expect(error).toHaveBeenCalledTimes(1); expect(loaded).toHaveBeenCalledTimes(1);
});

test('a composition can consist entirely of theme masks without requiring a fixed-color layer', async () => {
  const masks: ArtworkResource = { schemaVersion: 1, assets: { front: { ...resource.assets.front, layers: resource.assets.front.layers.slice(1) } } };
  const loaded = jest.fn();
  await render(<ArtworkProvider artwork={masks}><Artwork loaded={loaded}/></ArtworkProvider>);
  expect(screen.queryByTestId('art-layer-paper')).toBeNull();
  const mask = screen.getByTestId('art-layer-field');
  expect(mask).toHaveStyle({ tintColor: '#1a382b' });
  await fireEvent(mask, 'loadEnd'); expect(loaded).toHaveBeenCalledTimes(1);
});

test('localized front overrides select their own composition and native fallback while rejecting old load callbacks', async () => {
  const card: Card = { id: 99, faceAsset: 'front', translations: {
    en: { name: 'Card', sections: {} }, cs: { name: 'Karta', sections: {}, faceAsset: 'localized-front' },
  } };
  const localized: ArtworkResource = { schemaVersion: 1, assets: { ...resource.assets,
    'localized-front': { ...resource.assets.front, layers: [{ id: 'paper', asset: 'paper' }, { id: 'field', asset: 'mask', tint: { role: 'accent', fallback: '#bb9957' } }] },
  } };
  const assets = { ...registry, 'localized-front': { uri: 'czech-front' } }, loaded = jest.fn();
  const view = await render(<ArtworkProvider artwork={localized}><CardFace card={card} locale="en" assetRegistry={assets} testID="localized-art" onLoadEnd={loaded}/></ArtworkProvider>);
  const stale = screen.getByTestId('localized-art-layer-field').props.onLoadEnd;
  await view.rerender(<ArtworkProvider artwork={localized}><CardFace card={card} locale="cs" assetRegistry={assets} testID="localized-art" onLoadEnd={loaded}/></ArtworkProvider>);
  expect(screen.getByTestId('localized-art-layer-field')).toHaveStyle({ tintColor: '#c5a059' });
  await act(() => stale()); expect(loaded).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('localized-art-layer-field'), 'error');
  expect(screen.getByTestId('localized-art-fallback').props.source).toBe(assets['localized-front']);
  await fireEvent(screen.getByTestId('localized-art-fallback'), 'loadEnd');
  expect(loaded).toHaveBeenCalledTimes(1);
});
