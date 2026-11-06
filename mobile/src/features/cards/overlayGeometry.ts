export type Rect = { x: number; y: number; width: number; height: number };
export function validRect(rect: Rect): boolean {
  return Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0;
}
export function toLocalRect(windowRect: Rect, hostRect: Rect): Rect | null {
  return validRect(windowRect) && validRect(hostRect)
    ? { ...windowRect, x: windowRect.x - hostRect.x, y: windowRect.y - hostRect.y } : null;
}
export function fitForegroundRect(host: { width: number; height: number }, aspectRatio: number, topInset: number, bottomInset: number, headerHeight = 64): Rect {
  const y = topInset + headerHeight + 12;
  const available = Math.max(1, host.height - bottomInset - y - 12);
  const height = Math.max(1, Math.min(available * .6, Math.max(1, host.width - 32) / aspectRatio));
  const width = height * aspectRatio;
  return { x: (host.width - width) / 2, y, width, height };
}

/** Scroll consumes the expanded spacer at the same rate as this pinned band shrinks. */
export function readingFaceRect(expanded: Rect, scrollY: number): Rect {
  'worklet';
  const minimum = Math.min(112, expanded.height / 2);
  const height = Math.max(minimum, expanded.height - Math.max(0, scrollY));
  const width = expanded.width * height / expanded.height;
  return {x: expanded.x + (expanded.width - width) / 2, y: expanded.y, width, height};
}

export function compactFaceRect(expanded: Rect): Rect {
  'worklet';
  return readingFaceRect(expanded, expanded.height);
}
