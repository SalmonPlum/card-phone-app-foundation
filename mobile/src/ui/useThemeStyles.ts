import { useMemo } from 'react';
import { useThemeSettings } from '../themes/ThemeProvider';
import type { ThemeDefinition } from '../themes/contracts';
import { useThemeTypography } from '../themes/ThemeFontGate';
import type { ThemeTypography } from '../themes/typography';

export type { ThemeTypography } from '../themes/typography';

export type ThemeColors = ThemeDefinition['colors'];

export function useThemeStyles<T>(factory: (colors: ThemeColors, typography: ThemeTypography) => T): T {
  const { theme } = useThemeSettings();
  const typography = useThemeTypography();
  return useMemo(() => factory(theme.colors, typography), [factory, theme.colors, typography]);
}
