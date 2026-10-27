export const GRID_PADDING = 16;
export const GRID_GUTTER = 12;
export function getGridColumns(widthDp: number, fontScale: number): 1 | 2 {
  return fontScale >= 1.5 || widthDp < 2 * GRID_PADDING + GRID_GUTTER + 2 * 144 ? 1 : 2;
}
