/** Best-effort native feedback: missing/unsupported modules never block a draw. */
export function pulseDrawHaptic(kind: 'shuffle' | 'reveal'): void {
  try {
    // Load on demand so an older development client remains usable until rebuilt.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {impactAsync, ImpactFeedbackStyle} = require('expo-haptics') as typeof import('expo-haptics');
    void impactAsync(kind === 'shuffle' ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Heavy).catch(() => {});
  } catch {
    // Hardware and OS feedback availability are optional.
  }
}
