import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { Pose, SessionState } from '../../domain/contracts';
import { above, ASIDE, ease, FOREGROUND, layerStep, mix, RECEIVER, regripPose, returnPose, SOURCE } from './motion';

type Role = 'intact' | 'source' | 'receiver' | 'flying' | 'selected';
type Props = { role: Role; count: number; state: SessionState; progress: SharedValue<number>; back: ImageSourcePropType; face?: ImageSourcePropType; name?: string; onAssetError?: () => void };
export function Stack({role,count,state,progress,back,face,name,onAssetError}: Props) {
  const total = state.remainingIds.length + state.drawnIds.length;
  const style = useAnimatedStyle(() => {
    const t=progress.value,e=ease(t),phase=state.phase;
    let p: Pose = SOURCE;
    if(role==='intact') p=phase==='regrip'?regripPose(t):phase==='return'?returnPose(t):mix(state.phaseOrigin ?? SOURCE,RECEIVER,e);
    if(role==='source') {
      p=SOURCE;
      if(phase==='strip') p={...p,x:p.x+Math.sin(Math.PI*t)*23,y:p.y-Math.sin(Math.PI*t)*19,angle:p.angle+Math.sin(Math.PI*t)*.025};
      if(phase==='lift'||phase==='flip'||phase==='reveal') p=mix(SOURCE,ASIDE,phase==='lift'?ease(Math.min(1,t/.8)):1);
      if(phase==='resume') { p=mix(ASIDE,above(RECEIVER,state.receivedIds.length,total),e); p={...p,y:p.y-Math.sin(Math.PI*t)*30}; }
    }
    if(role==='receiver') p=phase==='contact'?{...RECEIVER,y:RECEIVER.y+Math.sin(Math.PI*t)*3}:RECEIVER;
    if(role==='flying') { p=mix(above(SOURCE,state.sourceIds.length,total),above(RECEIVER,state.receivedIds.length,total),e); p={...p,x:p.x-Math.sin(Math.PI*t)*13,y:p.y-Math.sin(Math.PI*t)*9,angle:p.angle-Math.sin(Math.PI*t)*.025}; }
    if(role==='selected') { p=mix(above(RECEIVER,state.receivedIds.length,total),FOREGROUND,phase==='lift'?e:1); if(phase==='lift') p={...p,x:p.x-Math.sin(Math.PI*t)*18,angle:p.angle-Math.sin(Math.PI*t)*.06}; }
    const turn=role==='selected'?(phase==='flip'?ease(t):phase==='reveal'?1:0):0;
    return {left:p.x-119,top:p.y-179,transform:[{scaleX:p.scale},{scaleY:p.scale*.88},{rotate:`${p.angle}rad`},{scaleX:role==='selected'?Math.max(.012,Math.abs(Math.cos(Math.PI*turn))):1}]};
  });
  const frontStyle = useAnimatedStyle(() => ({opacity: state.phase==='reveal'||(state.phase==='flip'&&progress.value>=.5)?1:0}));
  if (!count) return null;
  const layers=Math.min(count,12), depth=layerStep(total)*Math.max(0,count-1);
  return <Animated.View style={[styles.stack,style]} accessible={role==='selected' && state.phase==='reveal'} accessibilityLabel={name}>
    {Array.from({length:layers},(_,i) => { const d=layers===1?0:depth*i/(layers-1); return <View key={i} style={[styles.edge,{left:-d*.8/4.2,top:-d}]} />; })}
    <Image source={back} style={[styles.image,{position:'absolute',left:-depth*.8/4.2,top:-depth}]} resizeMode="cover" />
    {role==='selected' && <Animated.View style={[styles.front,frontStyle]}>{face ? <Image source={face} style={styles.image} resizeMode="cover" onError={onAssetError} /> : <View style={styles.placeholder} />}</Animated.View>}
  </Animated.View>;
}
const styles=StyleSheet.create({stack:{position:'absolute',width:238,height:358},edge:{position:'absolute',width:238,height:358,borderRadius:12,backgroundColor:'#d3cfbb',borderWidth:1,borderColor:'#858e78'},image:{width:238,height:358,borderRadius:12},front:{...StyleSheet.absoluteFill},placeholder:{flex:1,backgroundColor:'#eee3c9',borderRadius:12}});
