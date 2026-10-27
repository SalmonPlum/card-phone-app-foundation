import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { Pose } from '../../domain/contracts';
import { above, ASIDE, ease, FOREGROUND, layerStep, mix, RECEIVER, regripPose, returnPose, SOURCE } from './motion';
import { stackCount, type RenderFrame, type StackRole } from './renderFrame';
import { colors } from '../../ui/theme';

type Props = { role: StackRole; frame: SharedValue<RenderFrame>; progress: SharedValue<number>; back: ImageSourcePropType; face?: ImageSourcePropType; revealed?: boolean; name?: string; onAssetError?: () => void };
function Edge({role,frame,index}: Pick<Props,'role'|'frame'> & {index:number}) {
  const style=useAnimatedStyle(()=>{
    const count=stackCount(frame.value,role),layers=Math.min(count,12);
    const depth=layerStep(frame.value.total)*Math.max(0,count-1);
    const d=layers<=1?0:depth*index/(layers-1);
    return {opacity:index<layers?1:0,transform:[{translateX:-d*.8/4.2},{translateY:-d}]};
  });
  return <Animated.View style={[styles.edge,style]}/>;
}
export function Stack({role,frame,progress,back,face,revealed=false,name,onAssetError}: Props) {
  const style = useAnimatedStyle(() => {
    const state=frame.value,total=state.total,count=stackCount(state,role);
    const t=progress.value,e=ease(t),phase=state.phase;
    let p: Pose = SOURCE;
    if(role==='intact') p=phase==='regrip'?regripPose(t):phase==='return'?returnPose(t):mix(state.phaseOrigin ?? SOURCE,RECEIVER,e);
    if(role==='source') {
      p=SOURCE;
      if(phase==='strip') p={...p,x:p.x+Math.sin(Math.PI*t)*23,y:p.y-Math.sin(Math.PI*t)*19,angle:p.angle+Math.sin(Math.PI*t)*.025};
      if(phase==='lift'||phase==='flip'||phase==='reveal') p=mix(SOURCE,ASIDE,phase==='lift'?ease(Math.min(1,t/.8)):1);
      if(phase==='resume') { p=mix(ASIDE,above(RECEIVER,state.received,total),e); p={...p,y:p.y-Math.sin(Math.PI*t)*30}; }
    }
    if(role==='receiver') p=phase==='contact'?{...RECEIVER,y:RECEIVER.y+Math.sin(Math.PI*t)*3}:RECEIVER;
    if(role==='flying') { p=mix(above(SOURCE,state.source,total),above(RECEIVER,state.received,total),e); p={...p,x:p.x-Math.sin(Math.PI*t)*13,y:p.y-Math.sin(Math.PI*t)*9,angle:p.angle-Math.sin(Math.PI*t)*.025}; }
    if(role==='selected') { p=mix(above(RECEIVER,state.received,total),FOREGROUND,phase==='lift'?e:1); if(phase==='lift') p={...p,x:p.x-Math.sin(Math.PI*t)*18,angle:p.angle-Math.sin(Math.PI*t)*.06}; }
    const turn=role==='selected'?(phase==='flip'?ease(t):phase==='reveal'?1:0):0;
    const zIndex=role==='selected'?4:role==='flying'?3:role==='source'&&phase==='resume'?2:role==='receiver'?1:0;
    return {opacity:count>0?1:0,zIndex,left:p.x-119,top:p.y-179,transform:[{scaleX:p.scale},{scaleY:p.scale*.88},{rotate:`${p.angle}rad`},{scaleX:role==='selected'?Math.max(.012,Math.abs(Math.cos(Math.PI*turn))):1}]};
  });
  const backStyle=useAnimatedStyle(()=>{
    const depth=layerStep(frame.value.total)*Math.max(0,stackCount(frame.value,role)-1);
    return {transform:[{translateX:-depth*.8/4.2},{translateY:-depth}]};
  });
  const frontStyle = useAnimatedStyle(() => ({opacity: frame.value.phase==='reveal'||(frame.value.phase==='flip'&&progress.value>=.5)?1:0}));
  return <Animated.View style={[styles.stack,style]} accessible={role==='selected' && revealed} accessibilityLabel={name}>
    {Array.from({length:12},(_,index)=><Edge key={index} role={role} frame={frame} index={index}/>)}
    <Animated.View style={[styles.back,backStyle]}><Image source={back} style={styles.image} resizeMode="cover" fadeDuration={0}/></Animated.View>
    {role==='selected' && <Animated.View style={[styles.front,frontStyle]}>{face ? <Image source={face} style={styles.image} resizeMode="cover" fadeDuration={0} onError={onAssetError} /> : <View style={styles.placeholder} />}</Animated.View>}
  </Animated.View>;
}
const styles=StyleSheet.create({stack:{position:'absolute',width:238,height:358},edge:{position:'absolute',width:238,height:358,borderRadius:12,backgroundColor:colors.panel,borderWidth:1,borderColor:colors.brass},image:{width:238,height:358,borderRadius:12},back:{position:'absolute',width:238,height:358},front:{...StyleSheet.absoluteFill},placeholder:{flex:1,backgroundColor:colors.canvas,borderRadius:12}});
