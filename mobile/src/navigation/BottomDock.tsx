import {appPresentation} from '../config/presentation';
import {defaultMenuIcons,type MenuRoute} from '../config/presentationResource';
import {configuredInfoPage} from '../info';
import {useHistory} from '../history/HistoryProvider';
import { useThemeSettings } from '../themes/ThemeProvider';
import { useContext,useRef,type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../ui/useThemeStyles';
import {useReducedMotion} from '../features/cards/useReducedMotion';
import {useDockScroll} from './useDockScroll';
import { useTabInteraction } from './TabInteractionContext';

/** Floating menu; screens consume its measured height for scroll/control clearance. */
export function BottomDock({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const styles = useThemeStyles(makeStyles);
  const {archive}=useHistory();
  const { theme: { colors, appearance } } = useThemeSettings();
  const locale = useLocale(), { blocked } = useTabInteraction();
  const {fontScale}=useWindowDimensions();
  const reduced=useReducedMotion();
  const routes=state.routes.filter(route => route.name === 'index' || route.name === 'catalogue' || route.name === 'settings' || route.name === 'history' && archive.enabled || route.name === 'info' && !!configuredInfoPage);
  const labelFor=(name:string)=>name === 'info' && configuredInfoPage ? (appPresentation.infoMenuLabel?.[locale] ?? configuredInfoPage[locale].menuLabel) : t(name === 'index' ? 'drawTab' : name === 'catalogue' ? 'catalogueTab' : name === 'history' ? 'historyTab' : 'settings', locale);
  const keyList=JSON.stringify(routes.map(route=>route.key));
  const geometryKey=JSON.stringify([routes.map(route=>[route.key,labelFor(route.name)]),styles.label,fontScale]);
  const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null);
  const scroll=useDockScroll(scrollRef,keyList,state.routes[state.index].key,geometryKey,blocked,reduced);
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  return <View testID="bottom-dock" pointerEvents={blocked ? 'none' : 'box-none'}
    accessibilityElementsHidden={blocked} importantForAccessibility={blocked ? 'no-hide-descendants' : 'auto'}
    onLayout={event => reportHeight?.(event.nativeEvent.layout.height)}
    style={[styles.space, { paddingBottom: Math.max(insets.bottom, 8), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
    <View testID="bottom-dock-menu" style={[styles.pill, { backgroundColor: appearance === 'light' ? '#ffffff' : colors.surface }]}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.hint}>
        {scroll.hints.left&&<Text testID="dock-overflow-left" allowFontScaling={false} style={styles.chevron}>‹</Text>}
      </View>
      <ScrollView testID="bottom-dock-scroll" ref={scrollRef} horizontal style={styles.scroll}
        contentContainerStyle={[styles.scrollContent,{minWidth:scroll.viewport}]} showsHorizontalScrollIndicator={false}
        scrollEnabled={!blocked} bounces={false} overScrollMode="never" scrollEventThrottle={16}
        onLayout={scroll.onLayout} onContentSizeChange={scroll.onContentSizeChange} onScroll={scroll.onScroll}
        onTouchStartCapture={scroll.onTouchStartCapture}
        onScrollBeginDrag={scroll.onScrollBeginDrag} onScrollEndDrag={scroll.onScrollEndDrag}
        onMomentumScrollBegin={scroll.onMomentumScrollBegin} onMomentumScrollEnd={scroll.onMomentumScrollEnd}>
      {routes.map(route => {
        const selected = state.routes[state.index].key === route.key;
        const label = labelFor(route.name);
        const icon = appPresentation.menuIcons[route.name as MenuRoute] ?? defaultMenuIcons[route.name as MenuRoute];
        const ink = selected ? colors.accent : colors.primary;
        return <Pressable key={`${route.key}:${scroll.signature}`} onLayout={event=>scroll.onItemLayout(route.key,event)} onFocus={()=>scroll.onFocus(route.key)} accessibilityRole="tab" accessibilityLabel={label}
          accessibilityState={{ selected, disabled: blocked }} disabled={blocked} style={[styles.item,scroll.viewport>0&&{maxWidth:scroll.viewport}]}
          onPress={() => {
            if (blocked || scroll.isDragging()) return;
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigateToTab(route.key);
          }}
          onLongPress={() => { if (!blocked && !scroll.isDragging()) emitter.emit({ type: 'tabLongPress', target: route.key }); }}>
          <View testID={`dock-icon-${icon}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
            {icon === 'cards' ? <><View style={[styles.cardBack, { borderColor: ink }]} /><View style={[styles.card, { borderColor: ink }]} /></>
              : icon === 'info' ? <View style={[styles.infoCircle,{borderColor:ink}]}><Text allowFontScaling={false} style={[styles.infoGlyph,{color:ink}]}>i</Text></View> : icon === 'clock' ? <View style={[styles.clock,{borderColor:ink}]}><View style={[styles.clockHand,{backgroundColor:ink}]}/><View style={[styles.clockMinute,{backgroundColor:ink}]}/></View> : icon === 'settings' ? <Text allowFontScaling={false} style={[styles.gear,{color:ink}]}>⚙︎</Text> : <View style={styles.grid}>{[0, 1, 2, 3].map(index => <View key={index} style={[styles.cell, { borderColor: ink }]} />)}</View>}
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.label, { color: ink }]}>{label}</Text>
          <View accessible={false} style={[styles.pip, { backgroundColor: selected ? colors.accent : 'transparent' }]} />
        </Pressable>;
      })}
      </ScrollView>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.hint}>
        {scroll.hints.right&&<Text testID="dock-overflow-right" allowFontScaling={false} style={styles.chevron}>›</Text>}
      </View>
    </View>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  space: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', paddingTop: 8 },
  pill: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 36, padding: 6,
    shadowColor: colors.shadow, shadowOpacity: .08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  scroll:{flex:1},
  scrollContent:{alignItems:'center',justifyContent:'space-around',gap:4},
  hint:{width:14,alignItems:'center',justifyContent:'center'},
  chevron:{fontSize:22,lineHeight:26,color:colors.primary},
  item: { flexShrink:0, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 28 },
  label: { ...typography.label, textAlign: 'center', flexShrink: 1 },
  icon: { width: 24, height: 22 },
  cardBack: { position: 'absolute', left: 2, top: 0, width: 14, height: 19, borderRadius: 3, borderWidth: 1.5, transform: [{ rotate: '-12deg' }] },
  card: { position: 'absolute', left: 8, top: 2, width: 14, height: 19, borderRadius: 3, borderWidth: 1.5, backgroundColor: colors.canvas },
  infoCircle:{width:21,height:21,borderRadius:11,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  infoGlyph:{fontSize:16,lineHeight:18,fontWeight:'bold'},
  clock:{width:21,height:21,borderRadius:11,borderWidth:1.5},
  clockHand:{position:'absolute',width:1.5,height:7,left:8.5,top:3},
  clockMinute:{position:'absolute',width:6,height:1.5,left:8.5,top:9},
  gear:{fontSize:22,lineHeight:22,textAlign:'center'},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, width: 23, height: 22 },
  cell: { width: 9, height: 9, borderRadius: 2, borderWidth: 1.5 },
  pip: { width: 4, height: 4, borderRadius: 2 },
});
