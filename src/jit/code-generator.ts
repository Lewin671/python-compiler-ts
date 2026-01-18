import type { ByteCode } from '../types';
import type { VirtualMachine } from '../vm/vm';
import type { Frame, PyValue } from '../vm/runtime-types';

export type JITTier = 'tier0' | 'tier1' | 'tier2';
export type JITCompiledFunction = (vm: VirtualMachine, frame: Frame) => PyValue;

export interface CodeGenerator {
  readonly name: string;
  generate(bytecode: ByteCode, tier: JITTier, profile?: unknown): JITCompiledFunction | null;
}
