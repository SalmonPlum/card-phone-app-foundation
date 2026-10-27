export type Rect = { x: number; y: number; width: number; height: number };
export function validRect(rect: Rect): boolean {
  return Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0;
}
export function toLocalRect(windowRect: Rect, hostRect: Rect): Rect | null {
  return validRect(windowRect) && validRect(hostRect)
    ? { ...windowRect, x: windowRect.x - hostRect.x, y: windowRect.y - hostRect.y } : null;
}
export function fitForegroundRect(host: { width: number; height: number }, aspectRatio: number, topInset: number, bottomInset: number): Rect {
  const usableHeight = Math.max(1, host.height - topInset - bottomInset);
  const y = topInset + 64;
  const height = Math.max(1, Math.min(usableHeight * .6, usableHeight - 96, (host.width - 32) / aspectRatio));
  const width = height * aspectRatio;
  return { x: (host.width - width) / 2, y, width, height };
}
