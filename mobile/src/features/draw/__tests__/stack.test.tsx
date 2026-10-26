import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Stack } from '../Stack';
import type { SessionState } from '../../../domain/contracts';
import { renderFrame } from '../renderFrame';
import { RECEIVER, SOURCE, layerStep } from '../motion';
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated',()=>({__esModule:true,default:{View:require('react-native').View},useAnimatedStyle:(f:()=>unknown)=>f()}));
const ids=(n:number)=>Array.from({length:n},(_,i)=>i);
const base:SessionState={sessionId:'s',epoch:0,phase:'ready',deckId:'d',deckVersion:'1',remainingIds:[],drawnIds:[],sourceIds:[],receivedIds:[],flyingIds:[],selectedId:null,drawQueued:false,phaseOrigin:null};
type Role='intact'|'source'|'receiver'|'flying'|'selected';
async function painted(state:SessionState,role:Role,t:number,corner=[0,0]) {
 const view=await render(<Stack role={role} frame={{value:renderFrame(state)} as never} progress={{value:t} as never} back={1}/>);
 const tree=view.toJSON()!;
 const back=tree.children!.find(child=>typeof child!=='string' && child.children?.some(n=>typeof n!=='string'&&n.type==='Image'));
 if (!back || typeof back==='string') throw new Error('Missing card back host');
 const img=back.children!.find(child=>typeof child!=='string' && child.type==='Image');
 if (!img || typeof img==='string') throw new Error('Missing painted card');
 const image=StyleSheet.flatten(back.props.style), style=StyleSheet.flatten(tree.props.style);
 expect(style.opacity).toBe(1);
 let x=(image.transform[0].translateX ?? 0)+corner[0],y=(image.transform[1].translateY ?? 0)+corner[1];
 for(const transform of [...style.transform].reverse()) {if(transform.rotate){const a=parseFloat(transform.rotate);[x,y]=[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}else if(transform.scaleX!==undefined)x*=transform.scaleX;else if(transform.scaleY!==undefined)y*=transform.scaleY;}
 await view.unmount();return {x:style.left+119+x,y:style.top+179+y};
}
function near(a:{x:number;y:number},b:{x:number;y:number}){expect(a.x).toBeCloseTo(b.x,6);expect(a.y).toBeCloseTo(b.y,6);}
test.each([1,8,100])('painted stack surfaces meet at packet boundaries for %i cards',async n=>{
 const all=ids(n),total={remainingIds:all};
 const ready={...base,...total,phase:'ready' as const,sourceIds:all};
 const top=await painted(ready,'source',0);
 const depth=layerStep(n)*(n-1),dx=-depth*.8/4.2,dy=-depth;
 near(top,{x:SOURCE.x+dx*Math.cos(SOURCE.angle)-dy*Math.sin(SOURCE.angle),y:SOURCE.y+.88*(dx*Math.sin(SOURCE.angle)+dy*Math.cos(SOURCE.angle))});
 if(n>1){const packet=Math.min(3,n-1);const strip={...base,...total,phase:'strip' as const,sourceIds:ids(n-packet),flyingIds:ids(packet)};near(top,await painted(strip,'flying',0));}
 const contact={...base,...total,phase:'contact' as const,receivedIds:all};
 const lowerTop=await painted(contact,'receiver',0);
 const lift={...base,remainingIds:ids(n-1),drawnIds:[n-1],receivedIds:ids(n-1),selectedId:n-1,phase:'lift' as const};
 near(lowerTop,await painted(lift,'selected',0));
 if(n>1){const packet=Math.min(3,n-1);const landing={...base,...total,phase:'strip' as const,receivedIds:ids(n-packet),flyingIds:ids(packet)};near(lowerTop,await painted(landing,'flying',1));
 const resume={...base,...total,phase:'resume' as const,receivedIds:ids(n-1),sourceIds:[n-1]};near(lowerTop,await painted(resume,'source',1));}
 const corner=await painted(contact,'receiver',0,[119,179]);
 near(corner,{x:RECEIVER.x+(dx+119)*Math.cos(RECEIVER.angle)-(dy+179)*Math.sin(RECEIVER.angle),y:RECEIVER.y+.88*((dx+119)*Math.sin(RECEIVER.angle)+(dy+179)*Math.cos(RECEIVER.angle))});
});
test('flip scales the local card axis after rotation and vertical compression',async()=>{
 const state={...base,phase:'flip' as const,remainingIds:[],drawnIds:[0],selectedId:0};
 const t=.25,turn=t*t*(3-2*t),flip=Math.abs(Math.cos(Math.PI*turn));
 near(await painted(state,'selected',t,[119,179]),{x:450+1.25*119*flip,y:555+1.25*.88*179});
});
