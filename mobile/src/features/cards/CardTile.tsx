import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Card, CardId, Locale } from '../../domain/contracts';
import { localizeCard } from '../../domain/deck';
import type { AssetRegistry } from '../../decks/assets';
import { validRect, type Rect } from './overlayGeometry';
import { t } from '../../i18n/locale';

export type TileOrigin = {
  rect: { x: number; y: number; width: number; height: number } | null;
  scrollKey: string;
};

export function CardFace({ card, locale, assetRegistry, testID, onLoadEnd }: {
  card: Card; locale: Locale; assetRegistry: AssetRegistry; testID: string; onLoadEnd?: () => void;
}) {
  const content = localizeCard(card, locale), source = assetRegistry[content.faceAsset];
  const [failedAsset, setFailedAsset] = useState<string | null>(null);
  useEffect(() => { if (!source) onLoadEnd?.(); }, [source, onLoadEnd]);
  const size = source ? Image.resolveAssetSource(source) : null;
  const width = size?.width ?? 238, height = size?.height ?? 358;
  const aspectRatio = width > 0 && height > 0 ? width / height : 238 / 358;
  return failedAsset === content.faceAsset || !source
    ? <View style={[styles.missing, { aspectRatio }]}><Text style={styles.caption}>{t('assetError', locale)}</Text></View>
    : <Image testID={testID} source={source} resizeMode="contain" accessible={false} fadeDuration={0} onLoadEnd={onLoadEnd}
      // Image supplies the asset's intrinsic height; clear it so Yoga sizes the face from its tile width.
      style={{ width: '100%', height: undefined, aspectRatio }} onError={() => { setFailedAsset(content.faceAsset); onLoadEnd?.(); }} />;
}

export type CardTileHandle = { measure: (callback: (rect: Rect | null) => void) => void; focus: () => void };
export const CardTile = forwardRef<CardTileHandle, {
  card: Card; locale: Locale; assetRegistry: AssetRegistry; width: number; scrollKey: string;
  onOpen: (id: CardId, origin: TileOrigin) => void; active?: boolean; hidden?: boolean;
}>(function CardTile({ card, locale, assetRegistry, width, scrollKey, onOpen, active = true, hidden = false }, ref) {
  const face = useRef<ComponentRef<typeof View>>(null), content = localizeCard(card, locale);
  const button = useRef<ComponentRef<typeof View>>(null);
  const pending = useRef(new Set<() => void>());
  useImperativeHandle(ref, () => ({
    measure(callback) {
      let done = false;
      const finish = (rect: Rect | null) => {
        if (done) return;
        done = true; clearTimeout(timer); pending.current.delete(cancel); callback(rect);
      };
      const cancel = () => finish(null);
      const timer = setTimeout(cancel, 120);
      pending.current.add(cancel);
      if (!face.current) { cancel(); return; }
      face.current.measureInWindow((x, y, width, height) => {
        const rect = { x, y, width, height }; finish(validRect(rect) ? rect : null);
      });
    },
    focus() {
      button.current?.focus();
      const node = findNodeHandle(button.current);
      if (node != null) AccessibilityInfo.setAccessibilityFocus(node);
    },
  }), []);
  useEffect(() => () => { for (const cancel of pending.current) cancel(); }, []);
  const currentOnOpen = useRef(onOpen);
  useLayoutEffect(() => { currentOnOpen.current = onOpen; }, [onOpen]);
  const measurement = useRef<{ rect: TileOrigin['rect']; complete: boolean; open: boolean } | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutIfNeeded = () => { if (timeout.current !== null) clearTimeout(timeout.current); timeout.current = null; };
  useEffect(() => () => {
    if (timeout.current !== null) clearTimeout(timeout.current);
    measurement.current = null;
  }, []);
  useEffect(() => {
    if (!active) { clearTimeoutIfNeeded(); measurement.current = null; }
  }, [active]);
  const finish = (request: NonNullable<typeof measurement.current>) => {
    if (measurement.current !== request) return;
    clearTimeoutIfNeeded();
    measurement.current = null;
    currentOnOpen.current(card.id, { rect: request.rect, scrollKey });
  };
  const measure = () => {
    if (!active) return;
    if (measurement.current?.open) return;
    clearTimeoutIfNeeded();
    // Keep this touch's request until its asynchronous native measurement arrives.
    const request = { rect: null as TileOrigin['rect'], complete: false, open: false };
    measurement.current = request;
    face.current?.measureInWindow((x, y, width, height) => {
      if (measurement.current !== request) return;
      request.rect = [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0 ? { x, y, width, height } : null;
      request.complete = true;
      if (request.open) finish(request);
    });
  };
  const open = () => {
    if (!active) return;
    const request = measurement.current;
    if (request?.open) return;
    clearTimeoutIfNeeded();
    // Accessibility activation has no touch-down measurement; use the safe fade.
    if (!request) { onOpen(card.id, { rect: null, scrollKey }); return; }
    request.open = true;
    if (request.complete) finish(request);
    else timeout.current = setTimeout(() => finish(request), 120);
  };
  return <Pressable ref={button} testID={`card-tile-${card.id}`} accessibilityRole="button" accessibilityLabel={content.name}
    onPressIn={measure} onPress={open} onPressOut={() => {
      // Pressability calls onPress in this release turn; discard canceled touches afterward.
      if (!measurement.current?.open) timeout.current = setTimeout(() => { measurement.current = null; }, 0);
    }}
    style={({ pressed }) => ({ width, minHeight: 48, opacity: pressed ? 0.8 : 1 })}>
    <View testID={`card-face-host-${card.id}`} ref={face} collapsable={false} style={{ opacity: hidden ? 0 : 1 }}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`card-face-${card.id}`} />
    </View>
    <Text style={styles.caption}>{content.name}</Text>
  </Pressable>;
});
const styles = StyleSheet.create({
  caption: { color: '#252923', fontSize: 18, lineHeight: 26, paddingTop: 8 },
  missing: { width: '100%', justifyContent: 'center', backgroundColor: '#e7e5de', padding: 12 },
});
