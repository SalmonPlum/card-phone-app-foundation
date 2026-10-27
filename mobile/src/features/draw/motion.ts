import type { Phase, Pose } from '../../domain/contracts.ts';
export const SOURCE: Pose = {x:620,y:330,angle:.12,scale:1};
export const RECEIVER: Pose = {x:300,y:575,angle:-.105,scale:1};
export const CENTER: Pose = {x:450,y:486,angle:-.035,scale:1};
export const ASIDE: Pose = {x:735,y:290,angle:.16,scale:.86};
export const FOREGROUND: Pose = {x:450,y:555,angle:0,scale:1.25};
export function phaseDurationMs(phase: Phase): number {
  return ({regrip:780/1.25,ready:180/1.25,strip:620/1.25,contact:120/1.25,return:1080/1.25,lower:360,lift:640,flip:620,resume:740,reveal:0,results:0})[phase];
}
export function layerStep(totalCards: number): number { 'worklet'; return Math.min(4.2,36/Math.max(1,totalCards-1)); }
export function ease(t: number): number { 'worklet'; t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
export function mix(a: Pose,b: Pose,t: number): Pose { 'worklet'; return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:a.angle+(b.angle-a.angle)*t,scale:a.scale+(b.scale-a.scale)*t}; }
export function above(p: Pose,n: number,total: number): Pose { 'worklet'; const edge=layerStep(total), x=-n*.8*edge/4.2,y=-n*edge; return {...p,x:p.x+(x*Math.cos(p.angle)-y*Math.sin(p.angle))*p.scale,y:p.y+(x*Math.sin(p.angle)+y*Math.cos(p.angle))*p.scale}; }
export function regripPose(t: number): Pose { 'worklet'; const p=mix(CENTER,SOURCE,ease(t)); return {...p,x:p.x-Math.sin(Math.PI*t)*12,y:p.y-Math.sin(Math.PI*t)*22}; }
export function returnPose(t: number): Pose { 'worklet'; if (t <= 0) return RECEIVER; if (t >= 1) return SOURCE; const u=ease(t),v=1-u,p=mix(RECEIVER,SOURCE,u); return {...p,x:v*v*RECEIVER.x+2*v*u*425+u*u*SOURCE.x,y:v*v*RECEIVER.y+2*v*u*390+u*u*SOURCE.y}; }
