import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeckManifest, SessionEvent, SessionState } from '../contracts.ts';
import { createSession, transition, assertSessionInvariant } from '../session.ts';
import { choosePacketSize } from '../shuffle.ts';
import { deckFixture, scripted } from './fixtures.ts';

const pose = { x: 421, y: 358, angle: 0.12, scale: 1 };
const zeroSource = { nextUint32: () => 0 };
function fixture(count: number): DeckManifest {
  const deck = deckFixture(count);
  // Sparse IDs include zero: positional indexing must never select a card.
  deck.cards.forEach((card, index) => { card.id = index * 17; });
  return deck;
}
function start(count = 8, sessionId = 'session'): SessionState {
  return createSession(fixture(count), sessionId, zeroSource);
}
function send(state: SessionState, event: SessionEvent): SessionState {
  const snapshot = JSON.stringify(state);
  const next = transition(state, event);
  assert.equal(JSON.stringify(state), snapshot, 'transition must not mutate its input');
  assertSessionInvariant(next, fixture(state.remainingIds.length + state.drawnIds.length).cards.map(card => card.id));
  if (next.phase !== state.phase) assert.equal(next.epoch, state.epoch + 1);
  return next;
}
function complete(state: SessionState, packetSize?: number): SessionState {
  return send(state, { type: 'PHASE_COMPLETE', sessionId: state.sessionId, epoch: state.epoch, packetSize });
}
function toStrip(count = 8, packetSize = 1): SessionState {
  return complete(complete(start(count)), packetSize);
}
function reveal(state: SessionState): SessionState {
  assert.equal(state.phase, 'lift');
  assert.equal(send(state, { type: 'CONFIRM' }), state);
  state = complete(state);
  assert.equal(state.phase, 'flip');
  assert.equal(send(state, { type: 'CONFIRM' }), state);
  state = complete(state);
  assert.equal(state.phase, 'reveal');
  assert.equal(complete(state), state, 'reveal holds until confirmation');
  return state;
}

test('new sessions securely order all sparse IDs and restore the complete deck', () => {
  const deck = fixture(3);
  const entropy = scripted([0, 0]);
  const state = createSession(deck, 'new', entropy);
  assert.deepEqual(state.remainingIds, [17, 34, 0]);
  assert.equal(entropy.consumed(), 2);
  assert.equal(state.phase, 'regrip');
  assert.equal(state.epoch, 0);
  assert.equal(state.deckId, deck.id);
  assert.equal(state.deckVersion, deck.version);
  assert.deepEqual([state.sourceIds, state.receivedIds, state.flyingIds, state.drawnIds], [[], [], [], []]);
  assertSessionInvariant(state, [0, 17, 34]);
});

test('100-card DRAW finishes only its current packet and selects the lower top once', () => {
  let state = toStrip(100, 3);
  assert.equal(state.phase, 'strip');
  const packet = [...state.flyingIds];
  const upstairs = [...state.sourceIds];
  state = send(state, { type: 'DRAW' });
  assert.equal(state.drawQueued, true);
  assert.equal(send(state, { type: 'DRAW' }), state);
  state = complete(state);
  assert.equal(state.phase, 'contact');
  assert.deepEqual(state.receivedIds, packet);
  assert.deepEqual(state.flyingIds, []);
  state = complete(state);
  assert.equal(state.phase, 'lift');
  assert.equal(state.selectedId, packet[0]);
  assert.deepEqual(state.drawnIds, [packet[0]]);
  assert.deepEqual(state.sourceIds, upstairs);
  assert.ok(state.sourceIds.length > 90);
  assert.deepEqual(state.receivedIds, packet.slice(1));
  assert.equal(state.drawQueued, false);
  state = reveal(state);
  const remaining = [...state.remainingIds];
  state = send(state, { type: 'CONFIRM' });
  assert.equal(state.phase, 'resume');
  assert.equal(state.selectedId, null);
  assert.equal(send(state, { type: 'CONFIRM' }), state);
  state = complete(state);
  assert.equal(state.phase, 'return');
  assert.deepEqual(state.remainingIds, remaining);
  state = complete(state);
  assert.equal(state.phase, 'ready');
  assert.deepEqual(state.sourceIds, remaining);
});

