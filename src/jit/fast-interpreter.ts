import type { ByteCode } from '../types';
import { CompareOp, OpCode } from '../types';
import type { VirtualMachine } from '../vm/vm';
import {
  Frame,
  PyDict,
  PyException,
  PyFunction,
  PyRange,
  PySet,
  PyValue,
} from '../vm/runtime-types';
import { callArgPools, fastIteratorSymbol } from '../vm/execution-shared';

const FAST_OPCODES = new Set<OpCode>([
  OpCode.LOAD_CONST,
  OpCode.LOAD_NAME,
  OpCode.STORE_NAME,
  OpCode.LOAD_FAST,
  OpCode.STORE_FAST,
  OpCode.LOAD_GLOBAL,
  OpCode.STORE_GLOBAL,
  OpCode.POP_TOP,
  OpCode.RETURN_VALUE,
  OpCode.CALL_FUNCTION,
  OpCode.MAKE_FUNCTION,
  OpCode.BUILD_LIST,
  OpCode.BUILD_TUPLE,
  OpCode.BUILD_SET,
  OpCode.BUILD_MAP,
  OpCode.LIST_APPEND,
  OpCode.SET_ADD,
  OpCode.MAP_ADD,
  OpCode.LOAD_ATTR,
  OpCode.LOAD_SUBSCR,
  OpCode.STORE_SUBSCR,
  OpCode.BINARY_ADD,
  OpCode.BINARY_SUBTRACT,
  OpCode.BINARY_MULTIPLY,
  OpCode.BINARY_DIVIDE,
  OpCode.BINARY_FLOOR_DIVIDE,
  OpCode.BINARY_MODULO,
  OpCode.BINARY_POWER,
  OpCode.INPLACE_ADD,
  OpCode.INPLACE_SUBTRACT,
  OpCode.INPLACE_MULTIPLY,
  OpCode.UNARY_NEGATIVE,
  OpCode.UNARY_POSITIVE,
  OpCode.UNARY_NOT,
  OpCode.COMPARE_OP,
  OpCode.JUMP_FORWARD,
  OpCode.JUMP_ABSOLUTE,
  OpCode.POP_JUMP_IF_FALSE,
  OpCode.POP_JUMP_IF_TRUE,
  OpCode.JUMP_IF_FALSE_OR_POP,
  OpCode.JUMP_IF_TRUE_OR_POP,
  OpCode.GET_ITER,
  OpCode.FOR_ITER,
]);

export const isFastPathSupported = (bytecode: ByteCode): boolean => {
  const cached = bytecode.jit?.fastPathSupported;
  if (cached !== undefined) return cached;
  if (bytecode.jit?.hasExceptionHandlers) {
    if (bytecode.jit) bytecode.jit.fastPathSupported = false;
    return false;
  }
  for (const instr of bytecode.instructions) {
    if (!FAST_OPCODES.has(instr.opcode)) {
      if (bytecode.jit) bytecode.jit.fastPathSupported = false;
      return false;
    }
  }
  if (bytecode.jit) {
    bytecode.jit.fastPathSupported = true;
  } else {
    bytecode.jit = { fastPathSupported: true };
  }
  return true;
};

const callArgPoolsTyped = callArgPools as PyValue[][][];

