import type { ByteCode } from '../types';

export type ProfileSnapshot = {
  executions: number;
};

export class ProfileCollector {
  private counts = new WeakMap<ByteCode, number>();

  record(bytecode: ByteCode): void {
    const next = (this.counts.get(bytecode) ?? 0) + 1;
    this.counts.set(bytecode, next);
  }

  snapshot(bytecode: ByteCode): ProfileSnapshot {
    return { executions: this.counts.get(bytecode) ?? 0 };
  }
}
