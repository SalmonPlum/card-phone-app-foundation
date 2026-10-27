import { fireEvent, render, screen } from '@testing-library/react-native';
import { sampleDeck } from '../../../decks/sample';
import { assetRegistry } from '../../../decks/assets';
import { CardDetails } from '../CardDetails';

test.each(['cs', 'en'] as const)('shows complete card zero content in %s', async locale => {
  await render(<CardDetails card={sampleDeck.cards[0]} locale={locale} assetRegistry={assetRegistry} />);
  const content = sampleDeck.cards[0].translations[locale];
  expect(screen.getByRole('header', { name: content.name })).toBeVisible();
  expect(screen.getByText(content.meaning)).toBeVisible();
  expect(screen.getByText(content.description).props.numberOfLines).toBeUndefined();
  expect(screen.getByTestId('detail-face-0').props.resizeMode).toBe('contain');
});
test('uses locale-specific artwork and displays an accessible localized image error', async () => {
  const card = { ...sampleDeck.cards[0], translations: {
    ...sampleDeck.cards[0].translations, cs: { ...sampleDeck.cards[0].translations.cs, faceAsset: 'sample.spring' },
  } };
  await render(<CardDetails card={card} locale="cs" assetRegistry={assetRegistry} />);
  expect(screen.getByTestId('detail-face-0').props.source).toEqual(assetRegistry['sample.spring']);
  await fireEvent(screen.getByTestId('detail-face-0'), 'error');
  expect(screen.getByText('Obrázek karty se nepodařilo načíst.')).toBeVisible();
});
