import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampDockOffset,revealDockItem,dockOverflow} from '../dockScroll.ts';
test('clamps offsets after content shrink, missing measurements and overscroll',()=>{
  assert.equal(clampDockOffset(999,220,500),280);
  assert.equal(clampDockOffset(-5,220,500),0);
  assert.equal(clampDockOffset(100,300,200),0);
  assert.equal(clampDockOffset(NaN,300,500),0);
});
test('minimal reveal keeps visible items steady and reaches first/last items',()=>{
  assert.equal(revealDockItem(0,220,500,{x:390,width:110}),280);
  assert.equal(revealDockItem(280,220,500,{x:0,width:80}),0);
  assert.equal(revealDockItem(80,220,500,{x:100,width:90}),80);
  assert.equal(revealDockItem(0,220,500,{x:100,width:300}),100);
});
test('hints represent actual remaining content within a one-pixel tolerance',()=>{
  assert.deepEqual(dockOverflow(0,220,500),{left:false,right:true});
  assert.deepEqual(dockOverflow(140,220,500),{left:true,right:true});
  assert.deepEqual(dockOverflow(280,220,500),{left:true,right:false});
  assert.deepEqual(dockOverflow(0,500,500),{left:false,right:false});
  assert.deepEqual(dockOverflow(0,0,500),{left:false,right:false});
});
