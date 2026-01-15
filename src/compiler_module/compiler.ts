import { ASTNode, ASTNodeType, ByteCode, OpCode } from '../types';

/**
 * 编译器 - 将 AST 编译为字节码
 */
export class Compiler {
  compile(ast: ASTNode): ByteCode {
    const instructions: any[] = [];
    const constants: any[] = [];
    const names: string[] = [];
    const nameIndices: Map<string, number> = new Map();

    // Helper function to add a constant
    const addConstant = (value: any): number => {
      const index = constants.indexOf(value);
      if (index !== -1) return index;
      constants.push(value);
      return constants.length - 1;
    };

    // Helper function to add a name
    const addName = (name: string): number => {
      if (!nameIndices.has(name)) {
        nameIndices.set(name, names.length);
        names.push(name);
      }
      return nameIndices.get(name)!;
    };

    // Helper function to emit an instruction
    const emit = (opcode: OpCode, arg?: number) => {
      instructions.push({ opcode, arg });
    };

    // Compile a number literal
    const compileNumberLiteral = (node: ASTNode) => {
      const constIndex = addConstant(node.value);
      emit(OpCode.LOAD_CONST, constIndex);
    };

    // Compile a string literal
    const compileStringLiteral = (node: ASTNode) => {
      const constIndex = addConstant(node.value);
      emit(OpCode.LOAD_CONST, constIndex);
    };

    // Compile a boolean literal
    const compileBooleanLiteral = (node: ASTNode) => {
      const constIndex = addConstant(node.value);
      emit(OpCode.LOAD_CONST, constIndex);
    };

    // Compile an identifier
    const compileIdentifier = (node: ASTNode) => {
      const nameIndex = addName(node.name);
      emit(OpCode.LOAD_NAME, nameIndex);
    };

    // Compile a binary operation
    const compileBinaryOperation = (node: ASTNode) => {
      // Compile left operand
      compileExpression(node.left);

      // Compile right operand
      compileExpression(node.right);

      // Emit the appropriate binary operation
      switch (node.operator) {
        case '+':
          emit(OpCode.BINARY_ADD);
          break;
        case '-':
          emit(OpCode.BINARY_SUBTRACT);
          break;
        case '*':
          emit(OpCode.BINARY_MULTIPLY);
          break;
        case '/':
          emit(OpCode.BINARY_DIVIDE);
          break;
        case '%':
          emit(OpCode.BINARY_MODULO);
          break;
        case '**':
          emit(OpCode.BINARY_POWER);
          break;
        case '==':
          emit(OpCode.COMPARE_EQ);
          break;
        case '!=':
          emit(OpCode.COMPARE_NE);
          break;
        case '<':
          emit(OpCode.COMPARE_LT);
          break;
        case '>':
          emit(OpCode.COMPARE_GT);
          break;
        case '<=':
          emit(OpCode.COMPARE_LE);
          break;
        case '>=':
          emit(OpCode.COMPARE_GE);
          break;
        case 'and':
          emit(OpCode.LOGICAL_AND);
          break;
        case 'or':
          emit(OpCode.LOGICAL_OR);
          break;
        case 'not':
          // This shouldn't be reached for binary operations
          throw new Error('not operator should be UNARY_OPERATION');
        default:
          throw new Error(`Unsupported binary operator: ${node.operator}`);
      }
    };

    // Compile a unary operation
    const compileUnaryOperation = (node: ASTNode) => {
      // Compile the operand
      compileExpression(node.operand);

      // Emit the appropriate unary operation
      switch (node.operator) {
        case 'not':
          emit(OpCode.LOGICAL_NOT);
          break;
        default:
          throw new Error(`Unsupported unary operator: ${node.operator}`);
      }
    };

    // Compile an expression
    const compileExpression = (node: ASTNode) => {
      switch (node.type) {
        case ASTNodeType.NUMBER_LITERAL:
          compileNumberLiteral(node);
          break;
        case ASTNodeType.STRING_LITERAL:
          compileStringLiteral(node);
          break;
        case ASTNodeType.BOOLEAN_LITERAL:
          compileBooleanLiteral(node);
          break;
        case ASTNodeType.IDENTIFIER:
          compileIdentifier(node);
          break;
        case ASTNodeType.BINARY_OPERATION:
          compileBinaryOperation(node);
          break;
        case ASTNodeType.UNARY_OPERATION:
          compileUnaryOperation(node);
          break;
        case ASTNodeType.LIST_LITERAL:
          // For now, just compile an empty list
          const emptyListIndex = addConstant([]);
          emit(OpCode.LOAD_CONST, emptyListIndex);
          break;
        default:
          throw new Error(`Unsupported expression type: ${node.type}`);
      }
    };

    // Compile a print statement
    const compilePrintStatement = (node: ASTNode) => {
      for (let i = 0; i < node.args.length; i++) {
        compileExpression(node.args[i]);
        emit(OpCode.PRINT_ITEM);
        if (i < node.args.length - 1) {
          // Add space between items (Python print adds space by default)
          const spaceIndex = addConstant(' ');
          emit(OpCode.LOAD_CONST, spaceIndex);
          emit(OpCode.PRINT_ITEM);
        }
      }
      emit(OpCode.PRINT_NEWLINE);
    };

    // Compile an assignment
    const compileAssignment = (node: ASTNode) => {
      // Compile the value
      compileExpression(node.value);

      // Store in the variable
      const nameIndex = addName(node.identifier);
      emit(OpCode.STORE_NAME, nameIndex);
    };

    // Compile a statement
    const compileStatement = (node: ASTNode) => {
      switch (node.type) {
        case ASTNodeType.PRINT_STATEMENT:
          compilePrintStatement(node);
          break;
        case ASTNodeType.ASSIGNMENT:
          compileAssignment(node);
          break;
        case ASTNodeType.EXPRESSION_STATEMENT:
          compileExpression(node.expression);
          // Pop the result since we don't use it
          // (In a real implementation, we might want to keep it)
          break;
        default:
          throw new Error(`Unsupported statement type: ${node.type}`);
      }
    };

    // Compile the program
    if (ast.type !== ASTNodeType.PROGRAM) {
      throw new Error(`Expected Program node, got ${ast.type}`);
    }

    for (const stmt of ast.body) {
      compileStatement(stmt);
    }

    return {
      instructions,
      constants,
      names
    };
  }
}