test('later packets land above earlier ones and selection follows the visible lower top', () => {
  let state = toStrip(8, 2);
  const first = [...state.flyingIds];
  state = complete(state);
  state = complete(state, 2);
  const second = [...state.flyingIds];
  assert.deepEqual(state.remainingIds, [...second, ...state.sourceIds, ...first]);
  state = complete(state);
  assert.deepEqual(state.receivedIds, [...second, ...first]);
  state = send(state, { type: 'DRAW' });
  state = complete(state);
  assert.equal(state.selectedId, second[0]);
  assert.deepEqual(state.remainingIds, [...state.sourceIds, second[1], ...first]);
});

test('complete passes return directly to source without a centre regrip', () => {
  let state = toStrip(8);
  let boundaries = 0;
  while (state.phase !== 'return') {
    assert.ok(++boundaries <= 16, 'a pass must finish after its packet boundaries');
    state = complete(state, 1);
  }
  assert.deepEqual(state.remainingIds, [0, 119, 102, 85, 68, 51, 34, 17]);
  assert.deepEqual([state.sourceIds, state.receivedIds, state.flyingIds], [[], [], []]);
  state = complete(state);
  assert.equal(state.phase, 'ready');
  assert.deepEqual(state.sourceIds, [0, 119, 102, 85, 68, 51, 34, 17]);
});

test('missing or invalid externally chosen packets leave a retryable boundary unchanged', () => {
  const ready = complete(start(8));
  const contact = complete(toStrip(8));
  for (const state of [ready, contact]) {
    for (const packetSize of [undefined, 0, -1, 4, 1.5, NaN, Infinity]) {
      assert.equal(complete(state, packetSize), state);
    }
    assert.equal(complete(state, 2).phase, 'strip');
  }
  let small = complete(start(2));
  assert.equal(complete(small, 2), small);
  small = complete(complete(small, 1));
  assert.equal(complete(small, 2), small);
});

test('moving intact stacks require current pose and keep that origin through lowering', () => {
  for (let state of [start(8), complete(send(reveal(complete(complete(send(toStrip(8), { type: 'DRAW' })))), { type: 'CONFIRM' }))]) {
    assert.ok(state.phase === 'regrip' || state.phase === 'return');
    assert.equal(send(state, { type: 'DRAW' }), state);
    assert.equal(send(state, { type: 'DRAW', pose: { ...pose, x: NaN } }), state);
    const before = [...state.remainingIds];
    state = send(state, { type: 'DRAW', pose });
    assert.equal(state.phase, 'lower');
    assert.deepEqual(state.phaseOrigin, pose);
    assert.equal(send(state, { type: 'DRAW', pose }), state);
    state = complete(state);
    assert.equal(state.phase, 'lift');
    assert.equal(state.selectedId, before[0]);
    assert.deepEqual(state.remainingIds, before.slice(1));
    assert.equal(state.phaseOrigin, null);
  }
});

test('completion tokens reject wrong sessions, old epochs, duplicate boundaries and resets', () => {
  const initial = start();
  const callback: SessionEvent = { type: 'PHASE_COMPLETE', sessionId: initial.sessionId, epoch: initial.epoch };
  assert.equal(send(initial, { ...callback, sessionId: 'other' }), initial);
  assert.equal(send(initial, { ...callback, epoch: -1 }), initial);
  const ready = send(initial, callback);
  assert.equal(send(ready, callback), ready);
  const reset = start(8, 'reset');
  assert.equal(send(reset, callback), reset);
  assert.deepEqual(reset.drawnIds, []);
  assert.equal(reset.remainingIds.length, 8);
  let state = send(toStrip(), { type: 'DRAW' });
  state = complete(state);
  const landing: SessionEvent = { type: 'PHASE_COMPLETE', sessionId: state.sessionId, epoch: state.epoch };
  state = send(state, landing);
  assert.equal(send(state, landing), state);
  assert.equal(state.drawnIds.length, 1);
});

