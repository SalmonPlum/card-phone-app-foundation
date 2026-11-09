import { render } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StyleSheet } from 'react-native';
import { Stack } from '../Stack';
import type { SessionState } from '../../../domain/contracts';
import { sampleDeck } from '../../../decks/sample';
import { CardFace } from '../../cards/CardTile';
import { renderFrame } from '../renderFrame';
import { RECEIVER, SOURCE, layerStep } from '../motion';
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated',()=>({__esModule:true,default:{View:require('react-native').View},useAnimatedStyle:(f:()=>unknown)=>f()}));
const ids=(n:number)=>Array.from({length:n},(_,i)=>i);
const base:SessionState={sessionId:'s',epoch:0,phase:'ready',deckId:'d',deckVersion:'1',remainingIds:[],drawnIds:[],sourceIds:[],receivedIds:[],flyingIds:[],selectedId:null,drawQueued:false,phaseOrigin:null};
type Role='intact'|'source'|'receiver'|'flying'|'selected';
function transformed(style: { transform: Record<string, number | string>[] }, x:number,y:number) {
 for(const transform of [...style.transform].reverse()) {if(transform.rotate){const a=parseFloat(String(transform.rotate));[x,y]=[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}else if(transform.scaleX!==undefined)x*=Number(transform.scaleX);else if(transform.scaleY!==undefined)y*=Number(transform.scaleY);}
 return {x,y};
}
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
 ({x,y}=transformed(style,x,y));
 await view.unmount();return {x:style.left+style.width/2+x,y:style.top+style.height/2+y};
}
function near(a:{x:number;y:number},b:{x:number;y:number}){expect(a.x).toBeCloseTo(b.x,6);expect(a.y).toBeCloseTo(b.y,6);}
test('all full card surfaces preserve the same native artwork proportions as the catalogue',async()=>{
 // Read the shipped PNG, independently of the draw renderer's dimensions.
 const png=readFileSync(join(process.cwd(),'assets/decks/sample/seed.png'));
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20),nativeRatio=width/height;
 const catalogue=await render(<CardFace card={sampleDeck.cards[0]} locale="en" assetRegistry={{'sample.seed':{uri:'seed.png',width,height}}} testID="catalogue-face"/>);
 expect(StyleSheet.flatten(catalogue.getByTestId('catalogue-face').props.style).aspectRatio).toBeCloseTo(nativeRatio,9);
 await catalogue.unmount();
 const cases:[SessionState['phase'],Role,number][]=[
  ['reveal','selected',1],['flip','selected',0],['flip','selected',1],
  ['lift','selected',0],['lift','selected',.4],['lift','selected',1],
  ['regrip','intact',0],['regrip','intact',.5],['return','intact',.5],['lower','intact',.5],
  ['ready','source',0],['strip','source',.5],['strip','flying',.5],['contact','receiver',.5],
  ['lift','source',.5],['reveal','source',1],['resume','source',.5],['resume','receiver',.5],
 ];
 for(const [phase,role,t] of cases){
  const state={...base,phase,remainingIds:ids(7),drawnIds:[7],sourceIds:ids(3),receivedIds:ids(3),flyingIds:[6],selectedId:7};
  const view=await render(<Stack role={role} frame={{value:renderFrame(state)} as never} progress={{value:t} as never} back={1} face={2}/>);
  const tree=view.toJSON()!,style=StyleSheet.flatten(tree.props.style);
  expect(style.opacity).toBe(1);
  const images=tree.children!.flatMap(host=>typeof host==='string'?[]:host.children?.filter(child=>typeof child!=='string'&&child.type==='Image')??[]);
  expect(images).toHaveLength(role==='selected'?2:1);
  for(const image of images){
   if(typeof image==='string')throw new Error('Expected painted card image');
   const size=StyleSheet.flatten(image.props.style);
   const x=transformed(style,size.width,0),y=transformed(style,0,size.height);
   // Lengths of transformed local axes detect distortion even on rotated cards;
   // axis-aligned bounding boxes would conflate rotation with a changed aspect.
   expect({phase,role,t,ratio:Math.hypot(x.x,x.y)/Math.hypot(y.x,y.y)}).toEqual({phase,role,t,ratio:expect.closeTo(nativeRatio,9)});
   expect((x.x*y.x+x.y*y.y)/(Math.hypot(x.x,x.y)*Math.hypot(y.x,y.y))).toBeCloseTo(0,9);
  }
  await view.unmount();
 }
});
test.each([1,8,100])('painted stack surfaces meet at packet boundaries for %i cards',async n=>{
 const all=ids(n),total={remainingIds:all};
 const ready={...base,...total,phase:'ready' as const,sourceIds:all};
 const top=await painted(ready,'source',0);
 const depth=layerStep(n)*(n-1),dx=-depth*.8/4.2,dy=-depth;
 near(top,{x:SOURCE.x+dx*Math.cos(SOURCE.angle)-dy*Math.sin(SOURCE.angle),y:SOURCE.y+dx*Math.sin(SOURCE.angle)+dy*Math.cos(SOURCE.angle)});
 if(n>1){const packet=Math.min(3,n-1);const strip={...base,...total,phase:'strip' as const,sourceIds:ids(n-packet),flyingIds:ids(packet)};near(top,await painted(strip,'flying',0));}
 const contact={...base,...total,phase:'contact' as const,receivedIds:all};
 const lowerTop=await painted(contact,'receiver',0);
 const lift={...base,remainingIds:ids(n-1),drawnIds:[n-1],receivedIds:ids(n-1),selectedId:n-1,phase:'lift' as const};
 near(lowerTop,await painted(lift,'selected',0));
 if(n>1){const packet=Math.min(3,n-1);const landing={...base,...total,phase:'strip' as const,receivedIds:ids(n-packet),flyingIds:ids(packet)};near(lowerTop,await painted(landing,'flying',1));
 const resume={...base,...total,phase:'resume' as const,receivedIds:ids(n-1),sourceIds:[n-1]};near(lowerTop,await painted(resume,'source',1));}
 const corner=await painted(contact,'receiver',0,[119,178.5]);
 near(corner,{x:RECEIVER.x+(dx+119)*Math.cos(RECEIVER.angle)-(dy+178.5)*Math.sin(RECEIVER.angle),y:RECEIVER.y+(dx+119)*Math.sin(RECEIVER.angle)+(dy+178.5)*Math.cos(RECEIVER.angle)});
});
test('flip foreshortens only the local horizontal card axis',async()=>{
 const state={...base,phase:'flip' as const,remainingIds:[],drawnIds:[0],selectedId:0};
 const t=.25,turn=t*t*(3-2*t),flip=Math.abs(Math.cos(Math.PI*turn));
 near(await painted(state,'selected',t,[119,178.5]),{x:450+1.25*119*flip,y:555+1.25*178.5});
});

test('a nonstandard artwork canvas sizes the stack and its native image without stretching', async () => {
  const view = await render(<Stack role="intact" frame={{value:renderFrame({...base,remainingIds:[0]})} as never} progress={{value:0} as never} back={1} artworkHeight={297.5}/>);
  const tree = view.toJSON()!;
  expect(StyleSheet.flatten(tree.props.style)).toMatchObject({width:238,height:297.5});
  const image = view.container.queryAll(node => node.type === 'Image')[0];
  expect(StyleSheet.flatten(image.props.style)).toMatchObject({width:238,height:297.5});
});
