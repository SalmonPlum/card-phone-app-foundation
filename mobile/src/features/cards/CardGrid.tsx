import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import type { Card, CardId, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { CardTile, type CardTileHandle, type TileOrigin } from './CardTile';
import { getGridColumns, GRID_GUTTER, GRID_PADDING } from './layout';
export type { TileOrigin } from './CardTile';

export type CardGridProps = {
  cards: readonly Card[]; locale: Locale; assetRegistry: AssetRegistry;
  onOpen: (id: CardId, origin: TileOrigin) => void; scrollKey: string;
  /** Disables new opens while the catalogue is obscured or unfocused. */
  active?: boolean; hiddenCardId?: CardId | null; scrollEnabled?: boolean; maxTileWidth?: number;
  headerContent?: ReactNode; emptyContent?: ReactNode; bottomClearance?: number;
};
export type CardGridHandle = { measureCard: (id: CardId, callback: (rect: TileOrigin['rect']) => void) => void; focusCard: (id: CardId) => void };
export const CardGrid = forwardRef<CardGridHandle, CardGridProps>(function CardGrid({ cards, locale, assetRegistry, onOpen, scrollKey, active = true, hiddenCardId = null, scrollEnabled = true, maxTileWidth = Infinity, headerContent, emptyContent, bottomClearance = 0 }, ref) {
  const { width, fontScale } = useWindowDimensions();
  const columns = getGridColumns(width, fontScale);
  const availableWidth = (width - 2 * GRID_PADDING - (columns - 1) * GRID_GUTTER) / columns;
  const tileWidth = Math.max(1, Math.min(availableWidth, columns === 1 ? maxTileWidth : Infinity));
  const tiles = useRef(new Map<CardId, CardTileHandle>());
  const offsets = useRef(new Map<string, number>());
  const list = useRef<FlatList<Card>>(null);
  useImperativeHandle(ref, () => ({
    measureCard(id, callback) { const tile = tiles.current.get(id); if (tile) tile.measure(callback); else callback(null); },
    focusCard(id) { tiles.current.get(id)?.focus(); },
  }), []);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: offsets.current.get(scrollKey) ?? 0, animated: false });
  }, [columns, scrollKey]);
  const open = (id: CardId, origin: TileOrigin) => {
    if (!active) return;
    onOpen(id, origin);
  };
  return <FlatList ref={list} key={`${scrollKey}:${columns}`} testID="card-grid" data={cards} numColumns={columns}
    keyExtractor={card => String(card.id)} extraData={{ locale, tileWidth, hiddenCardId, active }} scrollEnabled={scrollEnabled}
    ListHeaderComponent={headerContent ? <>{headerContent}</> : undefined}
    ListEmptyComponent={emptyContent ? <>{emptyContent}</> : undefined}
    contentContainerStyle={{ padding: GRID_PADDING, paddingBottom: GRID_PADDING + bottomClearance, gap: 20 }}
    columnWrapperStyle={columns === 2 ? { gap: GRID_GUTTER } : undefined}
    initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5}
    scrollEventThrottle={32}
    onScroll={event => offsets.current.set(scrollKey, event.nativeEvent.contentOffset.y)}
    renderItem={({ item }) => <CardTile ref={handle => { if (handle) tiles.current.set(item.id, handle); else tiles.current.delete(item.id); }} card={item} locale={locale} assetRegistry={assetRegistry}
      active={active} hidden={hiddenCardId === item.id} width={tileWidth} scrollKey={scrollKey} onOpen={open} />} />;
});
