import { cardColorRoles, typographyRoles, uiColorRoles, type ThemeResource } from './contracts.ts';
import { shuffleTextureKeys } from './shuffleTextureCatalog.ts';

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${path}: expected nonblank text`);
}

function colors(value: unknown, roles: readonly string[], path: string) {
  const palette = record(value, path);
  for (const role of roles) {
    const color = palette[role];
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) {
      throw new Error(`${path}.${role}: expected an opaque #RRGGBB color`);
    }
  }
}

/** Pure authoring boundary: no native modules, font loading or application state. */
export function validateThemeResource(input: unknown): ThemeResource {
  const resource = record(input, 'resource');
  if (resource.schemaVersion !== 1) throw new Error('schemaVersion: expected 1');
  text(resource.defaultThemeId, 'defaultThemeId');
  if (!Array.isArray(resource.themes) || resource.themes.length === 0) {
    throw new Error('themes: expected at least one theme');
  }
  const ids = new Set<string>();
  resource.themes.forEach((value: unknown, index: number) => {
    const path = `themes[${index}]`, theme = record(value, path);
    text(theme.id, `${path}.id`);
    if (!/^[a-z][a-z0-9_-]*$/.test(theme.id) || ids.has(theme.id)) {
      throw new Error(`${path}.id: expected a unique lowercase identifier`);
    }
    ids.add(theme.id);
    text(theme.version, `${path}.version`);
    const name = record(theme.name, `${path}.name`);
    for (const locale of ['cs', 'en']) text(name[locale], `${path}.name.${locale}`);
    if (theme.appearance !== 'light' && theme.appearance !== 'dark') {
      throw new Error(`${path}.appearance: expected light or dark`);
    }
    colors(theme.colors, uiColorRoles, `${path}.colors`);
    colors(theme.cardColors, cardColorRoles, `${path}.cardColors`);
    if (theme.shuffleSurface !== undefined) {
      const surface = record(theme.shuffleSurface, `${path}.shuffleSurface`);
      if (typeof surface.texture !== 'string' || !shuffleTextureKeys.has(surface.texture)) {
        throw new Error(`${path}.shuffleSurface.texture: expected a registered texture key`);
      }
      if (typeof surface.opacity !== 'number' || !Number.isFinite(surface.opacity) || surface.opacity < 0 || surface.opacity > 1) {
        throw new Error(`${path}.shuffleSurface.opacity: expected a finite number between 0 and 1`);
      }
    }
    const typography = record(theme.typography, `${path}.typography`);
    for (const role of typographyRoles) {
      const rolePath = `${path}.typography.${role}`, style = record(typography[role], rolePath);
      text(style.fontFamily, `${rolePath}.fontFamily`);
      if (typeof style.fontWeight !== 'string' || !/^[1-9]00$/.test(style.fontWeight)) {
        throw new Error(`${rolePath}.fontWeight: expected 100 through 900 in steps of 100`);
      }
      for (const metric of ['fontSize', 'lineHeight', 'letterSpacing']) {
        if (typeof style[metric] !== 'number' || !Number.isFinite(style[metric])) {
          throw new Error(`${rolePath}.${metric}: expected a finite number`);
        }
      }
      const fontSize = style.fontSize as number, lineHeight = style.lineHeight as number;
      if (fontSize <= 0) throw new Error(`${rolePath}.fontSize: expected a positive size`);
      if (lineHeight < fontSize) throw new Error(`${rolePath}.lineHeight: must be at least fontSize`);
    }
  });
  if (!ids.has(resource.defaultThemeId)) throw new Error('defaultThemeId: must reference a declared theme');
  return input as ThemeResource;
}