export function executeFrameFast(vm: VirtualMachine, frame: Frame): PyValue {
  const { instructions, constants, names, varnames } = frame.bytecode;
  const stack = frame.stack;
  const locals = frame.locals;
  const scope = frame.scope;
  const scopeValues = scope.values;
  const iterSymbol = Symbol.iterator;

  let lastValue: PyValue = null;

  const syncLocals = varnames ? varnames.map((name) => name !== undefined && scopeValues.has(name)) : null;
  const unsyncedLocals = syncLocals
    ? syncLocals.reduce((acc: number[], synced, index) => {
      if (!synced) acc.push(index);
      return acc;
    }, [])
    : null;
  let scopeValueSize = scopeValues.size;
  const refreshLocalsSync = () => {
    if (!syncLocals || !unsyncedLocals || unsyncedLocals.length === 0) return;
    if (scopeValues.size === scopeValueSize) return;
    scopeValueSize = scopeValues.size;
    for (let i = unsyncedLocals.length - 1; i >= 0; i--) {
      const idx = unsyncedLocals[i];
      const name = varnames[idx];
      if (name !== undefined && scopeValues.has(name)) {
        syncLocals[idx] = true;
        unsyncedLocals[i] = unsyncedLocals[unsyncedLocals.length - 1];
        unsyncedLocals.pop();
      }
    }
  };

  while (frame.pc < instructions.length) {
    const instr = instructions[frame.pc++];
    const opcode = instr.opcode;
    const arg = instr.arg;

    switch (opcode) {
      case OpCode.LOAD_FAST: {
        let val = locals[arg!];
        if (val === undefined) {
          refreshLocalsSync();
          if (syncLocals && syncLocals[arg!]) {
            val = scopeValues.get(varnames[arg!]!);
            locals[arg!] = val;
          } else if (varnames && varnames[arg!] !== undefined && scopeValues.has(varnames[arg!]!)) {
            if (syncLocals) syncLocals[arg!] = true;
            val = scopeValues.get(varnames[arg!]!);
            locals[arg!] = val;
          } else {
            const varname = varnames[arg!];
            throw new PyException('UnboundLocalError', `local variable '${varname}' referenced before assignment`);
          }
        }
        stack.push(val);
        break;
      }
      case OpCode.STORE_FAST: {
        const val = stack.pop();
        locals[arg!] = val;
        if (syncLocals) {
          refreshLocalsSync();
          if (syncLocals[arg!]) {
            scopeValues.set(varnames[arg!]!, val);
          }
        }
        break;
      }
      case OpCode.LOAD_CONST:
        stack.push(constants[arg!]);
        break;
      case OpCode.LOAD_NAME:
        stack.push(scope.get(names[arg!]));
        break;
      case OpCode.STORE_NAME:
        scope.set(names[arg!], stack.pop());
        break;
      case OpCode.LOAD_GLOBAL: {
        const name = names[arg!];
        let globalScope = scope;
        while (globalScope.parent !== null) globalScope = globalScope.parent;
        stack.push(globalScope.get(name));
        break;
      }
      case OpCode.STORE_GLOBAL: {
        const name = names[arg!];
        let globalScope = scope;
        while (globalScope.parent !== null) globalScope = globalScope.parent;
        globalScope.set(name, stack.pop());
        break;
      }
      case OpCode.POP_TOP:
        lastValue = stack.pop();
        break;
      case OpCode.RETURN_VALUE:
        return stack.pop();
      case OpCode.BINARY_ADD: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a + b);
        } else {
          stack.push(vm.applyBinary('+', a, b));
        }
        break;
      }
      case OpCode.BINARY_SUBTRACT: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a - b);
        } else {
          stack.push(vm.applyBinary('-', a, b));
        }
        break;
      }
      case OpCode.BINARY_MULTIPLY: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a * b);
        } else {
          stack.push(vm.applyBinary('*', a, b));
        }
        break;
      }
      case OpCode.BINARY_DIVIDE: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a / b);
        } else {
          stack.push(vm.applyBinary('/', a, b));
        }
        break;
      }
      case OpCode.BINARY_FLOOR_DIVIDE: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(Math.floor(a / b));
        } else {
          stack.push(vm.applyBinary('//', a, b));
        }
        break;
      }
      case OpCode.BINARY_MODULO: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a % b);
        } else {
          stack.push(vm.applyBinary('%', a, b));
        }
        break;
      }
      case OpCode.BINARY_POWER: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a ** b);
        } else {
          stack.push(vm.applyBinary('**', a, b));
        }
        break;
      }
      case OpCode.INPLACE_ADD: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a + b);
        } else {
          stack.push(vm.applyInPlaceBinary('+', a, b));
        }
        break;
      }
      case OpCode.INPLACE_SUBTRACT: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a - b);
        } else {
          stack.push(vm.applyInPlaceBinary('-', a, b));
        }
        break;
      }
      case OpCode.INPLACE_MULTIPLY: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a * b);
        } else {
          stack.push(vm.applyInPlaceBinary('*', a, b));
        }
        break;
      }
      case OpCode.UNARY_NEGATIVE: {
        const a = stack.pop();
        stack.push(-a as PyValue);
        break;
      }
      case OpCode.UNARY_POSITIVE: {
        const a = stack.pop();
        stack.push(+a as PyValue);
        break;
      }
      case OpCode.UNARY_NOT: {
        const a = stack.pop();
        stack.push(!vm.isTruthy(a, scope));
        break;
      }
      case OpCode.COMPARE_OP: {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          let result: boolean | undefined = undefined;
          switch (arg as CompareOp) {
            case CompareOp.LT: result = a < b; break;
            case CompareOp.LE: result = a <= b; break;
            case CompareOp.EQ: result = a === b; break;
            case CompareOp.NE: result = a !== b; break;
            case CompareOp.GT: result = a > b; break;
            case CompareOp.GE: result = a >= b; break;
          }
          if (result !== undefined) {
            stack.push(result);
          } else {
            stack.push(vm.applyCompare(arg as CompareOp, a, b));
          }
        } else {
          stack.push(vm.applyCompare(arg as CompareOp, a, b));
        }
        break;
      }
      case OpCode.POP_JUMP_IF_FALSE: {
        const val = stack.pop();
        let isFalse = false;
        if (typeof val === 'boolean') {
          isFalse = !val;
        } else if (typeof val === 'number') {
          isFalse = val === 0;
        } else if (val === null || val === undefined) {
          isFalse = true;
        } else {
          isFalse = !vm.isTruthy(val, scope);
        }
        if (isFalse) frame.pc = arg!;
        break;
      }
      case OpCode.POP_JUMP_IF_TRUE: {
        const val = stack.pop();
        let isTrue = false;
        if (typeof val === 'boolean') {
          isTrue = val;
        } else if (typeof val === 'number') {
          isTrue = val !== 0;
        } else if (val === null || val === undefined) {
          isTrue = false;
        } else {
          isTrue = vm.isTruthy(val, scope);
        }
        if (isTrue) frame.pc = arg!;
        break;
      }
      case OpCode.JUMP_IF_FALSE_OR_POP: {
        const val = stack[stack.length - 1];
        if (!vm.isTruthy(val, scope)) {
          frame.pc = arg!;
        } else {
          stack.pop();
        }
        break;
      }
      case OpCode.JUMP_IF_TRUE_OR_POP: {
        const val = stack[stack.length - 1];
        if (vm.isTruthy(val, scope)) {
          frame.pc = arg!;
        } else {
          stack.pop();
        }
        break;
      }
      case OpCode.JUMP_FORWARD:
        frame.pc += arg!;
        break;
      case OpCode.JUMP_ABSOLUTE:
        frame.pc = arg!;
        break;
      case OpCode.BUILD_LIST: {
        const items: PyValue[] = new Array(arg!);
        for (let i = arg! - 1; i >= 0; i--) items[i] = stack.pop();
        stack.push(items);
        break;
      }
      case OpCode.BUILD_TUPLE: {
        const items: PyValue[] = new Array(arg!);
        for (let i = arg! - 1; i >= 0; i--) items[i] = stack.pop();
        (items as PyValue).__tuple__ = true;
        stack.push(items);
        break;
      }
      case OpCode.BUILD_SET: {
        const set = new PySet();
        for (let i = 0; i < arg!; i++) set.add(stack.pop());
        stack.push(set);
        break;
      }
      case OpCode.BUILD_MAP: {
        const dict = new PyDict();
        for (let i = 0; i < arg!; i++) {
          const value = stack.pop();
          const key = stack.pop();
          dict.set(key, value);
        }
        stack.push(dict);
        break;
      }
      case OpCode.LIST_APPEND: {
        const val = stack.pop();
        const list = stack[stack.length - 1];
        if (Array.isArray(list)) list.push(val);
        else throw new PyException('TypeError', 'list.append on non-list');
        break;
      }
      case OpCode.SET_ADD: {
        const val = stack.pop();
        const set = stack[stack.length - 1];
        if (set instanceof PySet) set.add(val);
        else throw new PyException('TypeError', 'set.add on non-set');
        break;
      }
      case OpCode.MAP_ADD: {
        const val = stack.pop();
        const key = stack.pop();
        const map = stack[stack.length - 1];
        if (map instanceof PyDict) map.set(key, val);
        else throw new PyException('TypeError', 'dict add on non-dict');
        break;
      }
      case OpCode.LOAD_ATTR: {
        const obj = stack.pop();
        stack.push(vm.getAttribute(obj, names[arg!], scope));
        break;
      }
      case OpCode.LOAD_SUBSCR: {
        const index = stack.pop();
        const obj = stack.pop();
        stack.push(vm.getSubscript(obj, index));
        break;
      }
      case OpCode.STORE_SUBSCR: {
        const index = stack.pop();
        const obj = stack.pop();
        const val = stack.pop();
        if (Array.isArray(obj) && (obj as PyValue).__tuple__) {
          throw new PyException('TypeError', `'tuple' object does not support item assignment`);
        }
        if (Array.isArray(obj)) {
          obj[index] = val;
        } else if (obj instanceof PyDict) {
          obj.set(index, val);
        } else if (obj && typeof obj === 'object') {
          (obj as Record<string, PyValue>)[String(index)] = val;
        } else {
          throw new PyException('TypeError', `object does not support item assignment`);
        }
        break;
      }
      case OpCode.GET_ITER: {
        const obj = stack.pop();
        if (Array.isArray(obj)) {
          stack.push({ [fastIteratorSymbol]: 'array', data: obj, index: 0 });
        } else if (obj instanceof PyRange) {
          stack.push({ [fastIteratorSymbol]: 'range', current: obj.start, end: obj.end, step: obj.step });
        } else if (obj && typeof obj[iterSymbol] === 'function') {
          stack.push(obj[iterSymbol]());
        } else {
          throw new PyException('TypeError', `'${typeof obj}' object is not iterable`);
        }
        break;
      }
      case OpCode.FOR_ITER: {
        const iter = stack[stack.length - 1];
        if (iter && iter[fastIteratorSymbol] === 'array') {
          const idx = iter.index;
          if (idx >= iter.data.length) {
            stack.pop();
            frame.pc = arg!;
          } else {
            stack.push(iter.data[idx]);
            iter.index = idx + 1;
          }
          break;
        }
        if (iter && iter[fastIteratorSymbol] === 'range') {
          const current = iter.current;
          if (iter.step > 0 ? current < iter.end : current > iter.end) {
            stack.push(current);
            iter.current = current + iter.step;
          } else {
            stack.pop();
            frame.pc = arg!;
          }
          break;
        }
        const next = iter.next();
        if (next.done) {
          stack.pop();
          frame.pc = arg!;
        } else {
          stack.push(next.value);
        }
        break;
      }
      case OpCode.CALL_FUNCTION: {
        const argCount = arg!;
        const pool = argCount <= 4 ? callArgPoolsTyped[argCount] : null;
        const args = pool && pool.length > 0 ? pool.pop()! : new Array(argCount);
        for (let i = argCount - 1; i >= 0; i--) args[i] = stack.pop();
        const func = stack.pop();
        try {
          stack.push(vm.callFunction(func, args, scope));
        } finally {
          if (pool) {
            args.length = 0;
            pool.push(args);
          }
        }
        break;
      }
      case OpCode.MAKE_FUNCTION: {
        const defaultsCount = arg || 0;
        const name = stack.pop();
        const bc = stack.pop();
        const defaults: PyValue[] = new Array(defaultsCount);
        for (let i = defaultsCount - 1; i >= 0; i--) defaults[i] = stack.pop();
        const params = (bc && bc.params) ? bc.params.map((p: PyValue) => ({ ...p })) : [];
        if (params.length > 0 && defaultsCount > 0) {
          let defaultIndex = 0;
          for (let i = params.length - defaultsCount; i < params.length; i++) {
            if (params[i] && params[i].type === 'Param') {
              params[i].defaultEvaluated = defaults[defaultIndex++];
            }
          }
        }
        const isGenerator = !!(bc && (bc as PyValue).isGenerator);
        const body = (bc && (bc as PyValue).astBody) ? (bc as PyValue).astBody : [];
        const func = new PyFunction(name, params, body, frame.scope, isGenerator, new Set(), bc);
        func.closure_shared_values = frame.scope.values;
        stack.push(func);
        break;
      }
      default:
        return vm.executeFrameInterpreter(frame);
    }
  }

  return lastValue;
}
