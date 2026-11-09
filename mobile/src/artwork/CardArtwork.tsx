import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/locale';
import { useThemeTypography } from '../themes/ThemeFontGate';
import { Image, StyleSheet, Text, View, type ImageProps, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { assetRegistry, type AssetRegistry } from '../decks/assets';
import { resolveArtworkLayers, type ArtworkDefinition } from '../domain/artwork';
import { useThemeSettings } from '../themes/ThemeProvider';
import { artworkDefinition, useArtworkDefinitions } from './ArtworkProvider';
import { useArtworkLoading } from './useArtworkLoading';

type Props = {
  assetKey?: string; source?: ImageProps['source']; registry?: AssetRegistry;
  style: StyleProp<ImageStyle>; resizeMode?: ImageProps['resizeMode']; testID?: string;
  retryKey?: number; onLoadEnd?: () => void; onError?: () => void;
};
/** Fixed art stays one native image; composed art has a stable root and layer IDs. */
export function CardArtwork({ registry = assetRegistry, ...props }: Props) {
  const definitions = useArtworkDefinitions();
  const definition = artworkDefinition(props.assetKey, definitions);
  return definition && props.assetKey
    ? <LayeredArtwork {...props} registry={registry} definition={definition} assetKey={props.assetKey}/>
    : <Image key={props.retryKey ?? 0} testID={props.testID} source={props.source} style={props.style} resizeMode={props.resizeMode ?? 'contain'}
      accessible={false} fadeDuration={0} onLoadEnd={props.onLoadEnd} onError={props.onError}/>;
}
function LayeredArtwork({ assetKey, definition, registry, source, style, testID, resizeMode = 'contain', onLoadEnd, onError, retryKey }: Props & {
  assetKey: string; definition: ArtworkDefinition; registry: AssetRegistry;
}) {
  const { theme } = useThemeSettings();
  const locale = useLocale(), typography = useThemeTypography();
  const loading = useArtworkLoading({ assetKey, definition, retryKey, onLoadEnd, onError });
  const layers = resolveArtworkLayers(definition, theme.cardColors);
  return <View testID={testID} pointerEvents="none" accessible={false} style={[style as StyleProp<ViewStyle>, styles.clip]}>
    {loading.phase === 'layers' && <View style={[StyleSheet.absoluteFill, { opacity: loading.ready ? 1 : 0 }]}>
      {layers.map(layer => <Image key={`${layer.id}:${layer.asset}`} testID={testID ? `${testID}-layer-${layer.id}` : undefined}
        source={registry[layer.asset]} resizeMode={resizeMode} accessible={false} fadeDuration={0}
        style={[styles.layer, { opacity: layer.opacity, ...(layer.tintColor ? { tintColor: layer.tintColor } : {}) }]}
        onLoadEnd={() => loading.completeLayer(layer.id)} onError={loading.failLayer}/>)}
    </View>}
    {loading.phase === 'fallback' && <Image testID={testID ? `${testID}-fallback` : undefined} source={source}
      style={styles.layer} resizeMode={resizeMode} accessible={false} fadeDuration={0}
      onLoadEnd={loading.completeFallback} onError={loading.failFallback}/>}
    {loading.phase === 'failed' && <View style={[StyleSheet.absoluteFill, styles.error, { backgroundColor: theme.colors.canvas }]}><Text accessible={false} style={[typography.caption, { color: theme.colors.text, textAlign: 'center' }]}>{t('assetError', locale)}</Text></View>}
  </View>;
}
const styles = StyleSheet.create({ clip: { overflow: 'hidden' }, error: { alignItems: 'center', justifyContent: 'center', padding: 12 }, layer: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' } });
