import type {ComponentRef,Ref} from 'react';
import {Pressable,StyleSheet,View,type StyleProp,type ViewStyle} from 'react-native';
import {useThemeStyles,type ThemeColors} from './useThemeStyles';

type Props={icon:'close'|'back'|'trash'|'cards-restart';label:string;onPress:()=>void;disabled?:boolean;variant?:'plain'|'circle';ref?:Ref<ComponentRef<typeof View>>;style?:StyleProp<ViewStyle>};

/** Small, consistent native strokes inside a full accessible touch target. */
export function IconButton({icon,label,onPress,disabled=false,variant='plain',ref,style}:Props){
  const styles=useThemeStyles(makeStyles);
  return <Pressable ref={ref} accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    onPress={onPress} style={({pressed})=>[styles.button,variant==='circle'&&styles.circle,style,(pressed||disabled)&&styles.dim]}>
    <View testID={`icon-${icon}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      {icon==='close'?<><View style={[styles.stroke,styles.crossA]}/><View style={[styles.stroke,styles.crossB]}/></>
        :icon==='back'?<><View style={[styles.stroke,styles.shaft]}/><View style={styles.arrowHead}/></>
        :icon==='cards-restart'?<><View style={[styles.cardOutline,styles.backCard]}/><View style={[styles.cardOutline,styles.frontCard]}/><View style={styles.restartBadge}><View style={styles.restartArc}/><View style={styles.restartHead}/></View></>
        :<><View style={styles.bin}/><View style={[styles.stroke,styles.lid]}/><View style={styles.handle}/><View style={[styles.binLine,{left:8}]}/><View style={[styles.binLine,{left:12}]}/></>}
    </View>
  </Pressable>;
}
const makeStyles=(colors:ThemeColors)=>StyleSheet.create({
  button:{minWidth:48,minHeight:48,height:48,width:48,flexShrink:0,alignItems:'center',justifyContent:'center',borderRadius:24},dim:{opacity:.5},
  circle:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  icon:{width:22,height:22},stroke:{position:'absolute',height:2,borderRadius:1,backgroundColor:colors.primary},
  crossA:{width:22,left:0,top:10,transform:[{rotate:'45deg'}]},crossB:{width:22,left:0,top:10,transform:[{rotate:'-45deg'}]},
  shaft:{width:18,left:2,top:10},arrowHead:{position:'absolute',left:4,top:5,width:12,height:12,borderLeftWidth:2,borderBottomWidth:2,borderColor:colors.primary,transform:[{rotate:'45deg'}]},
  cardOutline:{position:'absolute',width:12,height:17,borderWidth:1.5,borderColor:colors.primary,borderRadius:2,backgroundColor:colors.surface},
  backCard:{left:1,top:1},frontCard:{left:5,top:4},
  restartBadge:{position:'absolute',left:10,top:10,width:13,height:13,borderRadius:7,backgroundColor:colors.surface},
  restartArc:{position:'absolute',left:2,top:2,width:9,height:9,borderWidth:1.5,borderColor:colors.primary,borderRightColor:'transparent',borderRadius:5,transform:[{rotate:'-45deg'}]},
  restartHead:{position:'absolute',left:8,top:1,width:4,height:4,borderBottomWidth:1.5,borderRightWidth:1.5,borderColor:colors.primary},
  bin:{position:'absolute',left:4,top:7,width:14,height:14,borderWidth:2,borderTopWidth:0,borderColor:colors.primary,borderBottomLeftRadius:2,borderBottomRightRadius:2},
  lid:{left:2,top:4,width:18},handle:{position:'absolute',left:7,top:0,width:8,height:4,borderWidth:2,borderBottomWidth:0,borderColor:colors.primary,borderTopLeftRadius:2,borderTopRightRadius:2},
  binLine:{position:'absolute',top:9,width:2,height:8,borderRadius:1,backgroundColor:colors.primary},
});
