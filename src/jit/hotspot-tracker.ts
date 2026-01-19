import type { ByteCode } from '../types';

export class HotspotTracker {
  private counts = new WeakMap<ByteCode, number>();

  record(bytecode: ByteCode): number {
    const next = (this.counts.get(bytecode) ?? 0) + 1;
    this.counts.set(bytecode, next);
    return next;
  }

  getCount(bytecode: ByteCode): number {
    return this.counts.get(bytecode) ?? 0;
  }
}
