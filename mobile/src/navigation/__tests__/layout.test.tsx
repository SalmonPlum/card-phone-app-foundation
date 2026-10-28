import type { TestInstance } from 'test-renderer';
import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { AppState, StyleSheet } from 'react-native';
import * as SafeArea from 'react-native-safe-area-context';
import { advance, flushRn, resetClock, settle } from '../../features/cards/__tests__/helpers/overlayClock';
import RootLayout from '../../app/_layout';
import Tabs from '../../app/(tabs)/_layout';
import Draw from '../../app/(tabs)/index';
import Catalogue from '../../app/(tabs)/catalogue';
import Details from '../../app/card/[id]';
import { fitForegroundRect } from '../../features/cards/overlayGeometry';
import { useSession } from '../../session/SessionProvider';

jest.mock('expo-router/build/testing-library/mocks', () => ({}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'layout-session', getRandomValues: (values: Uint32Array) => values.fill(0) }));
const native = jest.requireActual('react-native') as { useWindowDimensions: typeof import('react-native').useWindowDimensions };
const methods = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
const nativeAppState = AppState.currentState;
let reportedHeight = 0;
function HeightObserver() {
  const height = useBottomTabBarHeight();
  useLayoutEffect(() => { reportedHeight = height; }, [height]);
  return null;
}
function CatalogueWithHeight() { return <><Catalogue /><HeightObserver /></>; }
let session: ReturnType<typeof useSession>;
function DrawWithHeight() {
  const current = useSession();
  useLayoutEffect(() => { session = current; }, [current]);
  return <><Draw /><HeightObserver /></>;
}
beforeEach(() => { resetClock(); AppState.currentState = 'active'; });
afterEach(() => { AppState.currentState = nativeAppState; (methods.measureInWindow as jest.Mock).mockReset(); });

// Jest has no Yoga/native text layout. Feed the installed navigator's real
// onLayout/measureInWindow boundaries with representative native layout reports.
// This verifies consumption of measured bounds, not physical font metrics.
test.each([
  { width: 320, height: 568, fontScale: 2, bottom: 34, dockHeight: 146 },
  { width: 280, height: 480, fontScale: 1.5, bottom: 16, dockHeight: 126 },
  { width: 430, height: 932, fontScale: 1, bottom: 34, dockHeight: 102 },
].flatMap(fixture => ['catalogue', 'results'].map(collection => ({ ...fixture, collection }))))('reserves the measured dock once for $collection at $width dp/font $fontScale and fits the overlay to the remaining host', async fixture => {
  const dimensions = jest.spyOn(native, 'useWindowDimensions').mockReturnValue({ width: fixture.width, height: fixture.height, scale: 3, fontScale: fixture.fontScale });
  const insets = { top: 24, bottom: fixture.bottom, left: 0, right: 0 };
  const hostHeight = fixture.height - fixture.dockHeight;
  function RootWithInsets() { return <SafeArea.SafeAreaInsetsContext.Provider value={insets}><RootLayout /></SafeArea.SafeAreaInsetsContext.Provider>; }
  (methods.measureInWindow as jest.Mock).mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 0, fixture.width, hostHeight));
  try {
    await renderRouter({ _layout: RootWithInsets, '(tabs)/_layout': Tabs, '(tabs)/index': DrawWithHeight, '(tabs)/catalogue': CatalogueWithHeight, 'card/[id]': Details });
    const stop = screen.getByRole('button', { name: 'Stop' });
    let scroll = stop.parent;
    while (scroll && scroll.type !== 'RCTScrollView') scroll = scroll.parent;
    expect(scroll).not.toBeNull(); // Minimum mat/control bounds remain reachable on short screens.
    const safe = screen.getByTestId('draw-screen');
    expect(safe.props.edges.bottom).toBe('off');
    const dock = screen.getByTestId('bottom-dock');
    expect(StyleSheet.flatten(dock.props.style)).toMatchObject({ paddingBottom: fixture.bottom });
    expect(StyleSheet.flatten(dock.props.style).position).not.toBe('absolute');
    for (const tab of screen.getAllByRole('tab')) {
      expect(StyleSheet.flatten(tab.props.style)).toMatchObject({ minHeight: 48, minWidth: 48 });
    }
    expect(screen.getByText('Catalogue').props.numberOfLines).toBeUndefined();
    await fireEvent(dock, 'layout', { nativeEvent: { layout: { x: 0, y: hostHeight, width: fixture.width, height: fixture.dockHeight } } });
    const results = fixture.collection === 'results';
    if (results) {
      const first = session.state!;
      await act(() => session.draw({ x: 620, y: 330, angle: 0, scale: 1 }, first.sessionId, first.epoch));
      for (let i = 0; i < 3; i++) { const s = session.state!; await act(() => session.complete(s.sessionId, s.epoch)); }
      await fireEvent.press(screen.getByRole('button', { name: 'Confirm card' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
      expect(screen.queryByTestId('draw-screen')).toBeNull();
    } else await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
    expect(reportedHeight).toBe(fixture.dockHeight);
    const hostID = results ? 'results-host' : 'catalogue-host';
    const host = screen.getByTestId(hostID);
    expect((host.children[0] as TestInstance).props.edges.bottom).toBe('off');
    await fireEvent(host, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: fixture.width, height: hostHeight } } });
    const grid = screen.getByTestId('card-grid');
    await fireEvent.press(screen.getByRole('button', { name: results ? 'Spring' : 'Seed' }));
    await fireEvent(screen.getByTestId(`overlay-face-${results ? 7 : 0}`), 'loadEnd');
    await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 358 } } });
    await settle(); await advance(420); await flushRn();
    const face = screen.getByTestId('overlay-face-surface');
    const pose = face.props.style[1].__read();
    const target = fitForegroundRect({ width: fixture.width, height: hostHeight }, 238 / 358, 24, 0);
    expect(pose.transform[0].translateX).toBeCloseTo(target.x - (238 - target.width) / 2);
    expect(pose.transform[1].translateY).toBeCloseTo(target.y - (358 - target.height) / 2);
    expect(pose.transform[2].scaleX).toBeCloseTo(target.width / 238);
    expect(pose.transform[3].scaleY).toBeCloseTo(target.height / 358);
    expect(StyleSheet.flatten(screen.getByTestId('overlay-details').props.style).bottom).toBe(0);
    expect(target.y + target.height).toBeLessThanOrEqual(hostHeight);
    expect(screen.getByTestId(hostID)).toBe(host);
    expect(screen.getByTestId('card-grid', { includeHiddenElements: true })).toBe(grid);
  } finally { dimensions.mockRestore(); }
});
