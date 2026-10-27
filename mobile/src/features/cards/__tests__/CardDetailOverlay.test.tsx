import { advance, flushRn, resetClock, settle } from './helpers/overlayClock';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CardDetailOverlay, type CardDetailOverlayProps } from '../CardDetailOverlay';
import { sampleDeck } from '../../../decks/sample';
import { assetRegistry } from '../../../decks/assets';

const props: CardDetailOverlayProps = {
  card: sampleDeck.cards[0], locale: 'en', assetRegistry, reducedMotion: false,
  state: { stage: 'preparing', id: 0, generation: 1, host: { x: 10, y: 24, width: 360, height: 800 }, source: { x: 16, y: 176, width: 158, height: 237.66 }, closeTarget: null, closeReady: false },
  topInset: 24, bottomInset: 16, onReady: jest.fn(), onComplete: jest.fn(), onClose: jest.fn(),
};
function facePose() { return screen.getByTestId('overlay-face-surface').props.style[1].__read(); }
async function ready() {
  await fireEvent(screen.getByTestId('overlay-face-0'), 'loadEnd');
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 450 } } });
  await settle();
}
beforeEach(() => { resetClock(); jest.clearAllMocks(); });
test('native readiness gates the exact starting pose and details; the same image survives enlargement, scrolling and return', async () => {
  const view = await render(<CardDetailOverlay {...props} />);
  const image = screen.getByTestId('overlay-face-0');
  expect(image.props.fadeDuration).toBe(0);
  expect(screen.queryByText('A small beginning that needs care.')).toBeNull();
  expect(props.onReady).not.toHaveBeenCalled();
  await ready();
  expect(props.onReady).toHaveBeenCalledWith(1);
  const start = facePose();
  expect(start.opacity).toBe(1);
  // A 238dp base maps exactly to the measured face at x16/y176.
  expect(start.transform[0].translateX + (238 - 158) / 2).toBeCloseTo(16);
  expect(start.transform[2].scaleX).toBeCloseTo(158 / 238);
  await view.rerender(<CardDetailOverlay {...props} state={{ ...props.state, stage: 'opening' }} />);
  await settle(); await advance(420); await flushRn();
  expect(props.onComplete).toHaveBeenCalledWith(1);
  await view.rerender(<CardDetailOverlay {...props} state={{ ...props.state, stage: 'open' }} />);
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  const detailsOpacity = () => screen.getByTestId('overlay-details-body').props.style[1].__read().opacity;
  expect(detailsOpacity()).toBe(0);
  await settle(); await advance(160);
  expect(detailsOpacity()).toBe(1);
  await fireEvent.scroll(screen.getByTestId('overlay-details'), { nativeEvent: { contentOffset: { x: 0, y: 300 } } });
  const enlarged = facePose();
  await view.rerender(<CardDetailOverlay {...props} state={{ ...props.state, generation: 2, stage: 'closing', closeReady: true, closeTarget: props.state.source }} />);
  expect(screen.queryByText('A small beginning that needs care.')).toBeNull();
  await settle(); expect(facePose()).toEqual(enlarged);
  await advance(420); await flushRn();
  expect(facePose().transform).toEqual(start.transform);
  expect(screen.getByTestId('overlay-face-0')).toBe(image);
  expect(props.onComplete).toHaveBeenLastCalledWith(2);
});
test('closing samples current UI pose atomically even if a frame runs after the React commit', async () => {
  const view = await render(<CardDetailOverlay {...props} />); await ready();
  await view.rerender(<CardDetailOverlay {...props} state={{ ...props.state, stage: 'opening' }} />);
  await settle(); await advance(100);
  await view.rerender(<CardDetailOverlay {...props} state={{ ...props.state, generation: 2, stage: 'closing', closeReady: true, closeTarget: props.state.source }} />);
  await advance(50); const sampled = facePose();
  await settle(); expect(facePose()).toEqual(sampled);
  await advance(420); await flushRn();
  expect(props.onComplete).toHaveBeenLastCalledWith(2);
  expect(props.onComplete).not.toHaveBeenCalledWith(1);
});
test('missing return target fades the current image in place; reduced motion never travels', async () => {
  const view = await render(<CardDetailOverlay {...props} reducedMotion />); await ready();
  const initial = facePose();
  await view.rerender(<CardDetailOverlay {...props} reducedMotion state={{ ...props.state, stage: 'opening' }} />);
  await settle(); await flushRn();
  expect(facePose().transform).toEqual(initial.transform);
  await view.rerender(<CardDetailOverlay {...props} reducedMotion state={{ ...props.state, generation: 2, stage: 'closing', closeReady: true }} />);
  await settle(); await flushRn();
  expect(facePose().opacity).toBe(0);
  expect(facePose().transform).toEqual(initial.transform);
});
test('Czech text and Close stay accessible after entry', async () => {
  await render(<CardDetailOverlay {...props} locale="cs" state={{ ...props.state, stage: 'open' }} />);
  expect(screen.getByText('Malý začátek, který potřebuje péči.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Zavřít' }));
  expect(props.onClose).toHaveBeenCalledTimes(1);
});
