import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawReadingPose} from '../revealReading.ts';
import {fitDrawForeground} from '../foreground.ts';

test('reading preserves the large initial face and complete native proportions',()=>{
  const target=fitDrawForeground({width:360,height:900},68,64);
  assert.equal(target.scale*238,324);
  assert.equal(drawReadingPose(target,0,false),target);
  assert.equal(drawReadingPose(target,0,true),target);
  const smaller=drawReadingPose(target,100,false);
  assert.ok(Math.abs(smaller.scale*357-(target.scale*357-100))<1e-9);
  assert.ok(Math.abs(smaller.y-178.5*smaller.scale-(target.y-178.5*target.scale))<1e-9);
  assert.equal(smaller.x,target.x);
});
test('negative scroll never enlarges and long reading remains a bounded thumbnail',()=>{
  const target=fitDrawForeground({width:360,height:900},68,64);
  assert.equal(drawReadingPose(target,-10,false),target);
  assert.equal(drawReadingPose(target,10000,false).scale*357,112);
  assert.equal(drawReadingPose(target,1,true).scale*357,112);
});

test('reading retains the authored canvas ratio and top edge for a shorter card',()=>{
  const target=fitDrawForeground({width:360,height:900},68,64,.8);
  const smaller=drawReadingPose(target,100,false,297.5);
  assert.ok(Math.abs(smaller.scale*297.5-(target.scale*297.5-100))<1e-9);
  assert.ok(Math.abs(smaller.y-148.75*smaller.scale-(target.y-148.75*target.scale))<1e-9);
});
