import { fireEvent } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

/** Deliver the native completion boundary for each image actually rendered. */
export async function loadArtwork(root: TestInstance) {
  const images = root.type === 'Image' ? [root] : root.queryAll(node => node.type === 'Image');
  for (const image of images) await fireEvent(image, 'loadEnd');
}
export async function failArtwork(root: TestInstance) {
  const images = root.type === 'Image' ? [root] : root.queryAll(node => node.type === 'Image');
  await fireEvent(images[0], 'error');
  if (root.type !== 'Image') {
    const fallback = root.queryAll(node => node.type === 'Image')[0];
    if (fallback) await fireEvent(fallback, 'error');
  }
}
