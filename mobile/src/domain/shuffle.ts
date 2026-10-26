import { randomInt } from './random.ts';
import type { RandomSource } from './random.ts';

/** The same bound applies to controller sampling and boundary validation. */
export function packetSizeLimit(sourceCount: number, remainingCount: number, firstPacket: boolean): number {
  if (!Number.isSafeInteger(sourceCount) || !Number.isSafeInteger(remainingCount)
    || sourceCount < 1 || remainingCount < sourceCount) {
    throw new RangeError('Packet counts must be positive integers with source within remaining');
  }
  return Math.min(3, Math.ceil(remainingCount / 3), sourceCount, firstPacket && sourceCount > 1 ? sourceCount - 1 : sourceCount);
}

/** Packet scheduling takes its own entropy, independently of the initial order. */
export function choosePacketSize(sourceCount: number, remainingCount: number, firstPacket: boolean, source: RandomSource): number {
  return 1 + randomInt(packetSizeLimit(sourceCount, remainingCount, firstPacket), source);
}
