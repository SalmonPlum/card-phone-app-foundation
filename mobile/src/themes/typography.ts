import { typographyRoles, type ThemeDefinition, type ThemeResource, type ThemeTextStyle } from './contracts.ts';

export type FontFace = Readonly<{
  family: string; weight: string; alias: string; path: string;
  licensePath: string; sha256: string; sourceUrl: string;
}>;
export type ResolvedTextStyle = Omit<ThemeTextStyle, 'fontWeight'> & { fontWeight: ThemeTextStyle['fontWeight'] | 'normal' };
export type ThemeTypography = Readonly<Record<typeof typographyRoles[number], ResolvedTextStyle>>;

/** App preference only. Native Text applies OS accessibility scaling separately. */
export function scaleThemeTypography(typography: ThemeTypography, scale: number): ThemeTypography {
  if (scale === 1) return typography;
  return Object.fromEntries(typographyRoles.map(role => {
    const style = typography[role];
    return [role, { ...style, fontSize: style.fontSize * scale,
      lineHeight: Math.ceil(style.lineHeight * scale), letterSpacing: style.letterSpacing * scale }];
  })) as ThemeTypography;
}

export function validateFontReferences(resource: ThemeResource, catalog: readonly FontFace[]): void {
  const aliases = new Set<string>(), faces = new Set<string>();
  for (const font of catalog) {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(font.alias) || aliases.has(font.alias)) throw new Error(`Invalid or duplicate font alias: ${font.alias}`);
    const key = `${font.family}:${font.weight}`;
    if (faces.has(key)) throw new Error(`Duplicate font family and weight: ${key}`);
    aliases.add(font.alias); faces.add(key);
  }
  for (const theme of resource.themes) {
    for (const role of typographyRoles) {
      const style = theme.typography[role];
      if (!faces.has(`${style.fontFamily}:${style.fontWeight}`)) {
        throw new Error(`${theme.id}.typography.${role}: missing font ${style.fontFamily} ${style.fontWeight}`);
      }
    }
  }
}

export function resolveThemeTypography(theme: ThemeDefinition, catalog: readonly FontFace[], fontsAvailable: boolean,
  fallback: { serif: string; sans: string }): ThemeTypography {
  return Object.fromEntries(typographyRoles.map(role => {
    const style = theme.typography[role];
    if (!fontsAvailable) return [role, { ...style, fontFamily: ['title', 'cardTitle', 'sectionHeading'].includes(role) ? fallback.serif : fallback.sans }];
    const font = catalog.find(font => font.family === style.fontFamily && font.weight === style.fontWeight);
    if (!font) throw new Error(`${theme.id}.typography.${role}: missing font ${style.fontFamily} ${style.fontWeight}`);
    // The alias is a single static face at the requested weight; do not synthesize another weight.
    return [role, { ...style, fontFamily: font.alias, fontWeight: 'normal' }];
  })) as ThemeTypography;
}
