import {useContext} from 'react';
import {BottomTabBarHeightContext} from 'expo-router/js-tabs';

/** Standalone previews have no tab bar to clear. */
export function useDockHeight() {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
