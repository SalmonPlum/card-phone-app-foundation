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
  assert.deepEqual(['regrip','ready','strip','contact','return','lower','lift','flip','resume'].map(p => phaseDurationMs(p as Parameters<typeof phaseDurationMs>[0])), [780/1.25,180/1.25,620/1.25,120/1.25,1080/1.25,360,640,620,740]);
});

test('layer anchors apply rotated offsets before vertical compression', async () => {
  const { above, SOURCE, RECEIVER } = await import('../motion.ts');
  for (const count of [1,8,100]) for (const base of [SOURCE,RECEIVER]) {
    const n=count-1, edge=Math.min(4.2,36/Math.max(1,count-1));
    const x=-n*.8*edge/4.2, y=-n*edge, actual=above(base,n,count);
    assert.ok(Math.abs(actual.x-(base.x+(x*Math.cos(base.angle)-y*Math.sin(base.angle))*base.scale))<1e-9);
    assert.ok(Math.abs(actual.y-(base.y+(x*Math.sin(base.angle)+y*Math.cos(base.angle))*.88*base.scale))<1e-9);
  }
});
