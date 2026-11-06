import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitDrawForeground, toDrawHost } from '../foreground.ts';

for (const host of [{width:280,height:300}, {width:320,height:480}, {width:430,height:800}]) {
  for (const captionHeight of [72, 160]) {
    test(`full foreground fits ${host.width}×${host.height} with ${captionHeight}dp caption`, () => {
      const pose = fitDrawForeground(host, captionHeight);
      const width = 238 * pose.scale, height = 357 * pose.scale;
      assert.equal(pose.angle, 0);
      assert.ok(Math.abs(width / height - 2 / 3) < 1e-9);
      assert.ok(width <= host.width * .9 + 1e-9);
      assert.ok(pose.x - width / 2 >= 0);
      assert.ok(pose.x + width / 2 <= host.width);
      assert.ok(pose.y - height / 2 >= 16 - 1e-9);
      assert.ok(pose.y + height / 2 <= host.height - 16 - captionHeight - 12 + 1e-9);
      assert.ok(Math.abs(width - Math.min(host.width * .9, (host.height - 44 - captionHeight) * 2 / 3)) < 1e-9);
    });
  }
}

test('scene conversion includes letterboxing and scroll without changing artwork proportions', () => {
  assert.deepEqual(toDrawHost({x:300,y:575,angle:-.105,scale:1}, {x:16,y:30,scale:.32}, 40), {x:112,y:174,angle:-.105,scale:.32});
});

test('unmeasured hosts and oversized captions produce finite bounded fallback poses', () => {
  for (const host of [{width:0,height:0}, {width:NaN,height:Infinity}, {width:280,height:100}]) {
    const pose = fitDrawForeground(host, 200);
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.ok(pose.scale > 0);
  }
});
