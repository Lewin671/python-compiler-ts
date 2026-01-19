import type { ByteCode } from '../types';
import { OpCode } from '../types';
import type { VirtualMachine } from '../vm/vm';
import type { Frame, PyValue } from '../vm/runtime-types';
import type { CodeGenerator, JITCompiledFunction, JITTier } from './code-generator';
import { HotspotTracker } from './hotspot-tracker';
import { ProfileCollector } from './profile-collector';
import { LLVMGenerator } from './llvm-generator';
import { JSGenerator } from './js-generator';

export type JITExecutionResult = { handled: true; value: PyValue } | { handled: false };

export type JITManagerOptions = {
  enabled?: boolean;
  baselineThreshold?: number;
  optimizingThreshold?: number;
  baselineGenerator?: CodeGenerator;
  optimizingGenerator?: CodeGenerator;
};

export class JITManager {
  private enabled: boolean;
  private baselineThreshold: number;
  private optimizingThreshold: number;
  private compiled = new WeakMap<ByteCode, JITCompiledFunction>();
  private tierMap = new WeakMap<ByteCode, JITTier>();
  private failed = new WeakSet<ByteCode>();
  private hotspotTracker = new HotspotTracker();
  private profileCollector = new ProfileCollector();
  private baselineGenerator: CodeGenerator;
  private optimizingGenerator: CodeGenerator;

  constructor(options: JITManagerOptions = {}) {
    const envValue = process.env['PYTHON_VM_JIT'];
    const envEnabled = envValue === undefined ? true : parseBoolean(envValue);
    this.enabled = options.enabled ?? envEnabled;
    this.baselineThreshold = options.baselineThreshold ?? parseIntEnv('PYTHON_VM_JIT_BASELINE_THRESHOLD', 1);
    this.optimizingThreshold = options.optimizingThreshold ?? parseIntEnv('PYTHON_VM_JIT_OPT_THRESHOLD', 20000);
    this.baselineGenerator = options.baselineGenerator ?? new JSGenerator();
    this.optimizingGenerator = options.optimizingGenerator ?? new LLVMGenerator();
  }

  static fromEnv(): JITManager | null {
    const envValue = process.env['PYTHON_VM_JIT'];
    if (envValue === undefined) {
      return new JITManager({ enabled: true });
    }
    const enabled = parseBoolean(envValue);
    if (!enabled) return null;
    return new JITManager({ enabled: true });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getCompiled(bytecode: ByteCode): JITCompiledFunction | undefined {
    return this.compiled.get(bytecode);
  }

  onEnterFrame(vm: VirtualMachine, frame: Frame): JITExecutionResult {
    if (!this.enabled) return { handled: false };
    const bytecode = frame.bytecode;

    this.prepareBytecode(bytecode);

    if (this.failed.has(bytecode)) {
      return { handled: false };
    }

    const compiled = this.compiled.get(bytecode);
    if (compiled) {
      return this.executeCompiled(vm, frame, compiled);
    }

    const execCount = this.hotspotTracker.record(bytecode);
    this.profileCollector.record(bytecode);

    const tier = this.tierMap.get(bytecode) ?? 'tier0';

    if (tier === 'tier0' && execCount >= this.baselineThreshold) {
      const next = this.tryCompile(vm, frame, 'tier1');
      if (next.handled) return next;
    }

    if (tier === 'tier1' && execCount >= this.optimizingThreshold) {
      const next = this.tryCompile(vm, frame, 'tier2');
      if (next.handled) return next;
    }

    return { handled: false };
  }

  private tryCompile(vm: VirtualMachine, frame: Frame, tier: JITTier): JITExecutionResult {
    const bytecode = frame.bytecode;
    try {
      const profile = this.profileCollector.snapshot(bytecode);
      const generator = tier === 'tier2' ? this.optimizingGenerator : this.baselineGenerator;
      const compiled = generator.generate(bytecode, tier, profile);
      if (!compiled) return { handled: false };
      this.compiled.set(bytecode, compiled);
      this.tierMap.set(bytecode, tier);
      return this.executeCompiled(vm, frame, compiled);
    } catch {
      this.failed.add(bytecode);
      return { handled: false };
    }
  }

  private executeCompiled(vm: VirtualMachine, frame: Frame, compiled: JITCompiledFunction): JITExecutionResult {
    return { handled: true, value: compiled(vm, frame) };
  }

  private prepareBytecode(bytecode: ByteCode): void {
    const existing = bytecode.jit;
    if (existing?.opcodes && existing?.args && existing?.hasExceptionHandlers !== undefined) return;

    const instructions = bytecode.instructions;
    const length = instructions.length;
    const opcodes = existing?.opcodes ?? new Uint16Array(length);
    const args = existing?.args ?? new Int32Array(length);
    let hasExceptionHandlers = existing?.hasExceptionHandlers;

    if (hasExceptionHandlers === undefined) hasExceptionHandlers = false;

    for (let i = 0; i < length; i++) {
      const instr = instructions[i];
      opcodes[i] = instr.opcode;
      args[i] = instr.arg ?? 0;
      if (!hasExceptionHandlers) {
        switch (instr.opcode) {
          case OpCode.SETUP_FINALLY:
          case OpCode.SETUP_WITH:
          case OpCode.WITH_EXCEPT_START:
          case OpCode.POP_BLOCK:
            hasExceptionHandlers = true;
            break;
          default:
            break;
        }
      }
    }

    bytecode.jit = {
      ...existing,
      opcodes,
      args,
      hasExceptionHandlers,
    };
  }
}

const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
};

const parseIntEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
