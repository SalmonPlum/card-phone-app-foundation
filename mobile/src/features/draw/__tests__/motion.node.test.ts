import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phaseDurationMs, returnPose, layerStep } from '../motion.ts';

test('return follows a continuous curve from receiver to source', () => {
  assert.deepEqual(returnPose(0), {x:300,y:575,angle:-.105,scale:1});
  assert.deepEqual(returnPose(1), {x:620,y:330,angle:.12,scale:1});
  for (let i = 1; i < 100; i++) {
    const a = returnPose(i / 100), b = returnPose((i + .01) / 100);
    assert.ok(Math.hypot(b.x-a.x,b.y-a.y) > 0);
  }
});
test('stack depth and phase timings match the approved motion', () => {
  assert.ok(layerStep(100) * 99 <= 36);
  assert.deepEqual(['regrip','ready','strip','contact','return','lower','lift','flip','resume'].map(p => phaseDurationMs(p as Parameters<typeof phaseDurationMs>[0])), [780/1.25,180/1.25,620/1.25,120/1.25,1080/1.25,360,900,620,900]);
});

test('layer anchors preserve the physical length of rotated stack offsets', async () => {
  const { above, SOURCE, RECEIVER, ASIDE } = await import('../motion.ts');
  for (const count of [1,8,100]) for (const base of [SOURCE,RECEIVER,ASIDE]) {
    const n=count-1, edge=Math.min(4.2,36/Math.max(1,count-1));
    const x=-n*.8*edge/4.2, y=-n*edge, actual=above(base,n,count);
    assert.ok(Math.abs(actual.x-(base.x+(x*Math.cos(base.angle)-y*Math.sin(base.angle))*base.scale))<1e-9);
    assert.ok(Math.abs(actual.y-(base.y+(x*Math.sin(base.angle)+y*Math.cos(base.angle))*base.scale))<1e-9);
    assert.ok(Math.abs(Math.hypot(actual.x-base.x,actual.y-base.y)-Math.hypot(x,y)*base.scale)<1e-9);
  }
});

test('confirmation exit fades across the full 900ms with the same easing as enlargement', async()=>{
  const {confirmationExit,ease}=await import('../motion.ts');
  assert.equal(phaseDurationMs('resume'),phaseDurationMs('lift'));
  assert.deepEqual(confirmationExit(0),{opacity:1,rise:0,coverOpacity:1});
  for(const progress of [.25,.5,.75]){
    const exit=confirmationExit(progress);
    assert.equal(exit.opacity,1-ease(progress));
    assert.equal(exit.coverOpacity,exit.opacity);
    assert.equal(exit.rise,16*ease(progress));
    assert.ok(exit.opacity>0,'face must remain visible until the full fade completes');
  }
  assert.deepEqual(confirmationExit(.5),{opacity:.5,rise:8,coverOpacity:.5});
  assert.deepEqual(confirmationExit(1),{opacity:0,rise:16,coverOpacity:0});
});
