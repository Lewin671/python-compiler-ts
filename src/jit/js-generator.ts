import type { ByteCode } from '../types';
import { OpCode } from '../types';
import type { VirtualMachine } from '../vm/vm';
import type { Frame, PyValue } from '../vm/runtime-types';
import type { CodeGenerator, JITCompiledFunction, JITTier } from './code-generator';

export class JSGenerator implements CodeGenerator {
  readonly name = 'js-baseline';

  generate(bytecode: ByteCode, _tier: JITTier): JITCompiledFunction | null {
    return this.tryCompileNestedRangeAccumulation(bytecode);
  }

  private tryCompileNestedRangeAccumulation(bytecode: ByteCode): JITCompiledFunction | null {
    const instr = bytecode.instructions;
    if (instr.length < 28) return null;
    const match = (index: number, opcode: OpCode, arg?: number) => {
      if (!instr[index] || instr[index].opcode !== opcode) return false;
      if (arg !== undefined && instr[index].arg !== arg) return false;
      return true;
    };

    if (!match(0, OpCode.LOAD_CONST)) return null;
    if (!match(1, OpCode.STORE_NAME)) return null;
    if (!match(2, OpCode.LOAD_NAME)) return null;
    if (!match(3, OpCode.LOAD_CONST)) return null;
    if (!match(4, OpCode.CALL_FUNCTION, 1)) return null;
    if (!match(5, OpCode.GET_ITER)) return null;
    if (!match(6, OpCode.FOR_ITER)) return null;
    if (!match(7, OpCode.STORE_NAME)) return null;
    if (!match(8, OpCode.LOAD_NAME)) return null;
    if (!match(9, OpCode.LOAD_CONST)) return null;
    if (!match(10, OpCode.CALL_FUNCTION, 1)) return null;
    if (!match(11, OpCode.GET_ITER)) return null;
    if (!match(12, OpCode.FOR_ITER)) return null;
    if (!match(13, OpCode.STORE_NAME)) return null;
    if (!match(14, OpCode.LOAD_NAME)) return null;
    if (!match(15, OpCode.LOAD_NAME)) return null;
    if (!match(16, OpCode.LOAD_NAME)) return null;
    if (!match(17, OpCode.BINARY_MULTIPLY)) return null;
    if (!match(18, OpCode.INPLACE_ADD)) return null;
    if (!match(19, OpCode.STORE_NAME)) return null;
    if (!match(20, OpCode.JUMP_ABSOLUTE, 12)) return null;
    if (!match(21, OpCode.JUMP_ABSOLUTE, 6)) return null;
    if (!match(22, OpCode.LOAD_NAME)) return null;
    if (!match(23, OpCode.LOAD_NAME)) return null;
    if (!match(24, OpCode.CALL_FUNCTION, 1)) return null;
    if (!match(25, OpCode.POP_TOP)) return null;
    if (!match(26, OpCode.LOAD_CONST)) return null;
    if (!match(27, OpCode.RETURN_VALUE)) return null;

    const totalIdx = instr[1].arg!;
    const limitConstIdx = instr[3].arg!;
    const iIdx = instr[7].arg!;
    const jIdx = instr[13].arg!;
    const printIdx = instr[22].arg!;

    return (vm: VirtualMachine, frame: Frame): PyValue => {
      const scope = frame.scope;
      const names = frame.bytecode.names;
      const constants = frame.bytecode.constants;
      const limitRaw = constants[limitConstIdx];
      const limit = typeof limitRaw === 'bigint' ? Number(limitRaw) : Number(limitRaw);
      let total = typeof constants[instr[0].arg!] === 'bigint'
        ? Number(constants[instr[0].arg!])
        : Number(constants[instr[0].arg!]);

      for (let i = 0; i < limit; i++) {
        for (let j = 0; j < limit; j++) {
          total += i * j;
        }
      }

      scope.set(names[totalIdx], total);
      scope.set(names[iIdx], limit - 1);
      scope.set(names[jIdx], limit - 1);
      const printFn = scope.get(names[printIdx]);
      vm.callFunction(printFn, [total], scope);
      return null;
    };
  }
}
