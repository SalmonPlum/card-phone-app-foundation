import { CardArtwork } from '../../artwork/CardArtwork';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { Phase, Pose } from '../../domain/contracts';
import { above, ASIDE, confirmationExit, ease, FOREGROUND, layerStep, mix, RECEIVER, regripPose, returnPose, SOURCE } from './motion';
import { stackCount, type RenderFrame, type StackRole } from './renderFrame';
import { toDrawHost, type DrawScenePlacement } from './foreground';
import {drawReadingPose,type DrawReadingState} from './revealReading';
import { useThemeSettings } from '../../themes/ThemeProvider';

type Props = { role: StackRole; frame: SharedValue<RenderFrame>; progress: SharedValue<number>; back: ImageSourcePropType; face?: ImageSourcePropType; backKey?: string; faceKey?: string; artworkHeight?: number; backRetryKey?: number; onBackAssetError?: () => void; revealed?: boolean; name?: string; onAssetError?: () => void; viewport?: { scene: DrawScenePlacement; target: Pose; scrollOffset: SharedValue<number>;reading?:SharedValue<DrawReadingState>;reducedMotion?:boolean } };
function showsFace(phase:Phase,progress:number) {
  'worklet';
  return phase==='reveal'||phase==='resume'||(phase==='flip'&&progress>=.5);
}
function Edge({role,frame,progress,index,artworkHeight}: Pick<Props,'role'|'frame'|'progress'> & {index:number;artworkHeight:number}) {
  const style=useAnimatedStyle(()=>{
    const count=stackCount(frame.value,role),layers=Math.min(count,12);
    const depth=layerStep(frame.value.total)*Math.max(0,count-1);
    const d=layers<=1?0:depth*index/(layers-1);
    return {opacity:index<layers&&!(role==='selected'&&showsFace(frame.value.phase,progress.value))?1:0,transform:[{translateX:-d*.8/4.2},{translateY:-d}]};
  });
  return <Animated.View style={[{...styles.edge,height:artworkHeight},style]}/>;
}
export function Stack({role,frame,progress,back,face,backKey,faceKey,artworkHeight=357,backRetryKey,onBackAssetError,revealed=false,name,onAssetError,viewport}: Props) {
  const { theme } = useThemeSettings();
  const style = useAnimatedStyle(() => {
    const state=frame.value,total=state.total,count=stackCount(state,role);
    const t=progress.value,e=ease(t),phase=state.phase;
    let p: Pose = SOURCE;
    if(role==='intact') p=phase==='regrip'?regripPose(t):phase==='return'?returnPose(t):mix(state.phaseOrigin ?? SOURCE,RECEIVER,e);
    if(role==='source') {
      p=SOURCE;
      if(phase==='strip') p={...p,x:p.x+Math.sin(Math.PI*t)*23,y:p.y-Math.sin(Math.PI*t)*19,angle:p.angle+Math.sin(Math.PI*t)*.025};
      if(phase==='lift'||phase==='awaitingReveal'||phase==='flip'||phase==='reveal') p=mix(SOURCE,ASIDE,phase==='lift'?ease(Math.min(1,t/.8)):1);
      if(phase==='resume') { p=mix(ASIDE,above(RECEIVER,state.received,total),e); p={...p,y:p.y-Math.sin(Math.PI*t)*30}; }
    }
    if(role==='receiver') p=phase==='contact'?{...RECEIVER,y:RECEIVER.y+Math.sin(Math.PI*t)*3}:RECEIVER;
    if(role==='flying') { p=mix(above(SOURCE,state.source,total),above(RECEIVER,state.received,total),e); p={...p,x:p.x-Math.sin(Math.PI*t)*13,y:p.y-Math.sin(Math.PI*t)*9,angle:p.angle-Math.sin(Math.PI*t)*.025}; }
    if(role==='selected') {
      const source=above(RECEIVER,state.received,total);
      const origin=viewport?toDrawHost(source,viewport.scene,viewport.scrollOffset.value):source;
      p=mix(origin,viewport?.target ?? FOREGROUND,phase==='lift'?e:1);
      if((phase==='reveal'||phase==='resume')&&viewport?.reading) p=drawReadingPose(p,viewport.reading.value.offset,viewport.reducedMotion ?? false,artworkHeight);
      if(phase==='resume') p={...p,y:p.y-confirmationExit(t).rise};
      if(phase==='lift'&&t>0&&t<1) p={...p,x:p.x-Math.sin(Math.PI*t)*18*(viewport?.scene.scale ?? 1),angle:p.angle-Math.sin(Math.PI*t)*.06};
    }
    const turn=role==='selected'?(phase==='flip'?ease(t):phase==='reveal'||phase==='resume'?1:0):0;
    const zIndex=role==='selected'?4:role==='flying'?3:role==='source'&&phase==='resume'?2:role==='receiver'?1:0;
    return {opacity:count>0?(role==='selected'&&phase==='resume'?confirmationExit(t).opacity:1):0,zIndex,left:p.x-119,top:p.y-artworkHeight/2,transform:[{scaleX:p.scale},{scaleY:p.scale},{rotate:`${p.angle}rad`},{scaleX:role==='selected'?Math.max(.012,Math.abs(Math.cos(Math.PI*turn))):1}]};
  });
  const backStyle=useAnimatedStyle(()=>{
    const depth=layerStep(frame.value.total)*Math.max(0,stackCount(frame.value,role)-1);
    // Keep the native back mounted, but never paint it beneath a fading face.
    return {opacity:role==='selected'&&showsFace(frame.value.phase,progress.value)?0:1,transform:[{translateX:-depth*.8/4.2},{translateY:-depth}]};
  });
  const frontStyle = useAnimatedStyle(() => ({opacity: showsFace(frame.value.phase,progress.value)?1:0}));
  return <Animated.View style={[{...styles.stack,height:artworkHeight},style]} accessible={role==='selected' && revealed} accessibilityLabel={revealed?name:undefined}>
    {Array.from({length:12},(_,index)=><Edge key={index} role={role} frame={frame} progress={progress} index={index} artworkHeight={artworkHeight}/>)}
    <Animated.View style={[{...styles.back,height:artworkHeight},backStyle]}><CardArtwork assetKey={backKey} source={back} style={{...styles.image,height:artworkHeight}} resizeMode="cover" testID={`stack-${role}-back`} retryKey={backRetryKey} onError={onBackAssetError}/></Animated.View>
    {role==='selected' && <Animated.View style={[styles.front,frontStyle]}>{face ? <CardArtwork assetKey={faceKey} source={face} style={{...styles.image,height:artworkHeight}} resizeMode="cover" testID={`stack-${role}-face`} onError={onAssetError} /> : <View style={[styles.placeholder,{backgroundColor:theme.colors.canvas}]} />}</Animated.View>}
  </Animated.View>;
}
// Default artwork is 600×900; other authored canvases supply their native height.
// Physical stack edges belong to the fixed artwork, not the interface palette.
const styles=StyleSheet.create({stack:{position:'absolute',width:238,height:357},edge:{position:'absolute',width:238,height:357,borderRadius:12,backgroundColor:'#f0eee8',borderWidth:1,borderColor:'#c5a059'},image:{width:238,height:357,borderRadius:12},back:{position:'absolute',width:238,height:357},front:{...StyleSheet.absoluteFill},placeholder:{flex:1,borderRadius:12}});
