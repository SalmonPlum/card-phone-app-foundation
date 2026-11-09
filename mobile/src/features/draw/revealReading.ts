import type {Pose,SessionState} from '../../domain/contracts.ts';
import {compactFaceRect,readingFaceRect} from '../cards/overlayGeometry.ts';

export type DrawReadingState={key:string;offset:number};
export function drawReadingKey(state:SessionState):string {
  return `${state.sessionId}:${state.selectedId ?? state.drawnIds.at(-1) ?? 'none'}`;
}
/** Keep the large initial pose; collapse the same artwork surface without changing its top. */
export function drawReadingPose(target:Pose,offset:number,reducedMotion:boolean,artworkHeight=357):Pose {
  'worklet';
  if(offset<=0) return target;
  const expanded={x:target.x-119*target.scale,y:target.y-artworkHeight/2*target.scale,width:238*target.scale,height:artworkHeight*target.scale};
  const rect=reducedMotion?compactFaceRect(expanded):readingFaceRect(expanded,offset);
  return {x:target.x,y:expanded.y+rect.height/2,angle:target.angle,scale:rect.height/artworkHeight};
}
