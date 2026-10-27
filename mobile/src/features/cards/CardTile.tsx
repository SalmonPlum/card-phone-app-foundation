import { useRef, useState, type ComponentRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Card, CardId, Locale } from '../../domain/contracts';
import { localizeCard } from '../../domain/deck';
import type { AssetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';

export type TileOrigin = {
  rect: { x: number; y: number; width: number; height: number } | null;
  scrollKey: string;
};

export function CardFace({ card, locale, assetRegistry, testID }: {
  card: Card; locale: Locale; assetRegistry: AssetRegistry; testID: string;
}) {
  const content = localizeCard(card, locale), source = assetRegistry[content.faceAsset];
  const [failedAsset, setFailedAsset] = useState<string | null>(null);
  const size = source ? Image.resolveAssetSource(source) : null;
  const width = size?.width ?? 238, height = size?.height ?? 358;
  const aspectRatio = width > 0 && height > 0 ? width / height : 238 / 358;
  return failedAsset === content.faceAsset || !source
    ? <View style={[styles.missing, { aspectRatio }]}><Text style={styles.caption}>{t('assetError', locale)}</Text></View>
    : <Image testID={testID} source={source} resizeMode="contain" accessible={false}
      style={{ width: '100%', aspectRatio }} onError={() => setFailedAsset(content.faceAsset)} />;
}

export function CardTile({ card, locale, assetRegistry, width, scrollKey, onOpen }: {
  card: Card; locale: Locale; assetRegistry: AssetRegistry; width: number; scrollKey: string;
  onOpen: (id: CardId, origin: TileOrigin) => void;
}) {
  const face = useRef<ComponentRef<typeof View>>(null), rect = useRef<TileOrigin['rect']>(null), content = localizeCard(card, locale);
  const measure = () => {
    // Measure at touch-down, never use stale layout coordinates after scrolling.
    rect.current = null;
    face.current?.measureInWindow((x, y, w, h) => {
      rect.current = w > 0 && h > 0 ? { x, y, width: w, height: h } : null;
    });
  };
  return <Pressable testID={`card-tile-${card.id}`} accessibilityRole="button" accessibilityLabel={content.name}
    onPressIn={measure} onPress={() => onOpen(card.id, { rect: rect.current, scrollKey })}
    style={({ pressed }) => ({ width, minHeight: 48, opacity: pressed ? 0.8 : 1 })}>
    <View ref={face} collapsable={false}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`card-face-${card.id}`} />
    </View>
    <Text style={styles.caption}>{content.name}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  caption: { color: '#252923', fontSize: 18, lineHeight: 26, paddingTop: 8 },
  missing: { width: '100%', justifyContent: 'center', backgroundColor: '#e7e5de', padding: 12 },
});
