import type { ByteCode } from '../types';
import type { VirtualMachine } from '../vm/vm';
import type { Frame, PyValue } from '../vm/runtime-types';
import type { CodeGenerator, JITCompiledFunction, JITTier } from './code-generator';

export class LLVMGenerator implements CodeGenerator {
  readonly name = 'llvm-baseline';

  generate(_bytecode: ByteCode, _tier: JITTier): JITCompiledFunction | null {
    return (vm: VirtualMachine, frame: Frame): PyValue => vm.executeFrameInterpreter(frame);
  }
}
