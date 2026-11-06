import { useThemeSettings } from '../themes/ThemeProvider';
import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../ui/useThemeStyles';
import { useTabInteraction } from './TabInteractionContext';

/** Floating menu; screens consume its measured height for scroll/control clearance. */
export function BottomDock({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const styles = useThemeStyles(makeStyles);
  const { theme: { colors, appearance } } = useThemeSettings();
  const locale = useLocale(), { blocked } = useTabInteraction();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  return <View testID="bottom-dock" pointerEvents={blocked ? 'none' : 'box-none'}
    accessibilityElementsHidden={blocked} importantForAccessibility={blocked ? 'no-hide-descendants' : 'auto'}
    onLayout={event => reportHeight?.(event.nativeEvent.layout.height)}
    style={[styles.space, { paddingBottom: Math.max(insets.bottom, 8), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
    <View testID="bottom-dock-menu" style={[styles.pill, { backgroundColor: appearance === 'light' ? '#ffffff' : colors.surface }]}>
      {state.routes.filter(route => route.name === 'index' || route.name === 'catalogue' || route.name === 'settings').map(route => {
        const selected = state.routes[state.index].key === route.key;
        const label = t(route.name === 'index' ? 'drawTab' : route.name === 'catalogue' ? 'catalogueTab' : 'settings', locale);
        const ink = selected ? colors.accent : colors.primary;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label}
          accessibilityState={{ selected, disabled: blocked }} disabled={blocked} style={styles.item}
          onPress={() => {
            if (blocked) return;
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigateToTab(route.key);
          }}
          onLongPress={() => { if (!blocked) emitter.emit({ type: 'tabLongPress', target: route.key }); }}>
          <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
            {route.name === 'index' ? <><View style={[styles.cardBack, { borderColor: ink }]} /><View style={[styles.card, { borderColor: ink }]} /></>
              : route.name === 'settings' ? <Text allowFontScaling={false} style={[styles.gear,{color:ink}]}>⚙︎</Text> : <View style={styles.grid}>{[0, 1, 2, 3].map(index => <View key={index} style={[styles.cell, { borderColor: ink }]} />)}</View>}
          </View>
          <Text style={[styles.label, { color: ink }]}>{label}</Text>
          <View accessible={false} style={[styles.pip, { backgroundColor: selected ? colors.accent : 'transparent' }]} />
        </Pressable>;
      })}
    </View>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  space: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', paddingTop: 8 },
  pill: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 36, padding: 6,
    shadowColor: colors.shadow, shadowOpacity: .08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  item: { flex: 1, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 28 },
  label: { ...typography.label, textAlign: 'center', flexShrink: 1 },
  icon: { width: 24, height: 22 },
  cardBack: { position: 'absolute', left: 2, top: 0, width: 14, height: 19, borderRadius: 3, borderWidth: 1.5, transform: [{ rotate: '-12deg' }] },
  card: { position: 'absolute', left: 8, top: 2, width: 14, height: 19, borderRadius: 3, borderWidth: 1.5, backgroundColor: colors.canvas },
  gear:{fontSize:22,lineHeight:22,textAlign:'center'},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, width: 23, height: 22 },
  cell: { width: 9, height: 9, borderRadius: 2, borderWidth: 1.5 },
  pip: { width: 4, height: 4, borderRadius: 2 },
});
