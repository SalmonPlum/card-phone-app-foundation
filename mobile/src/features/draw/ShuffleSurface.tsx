import {Image,StyleSheet,View} from 'react-native';
import {useThemeSettings} from '../../themes/ThemeProvider';
import {shuffleTextureAssets} from '../../themes/shuffleTextureAssets';
import type {ShuffleTextureKey} from '../../themes/shuffleTextureCatalog';

/** Static background only: no layout, input handling, clock or card state. */
export function ShuffleSurface(){
  const {theme}=useThemeSettings();
  const surface=theme.shuffleSurface;
  if(!surface||surface.opacity===0)return null;
  const source=shuffleTextureAssets[surface.texture as ShuffleTextureKey];
  return <View testID="shuffle-surface" style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image testID="shuffle-fabric" source={source} resizeMode="repeat" fadeDuration={0} accessible={false}
      // Image adds its source dimensions before style; override both to fill the mat.
      style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',opacity:surface.opacity}]}/>
  </View>;
}
