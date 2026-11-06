import { sampleDeck } from '../../../decks/sample';
import { cardsForIds, cardForRoute } from '../selectors';

test('preserves requested draw order, including zero, without changing catalogue order', () => {
  expect(cardsForIds(sampleDeck, [99, 0, 7]).map(c => c.id)).toEqual([99, 0, 7]);
  expect(sampleDeck.cards.map(c => c.id)).toEqual([0, 7, 12, 23, 35, 48, 64, 99, 104, 118, 127, 139, 152, 166, 173, 185, 198, 207, 219, 234]);
});
test('rejects unknown selections rather than substituting the first card', () => {
  expect(() => cardsForIds(sampleDeck, [100])).toThrow('100');
});
test.each(['0', '7', '99', '104', '234'])('resolves canonical route ID %s', value => {
  expect(cardForRoute(sampleDeck, value)?.id).toBe(Number(value));
});
test.each([undefined, ['0'], '', '00', ' 0', '+0', '-0', '-1', '7.0', '7x', '1e0', 'Infinity', '9007199254740992', '100'])('rejects malformed or unknown route ID %s', value => {
  expect(cardForRoute(sampleDeck, value)).toBeNull();
});
