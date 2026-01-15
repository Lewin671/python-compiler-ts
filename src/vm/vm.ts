import { ByteCode, OpCode } from '../types';

/**
 * 虚拟机 - 执行字节码
 */
export class VirtualMachine {
  execute(bytecode: ByteCode): any {
    const stack: any[] = [];
    const names: Map<string, any> = new Map();
    let ip = 0; // Instruction pointer

    const instructions = bytecode.instructions;
    const constants = bytecode.constants;
    const nameList = bytecode.names;

    while (ip < instructions.length) {
      const instruction = instructions[ip];
      ip++;

      switch (instruction.opcode) {
        case OpCode.LOAD_CONST: {
          if (instruction.arg === undefined) {
            throw new Error('LOAD_CONST requires an argument');
          }
          stack.push(constants[instruction.arg]);
          break;
        }

        case OpCode.LOAD_NAME: {
          if (instruction.arg === undefined) {
            throw new Error('LOAD_NAME requires an argument');
          }
          const name = nameList[instruction.arg];
          if (!names.has(name)) {
            throw new Error(`Name '${name}' is not defined`);
          }
          stack.push(names.get(name));
          break;
        }

        case OpCode.STORE_NAME: {
          if (instruction.arg === undefined) {
            throw new Error('STORE_NAME requires an argument');
          }
          if (stack.length === 0) {
            throw new Error('Stack underflow in STORE_NAME');
          }
          const value = stack.pop();
          const name = nameList[instruction.arg];
          names.set(name, value);
          break;
        }

        case OpCode.BINARY_ADD: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_ADD');
          }
          const right = stack.pop();
          const left = stack.pop();

          // Handle string concatenation
          if (typeof left === 'string' || typeof right === 'string') {
            stack.push(String(left) + String(right));
          } else {
            stack.push(left + right);
          }
          break;
        }

        case OpCode.BINARY_SUBTRACT: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_SUBTRACT');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left - right);
          break;
        }

        case OpCode.BINARY_MULTIPLY: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_MULTIPLY');
          }
          const right = stack.pop();
          const left = stack.pop();

          // Handle string repetition
          if (typeof left === 'string' && typeof right === 'number') {
            stack.push(left.repeat(right));
          } else if (typeof left === 'number' && typeof right === 'string') {
            stack.push(right.repeat(left));
          } else {
            stack.push(left * right);
          }
          break;
        }

        case OpCode.BINARY_DIVIDE: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_DIVIDE');
          }
          const right = stack.pop();
          const left = stack.pop();
          if (right === 0) {
            throw new Error('Division by zero');
          }
          stack.push(left / right);
          break;
        }

        case OpCode.BINARY_MODULO: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_MODULO');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left % right);
          break;
        }

        case OpCode.BINARY_POWER: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in BINARY_POWER');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(Math.pow(left, right));
          break;
        }

        case OpCode.COMPARE_EQ: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_EQ');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left === right);
          break;
        }

        case OpCode.COMPARE_NE: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_NE');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left !== right);
          break;
        }

        case OpCode.COMPARE_LT: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_LT');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left < right);
          break;
        }

        case OpCode.COMPARE_GT: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_GT');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left > right);
          break;
        }

        case OpCode.COMPARE_LE: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_LE');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left <= right);
          break;
        }

        case OpCode.COMPARE_GE: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in COMPARE_GE');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left >= right);
          break;
        }

        case OpCode.LOGICAL_AND: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in LOGICAL_AND');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left && right);
          break;
        }

        case OpCode.LOGICAL_OR: {
          if (stack.length < 2) {
            throw new Error('Stack underflow in LOGICAL_OR');
          }
          const right = stack.pop();
          const left = stack.pop();
          stack.push(left || right);
          break;
        }

        case OpCode.LOGICAL_NOT: {
          if (stack.length < 1) {
            throw new Error('Stack underflow in LOGICAL_NOT');
          }
          const operand = stack.pop();
          stack.push(!operand);
          break;
        }

        case OpCode.PRINT_ITEM: {
          if (stack.length === 0) {
            throw new Error('Stack underflow in PRINT_ITEM');
          }
          const value = stack.pop();
          process.stdout.write(String(value));
          break;
        }

        case OpCode.PRINT_NEWLINE: {
          process.stdout.write('\n');
          break;
        }

        case OpCode.CALL_FUNCTION: {
          // For now, we don't support user-defined functions
          // This would be implemented later
          throw new Error('CALL_FUNCTION not implemented yet');
        }

        case OpCode.RETURN_VALUE: {
          // For now, we don't support return statements
          // This would be implemented later
          throw new Error('RETURN_VALUE not implemented yet');
        }

        default:
          throw new Error(`Unknown opcode: ${instruction.opcode}`);
      }
    }

    // Return the last value on the stack, if any
    return stack.length > 0 ? stack[stack.length - 1] : undefined;
  }
}
