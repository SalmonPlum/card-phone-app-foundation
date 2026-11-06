import type { Pose } from '../../domain/contracts.ts';

export type DrawScenePlacement = { x: number; y: number; scale: number };

/** Fit the full 2:3 artwork above the measured, wrapping name/hint panel. */
export function fitDrawForeground(host: { width: number; height: number }, captionHeight: number, headerHeight = 0): Pose {
  const width = Number.isFinite(host.width) ? Math.max(1, host.width) : 1;
  const height = Number.isFinite(host.height) ? Math.max(1, host.height) : 1;
  const caption = Number.isFinite(captionHeight) ? Math.max(0, captionHeight) : 0;
  const top=headerHeight>0?headerHeight+8:16;
  const available = Math.max(1, height - top - 16 - caption - 12);
  const cardHeight = Math.min(width * .9 * 1.5, available);
  return { x: width / 2, y: top + (headerHeight>0?cardHeight:available) / 2, angle: 0, scale: cardHeight / 357 };
}

export function toDrawHost(pose: Pose, scene: DrawScenePlacement, scrollY: number): Pose {
  'worklet';
  return { x: scene.x + pose.x * scene.scale, y: scene.y + pose.y * scene.scale - scrollY, angle: pose.angle, scale: pose.scale * scene.scale };
}
