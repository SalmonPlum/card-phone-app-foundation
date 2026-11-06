import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { useLocale } from '../../i18n/useLocale';
import { CardCollectionScreen } from './CardCollectionScreen';

export default function CatalogueScreen() {
  const locale = useLocale();
  return <CardCollectionScreen detailTemplate={configuredDeck.detailTemplate} cards={configuredDeck.cards} locale={locale} assetRegistry={assetRegistry}
    scrollKey={`catalogue:${configuredDeck.id}`} hostTestID="catalogue-host" />;
}
