import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { Locale } from '../../domain/contracts';
import { t } from '../../i18n/locale';
import { radius, spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export function CatalogueSearchBar({ query, onChange, locale }: { query: string; onChange: (value: string) => void; locale: Locale }) {
  const styles = useThemeStyles(makeStyles);
  return <View style={styles.field}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      <View style={styles.lens}/><View style={styles.handle}/>
    </View>
    <TextInput accessibilityLabel={t('searchCardsByName', locale)} placeholder={t('searchCardsByName', locale)}
      placeholderTextColor={styles.placeholder.color} value={query} onChangeText={onChange} style={styles.input}
      autoCorrect={false} autoCapitalize="none" returnKeyType="search" onSubmitEditing={Keyboard.dismiss}/>
    {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel={t('clearSearch', locale)}
      onPress={() => onChange('')} style={styles.clear}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.cross}>
        <View style={[styles.stroke, styles.forward]}/><View style={[styles.stroke, styles.backward]}/>
      </View>
    </Pressable>}
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.panel, paddingLeft: spacing.md },
  input: { ...typography.body, flex: 1, minWidth: 0, minHeight: 48, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  placeholder: { color: colors.mutedText },
  clear: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 20, height: 20 },
  lens: { width: 14, height: 14, borderWidth: 1.5, borderColor: colors.mutedText, borderRadius: 7 },
  handle: { position: 'absolute', width: 9, height: 1.5, top: 14, left: 11, backgroundColor: colors.mutedText, transform: [{ rotate: '45deg' }] },
  cross: { width: 18, height: 18 },
  stroke: { position: 'absolute', top: 8, width: 18, height: 2, backgroundColor: colors.primary },
  forward: { transform: [{ rotate: '45deg' }] },
  backward: { transform: [{ rotate: '-45deg' }] },
});
