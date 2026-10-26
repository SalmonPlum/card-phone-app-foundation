import type { CardId } from './contracts.ts';

export type RandomSource = { nextUint32(): number };
const UINT32_RANGE = 0x100000000;

/** Uniform sample in [0, n); never uses a biased modulo of the rejected tail. */
export function randomInt(n: number, source: RandomSource): number {
  if (!Number.isSafeInteger(n) || n < 1 || n > UINT32_RANGE) throw new RangeError('Random bound must be an integer from 1 through 2^32');
  if (n === 1) return 0;
  const limit = Math.floor(UINT32_RANGE / n) * n;
  for (;;) {
    const word = source.nextUint32();
    if (!Number.isInteger(word) || word < 0 || word >= UINT32_RANGE) throw new RangeError('Random source must return an unsigned uint32');
    if (word < limit) return word % n;
  }
}

/** Copying downward Fisher–Yates. Each call obtains fresh entropy from source. */
export function shuffleIds(ids: readonly CardId[], source: RandomSource): CardId[] {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const chosen = randomInt(index + 1, source);
    [shuffled[index], shuffled[chosen]] = [shuffled[chosen], shuffled[index]];
  }
  return shuffled;
}
