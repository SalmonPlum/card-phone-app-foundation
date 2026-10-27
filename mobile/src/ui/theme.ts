import { Platform } from 'react-native';

// Local platform fonts keep the offline app readable in Czech and English.
export const colors = {
  canvas: '#fbf9f3', forest: '#1a382b', deepForest: '#032217',
  brass: '#c5a059', goldInk: '#775a19', sage: '#d8e2dc',
  panel: '#f0eee8', ink: '#1b1c19', mutedInk: '#424844', lightInk: '#f4efe6',
} as const;
export const type = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  title: { fontSize: 32, lineHeight: 40, fontWeight: '400' },
  cardTitle: { fontSize: 30, lineHeight: 38, fontWeight: '400' },
  body: { fontSize: 18, lineHeight: 28 },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
} as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 } as const;
export const radius = { card: 12, panel: 20, mat: 24, pill: 999 } as const;
export const shadow = {
  card: { shadowColor: colors.deepForest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
} as const;
export const theme = { colors, type, spacing, radius, shadow } as const;
