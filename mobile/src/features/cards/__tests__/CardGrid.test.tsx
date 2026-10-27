import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { sampleDeck } from '../../../decks/sample';
import { assetRegistry } from '../../../decks/assets';
import { CardGrid } from '../CardGrid';

const cards = sampleDeck.cards;
test('shows Czech captions without meanings, preserves numeric identity, and keeps a single tile at normal width', async () => {
  const view = await render(<CardGrid cards={[cards[0]]} locale="cs" assetRegistry={assetRegistry} onOpen={jest.fn()} scrollKey="single" />);
  expect(screen.getByText('Semínko')).toBeVisible();
  expect(screen.queryByText(cards[0].translations.cs.meaning)).toBeNull();
  const singleWidth = StyleSheet.flatten(screen.getByTestId('card-tile-0').props.style).width;
  await view.rerender(<CardGrid cards={cards} locale="cs" assetRegistry={assetRegistry} onOpen={jest.fn()} scrollKey="many" />);
  expect(StyleSheet.flatten(screen.getByTestId('card-tile-0').props.style).width).toBe(singleWidth);
});
test('wraps a long caption and contains the complete artwork', async () => {
  const name = 'Příliš žluťoučký kůň a dlouhý český název karty';
  const card = { ...cards[0], translations: { ...cards[0].translations, cs: { ...cards[0].translations.cs, name } } };
  await render(<CardGrid cards={[card]} locale="cs" assetRegistry={assetRegistry} onOpen={jest.fn()} scrollKey="long" />);
  expect(screen.getByText(name).props.numberOfLines).toBeUndefined();
  expect(screen.getByTestId('card-face-0').props.resizeMode).toBe('contain');
});
test('opens the tapped odd-row ID after scrolling and unlocks on returning focus', async () => {
  const open = jest.fn();
  const props = { cards: [cards[0], cards[1], cards[7]], locale: 'en' as const, assetRegistry, onOpen: open, scrollKey: 'catalogue' };
  const view = await render(<CardGrid {...props} active />);
  await fireEvent.scroll(screen.getByTestId('card-grid'), { nativeEvent: { contentOffset: { x: 0, y: 180 } } });
  await fireEvent.press(screen.getByRole('button', { name: 'Circle' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  expect(open.mock.calls).toEqual([[99, { rect: null, scrollKey: 'catalogue' }]]);
  await view.rerender(<CardGrid {...props} active={false} />);
  await view.rerender(<CardGrid {...props} active />);
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  expect(open.mock.calls[1][0]).toBe(0);
});
test('virtualizes a hundred cards rather than mounting all faces', async () => {
  const hundred = Array.from({ length: 100 }, (_, id) => ({ ...cards[0], id }));
  await render(<CardGrid cards={hundred} locale="en" assetRegistry={assetRegistry} onOpen={jest.fn()} scrollKey="100" />);
  expect(screen.getByTestId('card-tile-0')).toBeVisible();
  expect(screen.queryByTestId('card-tile-99')).toBeNull();
});
