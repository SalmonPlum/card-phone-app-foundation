import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DeckManifest, Locale, Pose, SessionState } from '../../domain/contracts';
import { assetRegistry, type AssetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { Stack } from './Stack';
import { useShuffleAnimation } from './useShuffleAnimation';

type Props={state:SessionState;deck:DeckManifest;locale:Locale;onDraw:(pose:Pose,sessionId:string,epoch:number)=>void;onConfirm:()=>void;onPhaseComplete:(sessionId:string,epoch:number)=>void;paused:boolean;reducedMotion?:boolean};
export function ShuffleScene({state,deck,locale,onDraw,onConfirm,onPhaseComplete,paused,reducedMotion=false}:Props) {
 const [size,setSize]=useState({width:0,height:0}), [failedId,setFailedId]=useState<number|null>(null);
 // Keep the last revealed artwork through the RN→UI confirmation boundary.
 const displayId=state.selectedId ?? state.drawnIds.at(-1) ?? null;
 const assetFailed=displayId!==null && failedId===displayId;
 const {progress,frame,samplePose}=useShuffleAnimation(state,paused,reducedMotion,onPhaseComplete);
 const selected=deck.cards.find(c=>c.id===displayId), name=selected?.translations[locale].name;
 const faceKey=selected?.translations[locale].faceAsset ?? selected?.faceAsset;
 const assets:AssetRegistry=assetRegistry;
 const back=assets[deck.localizedBackAssets?.[locale] ?? deck.backAsset];
 const scale=Math.min(size.width/900,size.height/960);
 const canDraw=['regrip','ready','strip','contact','return','lower'].includes(state.phase)&&!state.drawQueued&&!paused;
 return <View style={styles.outer} onLayout={e=>setSize(e.nativeEvent.layout)}>
  {scale>0 && <View pointerEvents="none" style={{position:'absolute',width:900,height:960,left:(size.width-900)/2,top:(size.height-960)/2,transform:[{scale}]}}>
    {(['intact','source','receiver','flying','selected'] as const).map(role=><Stack key={role} role={role} frame={frame} revealed={state.phase==='reveal'} progress={progress} back={back} face={role==='selected'&&!assetFailed&&faceKey?assets[faceKey]:undefined} name={role==='selected'?name:undefined} onAssetError={()=>setFailedId(displayId)}/>)}
  </View>}
  {state.phase==='reveal' && <View style={styles.label}><Text style={styles.name}>{name}</Text>{assetFailed && <Pressable onPress={()=>setFailedId(null)} accessibilityRole="button"><Text style={styles.error}>{t('assetError',locale)} {t('retry',locale)}</Text></Pressable>}</View>}
  <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t(state.phase==='reveal'?'confirm':'draw',locale)} disabled={paused||(!canDraw&&state.phase!=='reveal')} onPress={()=>state.phase==='reveal'?onConfirm():samplePose(onDraw)} />
  {assetFailed && state.phase==='reveal' && <Pressable style={styles.retry} onPress={()=>setFailedId(null)} accessibilityRole="button"><Text style={styles.error}>{t('retry',locale)}</Text></Pressable>}
 </View>;
}
const styles=StyleSheet.create({outer:{flex:1,overflow:'hidden',backgroundColor:'#20382f',borderRadius:24,minHeight:260},label:{position:'absolute',bottom:16,left:12,right:12,alignItems:'center'},name:{fontSize:23,color:'#f2e8d1',fontWeight:'600'},error:{color:'#f2e8d1'},retry:{position:'absolute',bottom:0,right:0,padding:12}});
