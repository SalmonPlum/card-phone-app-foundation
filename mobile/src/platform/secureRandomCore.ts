import type { RandomSource } from '../domain/random.ts';

export type CryptoFacade = { getRandomValues<T extends Uint32Array>(array: T): T };

/** The injected boundary keeps native Crypto out of framework-free domain tests. */
export function createSecureRandomSource(crypto: CryptoFacade): RandomSource {
  return {
    nextUint32() {
      const sample = new Uint32Array(1);
      crypto.getRandomValues(sample);
      return sample[0];
    },
  };
}
