import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { CardCollectionScreen } from './CardCollectionScreen';

export default function CatalogueScreen() {
  const locale = useLocale();
  return <CardCollectionScreen cards={configuredDeck.cards} locale={locale} assetRegistry={assetRegistry}
    title={t('catalogue', locale)} scrollKey={`catalogue:${configuredDeck.id}`} hostTestID="catalogue-host" />;
}