test('stale lower completions cannot commit a second zero-ID card or touch a reset', () => {
  const lower = send(start(1), { type: 'DRAW', pose });
  const callback: SessionEvent = { type: 'PHASE_COMPLETE', sessionId: lower.sessionId, epoch: lower.epoch };
  const lift = send(lower, callback);
  assert.deepEqual(lift.drawnIds, [0]);
  assert.equal(send(lift, callback), lift);
  const reset = start(1, 'replacement');
  assert.equal(send(reset, callback), reset);
  assert.deepEqual(reset.remainingIds, [0]);
  assert.deepEqual(reset.drawnIds, []);
});

test('Stop freezes committed results in shuffle phases and ignores draw/reveal phases', () => {
  const strip = toStrip();
  const lift = complete(complete(send(strip, { type: 'DRAW' })));
  const revealState = reveal(lift);
  const resume = send(revealState, { type: 'CONFIRM' });
  for (const state of [start(), complete(start()), strip, complete(strip), resume, complete(resume)]) {
    const stopped = send(state, { type: 'STOP' });
    assert.equal(stopped.phase, 'results');
    assert.deepEqual(stopped.drawnIds, state.drawnIds);
    assert.deepEqual(stopped.remainingIds, state.remainingIds);
    assert.equal(stopped.drawQueued, false);
    assert.equal(send(stopped, { type: 'DRAW', pose }), stopped);
    assert.equal(complete(stopped, 1), stopped);
  }
  for (const state of [send(start(), { type: 'DRAW', pose }), lift, complete(lift), revealState]) {
    assert.equal(send(state, { type: 'STOP' }), state);
  }
  const queued = send(strip, { type: 'DRAW' });
  assert.equal(send(queued, { type: 'STOP' }), queued);
});

test('one card lowers intact, commits ID zero and completes confirmation exit before results once', () => {
  let state = complete(start(1));
  state = complete(state);
  assert.equal(state.phase, 'lower');
  assert.equal(state.phaseOrigin, null, 'null lower origin denotes stationary source');
  assert.deepEqual(state.flyingIds, []);
  assert.deepEqual(state.drawnIds, []);
  state = complete(state);
  assert.equal(state.phase, 'return');
  state = complete(state);
  state = send(state, { type: 'DRAW' });
  state = complete(state);
  assert.equal(state.phase, 'lower');
  state = complete(state);
  assert.equal(state.selectedId, 0);
  state = reveal(state);
  state = send(state, { type: 'CONFIRM' });
  assert.equal(state.phase, 'resume');
  assert.equal(state.selectedId, null);
  assert.equal(send(state, { type: 'CONFIRM' }), state);
  assert.equal(send(state, {type:'PHASE_COMPLETE',sessionId:state.sessionId,epoch:state.epoch-1}),state);
  state = complete(state);
  assert.equal(state.phase, 'results');
  assert.deepEqual(state.drawnIds, [0]);
  assert.deepEqual(state.remainingIds, []);
  assert.equal(send(state, { type: 'CONFIRM' }), state);
});

test('one-card lowering can queue DRAW once without restarting the active motion', () => {
  let state = complete(complete(start(1)));
  const epoch = state.epoch;
  state = send(state, { type: 'DRAW' });
  assert.equal(state.epoch, epoch);
  assert.equal(state.drawQueued, true);
  assert.equal(send(state, { type: 'DRAW' }), state);
  state = complete(state);
  assert.equal(state.phase, 'lift');
  assert.deepEqual(state.drawnIds, [0]);
});

