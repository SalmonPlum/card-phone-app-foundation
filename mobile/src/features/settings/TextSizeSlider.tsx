import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import type { Locale } from '../../domain/contracts';
import { t } from '../../i18n/locale';
import type { TextSize } from '../../settings/textSize';
import { radius, spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

const sizes = ['small', 'standard', 'large'] as const;
const labels = { small: 'smallText', standard: 'standardText', large: 'largeText' } as const;
const inset = 12;

/** Three saved stops; decorative descendants leave the full 48dp track as the touch target. */
export function TextSizeSlider({ value, locale, onChange }: { value: TextSize; locale: Locale; onChange: (size: TextSize) => void }) {
  const styles = useThemeStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<{ value: TextSize; fraction: number | null }>({ value, fraction: null });
  // A restored/external preference cancels a preview, including a later return to the old value.
  if (drag.value !== value) setDrag({ value, fraction: null });
  const current = useRef(value);
  const gesture = useRef<{ x: number; y: number; origin: number; offset: number; horizontal: boolean } | null>(null);
  useLayoutEffect(() => { current.current = value; gesture.current = null; }, [value]);
  const index = sizes.indexOf(value), travel = Math.max(0, width - 2 * inset);
  const fraction = drag.value === value && drag.fraction !== null ? drag.fraction : index / 2;
  const cancel = () => { gesture.current = null; setDrag({ value, fraction: null }); };
  const select = (nextIndex: number) => {
    const next = sizes[Math.max(0, Math.min(2, nextIndex))];
    if (next !== current.current) { current.current = next; onChange(next); }
  };
  const selectAt = (x: number) => {
    if (travel > 0 && Number.isFinite(x)) select(Math.round((x - inset) / travel * 2));
  };
  const move = ({ nativeEvent }: GestureResponderEvent) => {
    const start = gesture.current;
    if (!start || travel <= 0 || !Number.isFinite(nativeEvent.pageX) || !Number.isFinite(nativeEvent.pageY)) return;
    const dx = nativeEvent.pageX - start.x, dy = nativeEvent.pageY - start.y;
    if (!start.horizontal && Math.abs(dx) >= 4 && Math.abs(dx) > Math.abs(dy)) start.horizontal = true;
    if (start.horizontal) {
      const position = (nativeEvent.pageX - start.origin - start.offset - inset) / travel;
      setDrag({ value, fraction: Math.max(0, Math.min(1, position)) });
    }
  };
  return <View style={styles.container}>
    <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      allowFontScaling={false} style={[styles.symbol, styles.small]}>A</Text>
    <View accessible accessibilityRole="adjustable" accessibilityLabel={t('textSize', locale)}
      accessibilityValue={{ min: 0, max: 2, now: index, text: t(labels[value], locale) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={event => {
        const action = event.nativeEvent.actionName;
        if (action === 'increment' || action === 'decrement') {
          cancel();
          select(sizes.indexOf(current.current) + (action === 'increment' ? 1 : -1));
        }
      }}
      style={styles.touchTrack} onLayout={event => {
        const next = event.nativeEvent.layout.width;
        const validWidth = Number.isFinite(next) && next > 2 * inset ? next : 0;
        if (validWidth !== width) { cancel(); setWidth(validWidth); }
      }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={({ nativeEvent }) => {
        const { pageX, pageY, locationX } = nativeEvent;
        if (travel <= 0 || ![pageX, pageY, locationX].every(Number.isFinite)) { cancel(); return; }
        const thumbCenter = inset + travel * index / 2;
        gesture.current = { x: pageX, y: pageY, origin: pageX - locationX,
          offset: Math.abs(locationX - thumbCenter) <= 24 ? locationX - thumbCenter : 0, horizontal: false };
      }}
      onResponderMove={move}
      onResponderRelease={({ nativeEvent }) => {
        const start = gesture.current;
        if (start && Number.isFinite(nativeEvent.pageX) && Number.isFinite(nativeEvent.pageY) &&
          (start.horizontal || (Math.abs(nativeEvent.pageX - start.x) < 8 && Math.abs(nativeEvent.pageY - start.y) < 8))) {
          selectAt(start.horizontal ? nativeEvent.pageX - start.origin - start.offset : nativeEvent.pageX - start.origin);
        }
        cancel();
      }}
      onResponderTerminationRequest={() => !gesture.current?.horizontal}
      onResponderTerminate={cancel}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <View style={styles.rail}/>
        <View testID="text-size-fill" style={[styles.fill, { width: travel * fraction }]}/>
        {sizes.map((size, stop) => <View key={size} style={[styles.tick, { left: inset + travel * stop / 2 - 3 }]}/>)}
        <View testID="text-size-thumb" style={[styles.thumb, { left: inset + travel * fraction - 10 }]}/>
      </View>
    </View>
    <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      allowFontScaling={false} style={[styles.symbol, styles.large]}>A</Text>
  </View>;
}

const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.panel, backgroundColor: colors.surface },
  symbol: { fontFamily: typography.body.fontFamily, fontWeight: typography.body.fontWeight, color: colors.primary, width: 28, lineHeight: 44, textAlign: 'center' },
  small: { fontSize: 16 },
  large: { fontSize: 26 },
  touchTrack: { flex: 1, minWidth: 48, minHeight: 48 },
  rail: { position: 'absolute', left: inset, right: inset, top: 22, height: 4, borderRadius: 2, backgroundColor: colors.border },
  fill: { position: 'absolute', left: inset, top: 22, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  tick: { position: 'absolute', top: 21, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  thumb: { position: 'absolute', top: 14, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface },
});
