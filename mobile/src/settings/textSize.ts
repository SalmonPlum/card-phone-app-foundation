export const textSizeScale = { small: 0.9, standard: 1, large: 1.15 } as const;
export type TextSize = keyof typeof textSizeScale;

export function isTextSize(value: unknown): value is TextSize {
  return value === 'small' || value === 'standard' || value === 'large';
}
