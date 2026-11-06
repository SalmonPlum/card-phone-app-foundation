import type { Phase, Pose, SessionState } from '../../domain/contracts';

export type StackRole = 'intact' | 'source' | 'receiver' | 'flying' | 'selected';
/** Only visual boundary data crosses to UI; no card identities or artwork. */
export type RenderFrame = {
  phase: Phase;
  phaseOrigin: Pose | null;
  total: number;
  remaining: number;
  source: number;
  received: number;
  flying: number;
  /** Includes the last committed face retained visually during confirmation exit. */
  selected: boolean;
};
export function renderFrame(state: SessionState): RenderFrame {
  return { phase: state.phase, phaseOrigin: state.phaseOrigin, total: state.remainingIds.length + state.drawnIds.length, remaining: state.remainingIds.length, source: state.sourceIds.length, received: state.receivedIds.length, flying: state.flyingIds.length, selected: state.selectedId !== null || (state.phase === 'resume' && state.drawnIds.length > 0) };
}
export function stackCount(frame: RenderFrame, role: StackRole): number {
  'worklet';
  const intact = frame.phase === 'regrip' || frame.phase === 'return' || frame.phase === 'lower';
  if (role === 'intact') return intact ? frame.remaining : 0;
  if (role === 'selected') return frame.selected && (frame.phase === 'lift' || frame.phase === 'awaitingReveal' || frame.phase === 'flip' || frame.phase === 'reveal' || frame.phase === 'resume') ? 1 : 0;
  if (intact) return 0;
  return role === 'source' ? frame.source : role === 'receiver' ? frame.received : frame.flying;
}
