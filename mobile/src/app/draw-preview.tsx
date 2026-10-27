import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';

export default function LegacyDrawPreview() {
  useFocusEffect(useCallback(() => {
    // Reuse warm tabs; dismissTo also replaces a cold legacy entry when absent.
    router.dismissTo('/');
  }, []));
  return null;
}
