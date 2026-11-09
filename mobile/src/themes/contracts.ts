import { artworkColorRoles } from '../domain/artwork.ts';
import type { Locale } from '../domain/contracts.ts';

export const uiColorRoles = [
  'canvas', 'surface', 'text', 'mutedText', 'primary', 'onPrimary',
  'accent', 'border', 'selectedSurface', 'onSelected', 'mat', 'onMat', 'shadow',
] as const;
export const cardColorRoles = artworkColorRoles;
export const typographyRoles = ['title', 'cardTitle', 'sectionHeading', 'body', 'label', 'caption'] as const;

export type ThemeTextStyle = Readonly<{
  fontFamily: string;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}>;

export type ThemeDefinition = Readonly<{
  id: string;
  version: string;
  name: Readonly<Record<Locale, string>>;
  appearance: 'light' | 'dark';
  shuffleSurface?: Readonly<{texture: string; opacity: number}>;
  colors: Readonly<Record<typeof uiColorRoles[number], string>>;
  /** Optional artwork consumes these roles; fixed artwork remains unchanged. */
  cardColors: Readonly<Record<typeof cardColorRoles[number], string>>;
  typography: Readonly<Record<typeof typographyRoles[number], ThemeTextStyle>>;
}>;

export type ThemeResource = Readonly<{
  schemaVersion: 1;
  defaultThemeId: string;
  themes: readonly ThemeDefinition[];
}>;
