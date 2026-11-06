import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import type { Card, CardId, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { CardTile, type CardTileHandle, type TileOrigin } from './CardTile';
import { runOnUISync } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import { useSearchGridMotion, type SearchGridMotionOptions } from './useSearchGridMotion';
import { SearchGridCell, SearchGridMotionContext, SearchGridTransition } from './SearchGridTransition';
import type { SearchMotionState } from './searchGridAnimations';
import { getGridColumns, GRID_GUTTER, GRID_PADDING } from './layout';
export type { TileOrigin } from './CardTile';

export type CardGridProps = {
  cards: readonly Card[]; locale: Locale; assetRegistry: AssetRegistry;
  onOpen: (id: CardId, origin: TileOrigin) => void; scrollKey: string;
  /** Disables new opens while the catalogue is obscured or unfocused. */
  active?: boolean; hiddenCardId?: CardId | null; scrollEnabled?: boolean; maxTileWidth?: number;
  headerContent?: ReactNode; emptyContent?: ReactNode; bottomClearance?: number;
  resetKey?: string; animateSearchChanges?: boolean; motionLayoutKey?: string;
};
export type CardGridHandle = { measureCard: (id: CardId, callback: (rect: TileOrigin['rect']) => void) => void; focusCard: (id: CardId) => void };
export const CardGrid = forwardRef<CardGridHandle, CardGridProps>(function CardGrid({ cards, locale, assetRegistry, onOpen, scrollKey, active = true, hiddenCardId = null, scrollEnabled = true, maxTileWidth = Infinity, headerContent, emptyContent, bottomClearance = 0, resetKey, animateSearchChanges = false, motionLayoutKey = '' }, ref) {
  const { width, height, fontScale } = useWindowDimensions();
  const columns = getGridColumns(width, fontScale);
  const availableWidth = (width - 2 * GRID_PADDING - (columns - 1) * GRID_GUTTER) / columns;
  const tileWidth = Math.max(1, Math.min(availableWidth, columns === 1 ? maxTileWidth : Infinity));
  const tiles = useRef(new Map<CardId, CardTileHandle>());
  const offsets = useRef(new Map<string, number>());
  const list = useRef<FlatList<Card>>(null);
  const measureTiles = useCallback((done: Parameters<SearchGridMotionOptions['measureTiles']>[0]) => {
    const mounted = [...tiles.current.entries()];
    const origins: Record<number, NonNullable<TileOrigin['rect']>> = {};
    let remaining = mounted.length;
    if (!remaining) { done(origins); return; }
    for (const [id, tile] of mounted) tile.measure(rect => {
      if (rect && rect.x + rect.width > 0 && rect.y + rect.height > 0 && rect.x < width && rect.y < height) origins[id] = rect;
      if (--remaining === 0) done(origins);
    });
  }, [width, height]);
  const control = useSharedValue<SearchMotionState>({ deadline: 0, ids: cards.map(card => card.id) });
  const publishMotion = useCallback((deadline: number, ids: number[]) => {
    runOnUISync((next: SearchMotionState) => {
      'worklet';
      control.value = next;
    }, { deadline, ids });
  }, [control]);
  const motion = useSearchGridMotion({ cards, enabled: animateSearchChanges && active,
    layoutKey: `${width}:${height}:${fontScale}:${tileWidth}:${motionLayoutKey}`, measureTiles, publishMotion });
  const isMoving = motion.isMoving;
  // A retained tile must not forward a touch begun under an earlier filter, even after a round trip.
  const interactionToken = useMemo(() => resetKey === undefined ? undefined : Symbol('card-grid-filter'), [resetKey]);
  useImperativeHandle(ref, () => ({
    measureCard(id, callback) { if (isMoving()) { callback(null); return; } const tile = tiles.current.get(id); if (tile) tile.measure(callback); else callback(null); },
    focusCard(id) { tiles.current.get(id)?.focus(); },
  }), [isMoving]);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: offsets.current.get(scrollKey) ?? 0, animated: false });
  }, [columns, scrollKey]);
  useEffect(() => {
    if (resetKey === undefined) return;
    offsets.current.set(scrollKey, 0);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [resetKey, scrollKey]);
  const open = (id: CardId, origin: TileOrigin) => {
    if (!active || (interactionToken !== undefined && origin.interactionToken !== interactionToken)) return;
    if (!cards.some(card => card.id === id)) return;
    onOpen(id, isMoving() ? { ...origin, rect: null } : origin);
  };
  return <SearchGridMotionContext.Provider value={control}><FlatList ref={list} key={`${scrollKey}:${columns}`} testID="card-grid" data={motion.cards} numColumns={columns}
    CellRendererComponent={resetKey !== undefined ? SearchGridCell : undefined}
    removeClippedSubviews={resetKey === undefined ? undefined : false}
    keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    keyExtractor={card => String(card.id)} extraData={{ locale, tileWidth, hiddenCardId, active, interactionToken, origins: motion.origins }} scrollEnabled={scrollEnabled}
    ListHeaderComponent={headerContent ? <>{headerContent}</> : undefined}
    ListEmptyComponent={emptyContent ? <>{emptyContent}</> : undefined}
    contentContainerStyle={{ padding: GRID_PADDING, paddingBottom: GRID_PADDING + bottomClearance, gap: 20 }}
    columnWrapperStyle={columns === 2 ? { gap: GRID_GUTTER } : undefined}
    initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5}
    scrollEventThrottle={32}
    onScroll={event => offsets.current.set(scrollKey, event.nativeEvent.contentOffset.y)}
    renderItem={({ item }) => {
      const included = cards.some(card => card.id === item.id);
      const tile = <CardTile ref={handle => { if (handle) tiles.current.set(item.id, handle); else tiles.current.delete(item.id); }} card={item} locale={locale} assetRegistry={assetRegistry}
        active={active && included} hidden={hiddenCardId === item.id} width={tileWidth} scrollKey={scrollKey} interactionToken={interactionToken} onOpen={open} />;
      return resetKey === undefined ? tile : <SearchGridTransition id={item.id} origin={motion.origins[item.id]} included={included}>{tile}</SearchGridTransition>;
    }} /></SearchGridMotionContext.Provider>;
});
