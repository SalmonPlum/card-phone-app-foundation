import { Easing, withTiming, type EntryAnimationsValues, type ExitAnimationsValues,
  type LayoutAnimationFunction, type SharedValue, type AnimationObject, type WithTimingConfig } from 'react-native-reanimated';
import type { Rect } from './overlayGeometry';
import { SEARCH_FADE_DURATION, SEARCH_MOVE_DURATION } from './searchMotionTiming';

export type SearchMotionState = { deadline: number; ids: number[] };
export type SearchMotionControl = Pick<SharedValue<SearchMotionState>, 'value'>;

/** Layout timing owns its native frame loop, so cancellation must be observed there. */
function searchTiming(target: number, config: WithTimingConfig, control: SearchMotionControl) {
  'worklet';
  const deadline = control.value.deadline;
  const animation = withTiming(target, config) as unknown as AnimationObject<number>;
  const frame = animation.onFrame;
  animation.onFrame = (current: AnimationObject<number>, now: number) => {
    'worklet';
    if (control.value.deadline !== deadline || control.value.deadline === 0) {
      current.current = target;
      return true;
    }
    return frame(current, now);
  };
  return animation as unknown as number;
}

/** A retained card may remount under another FlatList row; use its previous screen position. */
export function searchCardEntering(origin: Rect | undefined, control: SearchMotionControl) {
  return (values: EntryAnimationsValues) => {
    'worklet';
    const moving = Date.now() < control.value.deadline;
    const from = moving ? origin : undefined;
    return {
      initialValues: {
        opacity: moving && !from ? 0 : 1,
        originX: values.targetOriginX + (from ? from.x - values.targetGlobalOriginX : 0),
        originY: values.targetOriginY + (from ? from.y - values.targetGlobalOriginY : 0),
      },
      animations: {
        opacity: moving && !from ? searchTiming(1, { duration: SEARCH_FADE_DURATION }, control) : 1,
        originX: from ? searchTiming(values.targetOriginX, { duration: SEARCH_MOVE_DURATION, easing: Easing.out(Easing.cubic) }, control) : values.targetOriginX,
        originY: from ? searchTiming(values.targetOriginY, { duration: SEARCH_MOVE_DURATION, easing: Easing.out(Easing.cubic) }, control) : values.targetOriginY,
      },
    };
  };
}

export function searchCardExiting(id: number, control: SearchMotionControl) {
  return (_values: ExitAnimationsValues) => {
    'worklet';
    // A cross-row retained card has a new native copy: only that copy should move.
    const leaving = Date.now() < control.value.deadline && !control.value.ids.includes(id);
    return { initialValues: { opacity: leaving ? 1 : 0 },
      animations: { opacity: leaving ? searchTiming(0, { duration: SEARCH_FADE_DURATION }, control) : 0 } };
  };
}

/** Rows with unchanged membership keep their children and animate as a unit. */
export function searchRowLayout(control: SearchMotionControl): LayoutAnimationFunction {
  return values => {
    'worklet';
    const moving = Date.now() < control.value.deadline;
    return {
      initialValues: { originX: moving ? values.currentOriginX : values.targetOriginX,
        originY: moving ? values.currentOriginY : values.targetOriginY,
        width: values.targetWidth, height: values.targetHeight },
      animations: {
        originX: moving ? searchTiming(values.targetOriginX, { duration: SEARCH_MOVE_DURATION, easing: Easing.out(Easing.cubic) }, control) : values.targetOriginX,
        originY: moving ? searchTiming(values.targetOriginY, { duration: SEARCH_MOVE_DURATION, easing: Easing.out(Easing.cubic) }, control) : values.targetOriginY,
        width: values.targetWidth, height: values.targetHeight,
      },
    };
  };
}
