import { useEffect, useRef } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import type { Card, CardId, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { CardTile, type TileOrigin } from './CardTile';
import { getGridColumns, GRID_GUTTER, GRID_PADDING } from './layout';
export type { TileOrigin } from './CardTile';

export type CardGridProps = {
  cards: readonly Card[]; locale: Locale; assetRegistry: AssetRegistry;
  onOpen: (id: CardId, origin: TileOrigin) => void; scrollKey: string;
  /** Reset the transition lock when the originating route regains focus. */
  active?: boolean;
};
export function CardGrid({ cards, locale, assetRegistry, onOpen, scrollKey, active = true }: CardGridProps) {
  const { width, fontScale } = useWindowDimensions();
  const columns = getGridColumns(width, fontScale);
  const tileWidth = Math.max(1, (width - 2 * GRID_PADDING - (columns - 1) * GRID_GUTTER) / columns);
  const locked = useRef(false), offsets = useRef(new Map<string, number>());
  const list = useRef<FlatList<Card>>(null);
  useEffect(() => { if (active) locked.current = false; }, [active, scrollKey]);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: offsets.current.get(scrollKey) ?? 0, animated: false });
  }, [columns, scrollKey]);
  const open = (id: CardId, origin: TileOrigin) => {
    if (!active || locked.current) return;
    locked.current = true;
    onOpen(id, origin);
  };
  return <FlatList ref={list} key={`${scrollKey}:${columns}`} testID="card-grid" data={cards} numColumns={columns}
    keyExtractor={card => String(card.id)} extraData={{ locale, tileWidth }}
    contentContainerStyle={{ padding: GRID_PADDING, gap: 20 }}
    columnWrapperStyle={columns === 2 ? { gap: GRID_GUTTER } : undefined}
    initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5}
    scrollEventThrottle={32}
    onScroll={event => offsets.current.set(scrollKey, event.nativeEvent.contentOffset.y)}
    renderItem={({ item }) => <CardTile card={item} locale={locale} assetRegistry={assetRegistry}
      width={tileWidth} scrollKey={scrollKey} onOpen={open} />} />;
}
