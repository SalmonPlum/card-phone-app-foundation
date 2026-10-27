import { Link, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { configuredDeck } from '../decks';
import { assetRegistry } from '../decks/assets';
import { CardGrid, type CardGridHandle } from '../features/cards/CardGrid';
import { CardDetailOverlay } from '../features/cards/CardDetailOverlay';
import { useCardOverlay } from '../features/cards/useCardOverlay';
import { useReducedMotion } from '../features/cards/useReducedMotion';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';

export default function Catalogue() {
  const locale = useLocale(), focused = useIsFocused(), reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets(), { width, height, fontScale } = useWindowDimensions();
  const host = useRef<ComponentRef<typeof View>>(null), grid = useRef<CardGridHandle>(null);
  const [layout, setLayout] = useState('');
  const overlay = useCardOverlay({
    active: focused, layoutKey: `${width}:${height}:${fontScale}:${insets.top}:${insets.bottom}:${layout}`,
    measureHost: callback => {
      if (!host.current) { callback(null); return; }
      host.current.measureInWindow((x, y, width, height) => callback({ x, y, width, height }));
    },
    measureCard: (id, callback) => { if (grid.current) grid.current.measureCard(id, callback); else callback(null); },
    focusCard: id => grid.current?.focusCard(id),
  });
  const active = overlay.state.stage !== 'closed', close = overlay.close;
  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => subscription.remove();
  }, [active, close]);
  const card = overlay.state.id === null ? null : configuredDeck.cards.find(card => card.id === overlay.state.id);
  return <View ref={host} collapsable={false} testID="catalogue-host" style={styles.screen}
    onLayout={event => { const { x, y, width, height } = event.nativeEvent.layout; setLayout(`${x}:${y}:${width}:${height}`); }}>
    <SafeAreaView style={styles.screen} pointerEvents={active ? 'none' : 'auto'}
      accessibilityElementsHidden={active} importantForAccessibility={active ? 'no-hide-descendants' : 'auto'}>
      <View style={styles.heading}>
        <Link href="/" style={styles.link}>{t('home', locale)}</Link>
        <Text accessibilityRole="header" style={styles.title}>{t('catalogue', locale)}</Text>
      </View>
      <CardGrid ref={grid} cards={configuredDeck.cards} locale={locale} assetRegistry={assetRegistry}
        scrollKey={`catalogue:${configuredDeck.id}`} active={focused && !active} scrollEnabled={!active}
        hiddenCardId={overlay.hiddenCardId} onOpen={overlay.open} />
    </SafeAreaView>
    {card && overlay.state.host && <CardDetailOverlay card={card} locale={locale} assetRegistry={assetRegistry}
      state={overlay.state} reducedMotion={reducedMotion} topInset={insets.top} bottomInset={insets.bottom}
      onReady={overlay.ready} onComplete={overlay.complete} onClose={() => close()} />}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f6f0' }, heading: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  title: { color: '#252923', fontSize: 28, fontWeight: '600' },
  link: { color: '#315b47', fontSize: 18, paddingVertical: 12 },
});