for (const count of [1, 2, 8, 100]) {
  test(`${count} cards complete an uninterrupted pass without committing a draw`, () => {
    let state = complete(start(count));
    let boundaries = 0;
    while (state.phase !== 'return') {
      assert.ok(++boundaries <= count * 2 + 1);
      const packetSize = state.sourceIds.length ? choosePacketSize(state.sourceIds.length, state.remainingIds.length, state.receivedIds.length === 0, zeroSource) : undefined;
      state = complete(state, packetSize);
    }
    assert.deepEqual(state.drawnIds, []);
    assert.equal(state.remainingIds.length, count);
    assert.equal(complete(state).phase, 'ready');
  });

  test(`${count} sparse IDs remain conserved across passes, interruptions, resumes and exhaustion`, () => {
    let state = start(count);
    let draws = 0;
    let steps = 0;
    while (state.phase !== 'results') {
      assert.ok(++steps < count * 100 + 100);
      if (state.phase === 'reveal') {
        state = send(state, { type: 'CONFIRM' });
        draws++;
      } else if (state.phase === 'regrip' || (state.phase === 'return' && draws % 2 === 0)) {
        state = send(state, { type: 'DRAW', pose });
      } else if (state.phase === 'strip' && (!state.drawQueued && (draws % 2 === 0 || state.receivedIds.length >= state.remainingIds.length / 2))) {
        state = send(state, { type: 'DRAW' });
      } else if (state.phase === 'lower' && !state.drawQueued) {
        state = send(state, { type: 'DRAW' });
      } else {
        const size = state.sourceIds.length ? choosePacketSize(state.sourceIds.length, state.remainingIds.length, state.receivedIds.length === 0, zeroSource) : undefined;
        state = complete(state, size);
      }
    }
    assert.equal(draws, count);
    assert.equal(new Set(state.drawnIds).size, count);
    assert.deepEqual([...state.drawnIds].sort((a, b) => a - b), fixture(count).cards.map(card => card.id));
  });
}

test('invariant checker rejects missing/duplicate IDs, bad layers, and an uncommitted selection', () => {
  const initial = start(2);
  assertSessionInvariant(initial, [0, 17]);
  for (const corrupted of [
    { ...initial, remainingIds: [0] },
    { ...initial, remainingIds: [0, 0] },
    { ...initial, drawnIds: [0] },
    { ...initial, selectedId: 0 },
    { ...initial, sourceIds: [0, 17] },
    { ...complete(initial), sourceIds: [0, 17] },
    { ...toStrip(2), flyingIds: [999] },
  ]) assert.throws(() => assertSessionInvariant(corrupted, [0, 17]));
  assert.throws(() => assertSessionInvariant(initial, [0, 0]));
});

test('manual draw snapshots mode and waits indefinitely for a guarded reveal',()=>{
  let state=send(start(1),{type:'DRAW',pose,revealMode:'manual'});
  state=complete(state);assert.equal(state.phase,'lift');
  state=complete(state);assert.equal(state.phase,'awaitingReveal');
  for(let i=0;i<20;i++)assert.equal(complete(state),state);
  for(const event of [{type:'CONFIRM'},{type:'STOP'},{type:'DRAW',revealMode:'automatic'},
    {type:'REVEAL',sessionId:'stale',epoch:state.epoch},{type:'REVEAL',sessionId:state.sessionId,epoch:state.epoch-1}] as SessionEvent[]) assert.equal(send(state,event),state);
  const waiting=state;
  state=send(state,{type:'REVEAL',sessionId:state.sessionId,epoch:state.epoch});assert.equal(state.phase,'flip');
  assert.equal(send(state,{type:'REVEAL',sessionId:waiting.sessionId,epoch:waiting.epoch}),state);
  assert.equal(send(state,{type:'CONFIRM'}),state);
  state=complete(state);assert.equal(state.phase,'reveal');
  state=send(state,{type:'CONFIRM'});assert.equal(state.phase,'resume');
  assert.equal(complete(state).phase,'results');
});
test('a queued draw retains its chosen mode and automatic draws skip the manual wait',()=>{
  let state=toStrip();
  state=send(state,{type:'DRAW',revealMode:'manual'});
  assert.equal(send(state,{type:'DRAW',revealMode:'automatic'}),state);
  state=complete(complete(state));assert.equal(state.phase,'lift');
  assert.equal(complete(state).phase,'awaitingReveal');
  state=send(start(1),{type:'DRAW',pose,revealMode:'automatic'});
  assert.equal(complete(complete(state)).phase,'flip');
});
