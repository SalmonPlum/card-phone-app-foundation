import {useDockHeight} from '../../navigation/useDockHeight';
import { useIsFocused } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { BackHandler, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { localizeCard } from '../../domain/deck';
import { fitForegroundRect } from './overlayGeometry';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { CardGrid, type CardGridHandle } from './CardGrid';
import { CardDetailOverlay } from './CardDetailOverlay';
import { useCardOverlay } from './useCardOverlay';
import { useReducedMotion } from './useReducedMotion';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors } from '../../ui/useThemeStyles';

import { useTabInteraction } from '../../navigation/TabInteractionContext';

export type CardCollectionScreenProps = {
  detailTemplate:DetailTemplate;
  cards: readonly Card[];
  locale: Locale;
  assetRegistry: AssetRegistry;
  scrollKey: string;
  hostTestID: string;
  headerContent?: ReactNode;
  emptyContent?: ReactNode;
  scrollHeader?: boolean;
};

/** The same measured grid and persistent detail surface for every collection. */
export function CardCollectionScreen({ detailTemplate,cards, locale, assetRegistry, scrollKey, hostTestID, headerContent, emptyContent, scrollHeader = false }: CardCollectionScreenProps) {
  const styles = useThemeStyles(makeStyles);
  const dockHeight = useDockHeight();
  const { setBlocked } = useTabInteraction();
  const focused = useIsFocused(), reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets(), { width, height, fontScale } = useWindowDimensions();
  const host = useRef<ComponentRef<typeof View>>(null), grid = useRef<CardGridHandle>(null);
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const layoutKey = layout ? `${layout.x}:${layout.y}:${layout.width}:${layout.height}` : '';
  // Reserve visible growth for every localized face in the one-column fallback.
  const maxTileWidth = cards.reduce((limit, card) => {
    const source = assetRegistry[localizeCard(card, locale).faceAsset];
    const size = source ? Image.resolveAssetSource(source) : null;
    const assetWidth = size?.width ?? 0, assetHeight = size?.height ?? 0;
    const ratio = assetWidth > 0 && assetHeight > 0 ? assetWidth / assetHeight : 238 / 358;
    return Math.min(limit, fitForegroundRect(layout ?? { width, height }, ratio, insets.top, dockHeight).width * .8);
  }, Infinity);
  const overlay = useCardOverlay({
    active: focused, layoutKey: `${width}:${height}:${fontScale}:${insets.top}:${dockHeight}:${layoutKey}`,
    measureHost: callback => {
      if (!host.current) { callback(null); return; }
      host.current.measureInWindow((x, y, width, height) => callback({ x, y, width, height }));
    },
    measureCard: (id, callback) => { if (grid.current) grid.current.measureCard(id, callback); else callback(null); },
    focusCard: id => grid.current?.focusCard(id),
  });
  const active = overlay.state.stage !== 'closed', close = overlay.close;
  useLayoutEffect(() => {
    // Both tabs stay mounted. Only the focused collection owns the dock lock;
    // a late inactive results mount must not publish an unlock over Catalogue.
    if (!focused) return;
    setBlocked(active);
    return () => setBlocked(false);
  }, [active, focused, setBlocked]);
  useEffect(() => {
    if (!focused || !active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => subscription.remove();
  }, [active, close, focused]);
  const card = overlay.state.id === null ? null : cards.find(card => card.id === overlay.state.id);
  const heading = headerContent ? <View style={styles.heading}>{headerContent}</View> : undefined;
  return <View ref={host} collapsable={false} testID={hostTestID} style={styles.screen}
    onLayout={event => { const { x, y, width, height } = event.nativeEvent.layout; setLayout({ x, y, width, height }); }}>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen} pointerEvents={active ? 'none' : 'auto'}
      accessibilityElementsHidden={active} importantForAccessibility={active ? 'no-hide-descendants' : 'auto'}>
      {!scrollHeader && heading}
      {scrollHeader || cards.length > 0 ? <CardGrid ref={grid} cards={cards} locale={locale} assetRegistry={assetRegistry}
        scrollKey={scrollKey} active={focused && !active} scrollEnabled={!active}
        bottomClearance={dockHeight} maxTileWidth={maxTileWidth} hiddenCardId={overlay.hiddenCardId} onOpen={overlay.open}
        headerContent={scrollHeader ? heading : undefined} emptyContent={emptyContent} /> : emptyContent}
    </SafeAreaView>
    {card && overlay.state.host && <CardDetailOverlay detailTemplate={detailTemplate} card={card} locale={locale} assetRegistry={assetRegistry}
      state={overlay.state} reducedMotion={reducedMotion} topInset={insets.top} bottomInset={dockHeight}
      onReady={overlay.ready} onComplete={overlay.complete} onClose={() => close()} />}
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  heading: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
