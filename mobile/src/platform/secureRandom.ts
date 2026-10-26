import * as Crypto from 'expo-crypto';
import { createSecureRandomSource } from './secureRandomCore.ts';

// Expo supplies platform cryptographic entropy. Failures propagate to the controller.
export const secureRandomSource = createSecureRandomSource({
  getRandomValues: Crypto.getRandomValues,
});
