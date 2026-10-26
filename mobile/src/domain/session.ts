import type { CardId, DeckManifest, Phase, Pose, SessionEvent, SessionState } from './contracts.ts';
import { shuffleIds } from './random.ts';
import type { RandomSource } from './random.ts';
import { packetSizeLimit } from './shuffle.ts';

export function createSession(deck: DeckManifest, sessionId: string, source: RandomSource): SessionState {
  return {
    sessionId, deckId: deck.id, deckVersion: deck.version,
    remainingIds: shuffleIds(deck.cards.map(card => card.id), source),
    drawnIds: [], sourceIds: [], receivedIds: [], flyingIds: [], selectedId: null,
    phase: 'regrip', epoch: 0, drawQueued: false, phaseOrigin: null,
  };
}

function enter(state: SessionState, phase: Phase, changes: Partial<SessionState> = {}): SessionState {
  return { ...state, ...changes, phase, epoch: state.epoch + 1 };
}

function finitePose(pose: Pose | undefined): pose is Pose {
  return pose !== undefined && [pose.x, pose.y, pose.angle, pose.scale].every(Number.isFinite) && pose.scale > 0;
}

function lower(state: SessionState, phaseOrigin: Pose | null): SessionState {
  // An intact deck renders from remainingIds. Null means the stationary source pose.
  return enter(state, 'lower', { sourceIds: [], receivedIds: [], flyingIds: [], phaseOrigin });
}

function returnIntact(state: SessionState): SessionState {
  return enter(state, 'return', { sourceIds: [], receivedIds: [], flyingIds: [], phaseOrigin: null });
}

function commitDraw(state: SessionState): SessionState {
  const lowerIds = state.phase === 'lower' ? state.remainingIds : state.receivedIds;
  const selectedId = lowerIds[0];
  if (selectedId === undefined) return state;
  const receivedIds = lowerIds.slice(1);
  return enter(state, 'lift', {
    selectedId, receivedIds, remainingIds: [...state.sourceIds, ...receivedIds],
    drawnIds: [...state.drawnIds, selectedId], drawQueued: false, phaseOrigin: null,
  });
}

function strip(state: SessionState, packetSize: number | undefined): SessionState {
  const max = packetSizeLimit(state.sourceIds.length, state.remainingIds.length, state.receivedIds.length === 0);
  if (packetSize === undefined || !Number.isInteger(packetSize) || packetSize < 1 || packetSize > max) return state;
  const flyingIds = state.sourceIds.slice(0, packetSize);
  const sourceIds = state.sourceIds.slice(packetSize);
  return enter(state, 'strip', { flyingIds, sourceIds, remainingIds: [...flyingIds, ...sourceIds, ...state.receivedIds] });
}

/** Pure boundary reducer: entropy and time belong to the controller, never here. */
export function transition(state: SessionState, event: SessionEvent): SessionState {
  if (event.type === 'DRAW') {
    if (state.drawQueued) return state;
    if (state.phase === 'regrip' || state.phase === 'return') {
      if (!finitePose(event.pose)) return state;
      return lower({ ...state, drawQueued: true }, { ...event.pose });
    }
    if (state.phase === 'ready' || state.phase === 'strip' || state.phase === 'contact' || state.phase === 'lower') {
      return { ...state, drawQueued: true };
    }
    return state;
  }
  if (event.type === 'STOP') {
    if (state.drawQueued || !['regrip', 'ready', 'strip', 'contact', 'return', 'resume', 'lower'].includes(state.phase)) return state;
    return enter(state, 'results', { sourceIds: [], receivedIds: [], flyingIds: [], selectedId: null, drawQueued: false, phaseOrigin: null });
  }
  if (event.type === 'CONFIRM') {
    if (state.phase !== 'reveal') return state;
    return enter(state, state.remainingIds.length ? 'resume' : 'results', { selectedId: null });
  }
  if (event.sessionId !== state.sessionId || event.epoch !== state.epoch) return state;

  switch (state.phase) {
    case 'regrip':
    case 'return':
      return enter(state, 'ready', { sourceIds: [...state.remainingIds], phaseOrigin: null });
    case 'ready':
      return state.remainingIds.length === 1 ? lower(state, null) : strip(state, event.packetSize);
    case 'strip': {
      const receivedIds = [...state.flyingIds, ...state.receivedIds];
      return enter(state, 'contact', { receivedIds, flyingIds: [], remainingIds: [...state.sourceIds, ...receivedIds] });
    }
    case 'contact':
      if (state.drawQueued) return commitDraw(state);
      return state.sourceIds.length ? strip(state, event.packetSize) : returnIntact(state);
    case 'lower':
      return state.drawQueued ? commitDraw(state) : returnIntact(state);
    case 'lift': return enter(state, 'flip');
    case 'flip': return enter(state, 'reveal');
    case 'resume': return returnIntact(state);
    case 'reveal':
    case 'results': return state;
  }
}

/** Debug/test boundary check; validates conservation and the visible top-first order. */
export function assertSessionInvariant(state: SessionState, allIds: readonly CardId[]): void {
  function require(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Session invariant: ${message}`);
  }
  function sameOrder(left: readonly CardId[], right: readonly CardId[]): boolean {
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }
  const configured = new Set(allIds);
  const combined = [...state.remainingIds, ...state.drawnIds];
  require(configured.size === allIds.length, 'configured IDs must be unique');
  require(combined.length === allIds.length && new Set(combined).size === combined.length
    && combined.every(id => configured.has(id)), 'remaining and drawn must partition configured IDs');
  const intact = ['regrip', 'return', 'lower', 'results'].includes(state.phase);
  const layers = [...state.flyingIds, ...state.sourceIds, ...state.receivedIds];
  require(intact ? layers.length === 0 : sameOrder(state.remainingIds, layers), 'layers must match canonical remaining order');
  require(state.phase === 'strip' ? state.flyingIds.length > 0 : state.flyingIds.length === 0, 'only strip may contain a flying packet');
  if (state.phase === 'ready') require(state.receivedIds.length === 0, 'ready must have an intact source');
  const revealing = ['lift', 'flip', 'reveal'].includes(state.phase);
  require(revealing ? state.selectedId !== null && state.selectedId === state.drawnIds.at(-1) : state.selectedId === null,
    'selection must be the most recently committed draw during reveal');
  require(!state.drawQueued || ['ready', 'strip', 'contact', 'lower'].includes(state.phase), 'draw may queue only at shuffle boundaries');
  require(Number.isSafeInteger(state.epoch) && state.epoch >= 0, 'epoch must be a nonnegative integer');
  require(state.phaseOrigin === null || (state.phase === 'lower' && finitePose(state.phaseOrigin)), 'only lower may carry an interruption pose');
}
