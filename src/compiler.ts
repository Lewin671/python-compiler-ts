/**
 * Python Compiler - 主入口
 * 用于编译和执行 Python 代码
 */

export class PythonCompiler {
  /**
   * 编译并运行 Python 代码
   * @param code Python 源代码
   * @returns 执行结果
   */
  run(code: string): any {
    // TODO: 实现完整的编译和执行流程
    // 1. 词法分析
    const tokens = this.tokenize(code);
    
    // 2. 语法分析
    const ast = this.parse(tokens);
    
    // 3. 编译到字节码
    const bytecode = this.compile(ast);
    
    // 4. 执行字节码
    const result = this.execute(bytecode);
    
    return result;
  }

  /**
   * 词法分析 - 将源代码转换为 token 流
   * @param code 源代码
   * @returns Token 数组
   */
  private tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;
    let line = 1;
    let column = 1;
    let indentStack: number[] = [0]; // Track indentation levels

    // Helper function to create a token
    const createToken = (type: TokenType, value: string): Token => ({
      type,
      value,
      line,
      column: column - value.length
    });

    // Helper function to advance position
    const advance = (n: number = 1) => {
      for (let i = 0; i < n; i++) {
        if (code[pos] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        pos++;
      }
    };

    // Helper function to peek ahead
    const peek = (n: number = 0) => code[pos + n] || '';

    // Helper function to match a pattern
    const match = (pattern: string): boolean => {
      if (code.slice(pos, pos + pattern.length) === pattern) {
        advance(pattern.length);
        return true;
      }
      return false;
    };

    // Helper function to handle indentation
    const handleIndentation = () => {
      let indent = 0;
      while (peek() === ' ' || peek() === '\t') {
        if (peek() === ' ') {
          indent++;
        } else if (peek() === '\t') {
          indent += 4; // Treat tabs as 4 spaces
        }
        advance();
      }

      const currentIndent = indentStack[indentStack.length - 1];
      if (indent > currentIndent) {
        tokens.push(createToken(TokenType.INDENT, ''));
        indentStack.push(indent);
      } else if (indent < currentIndent) {
        while (indent < indentStack[indentStack.length - 1]) {
          tokens.push(createToken(TokenType.DEDENT, ''));
          indentStack.pop();
        }
        if (indent !== indentStack[indentStack.length - 1]) {
          throw new Error(`Indentation error at line ${line}`);
        }
      }
    };

    // Skip whitespace and handle indentation
    const skipWhitespace = () => {
      while (pos < code.length) {
        if (peek() === ' ' || peek() === '\t') {
          // Skip spaces and tabs for now (simplified)
          advance();
        } else if (peek() === '\n') {
          tokens.push(createToken(TokenType.NEWLINE, '\n'));
          advance();
          // Skip empty lines
          while (peek() === '\n') {
            tokens.push(createToken(TokenType.NEWLINE, '\n'));
            advance();
          }
        } else if (peek() === '#') {
          // Skip comments
          while (pos < code.length && peek() !== '\n') {
            advance();
          }
        } else {
          break;
        }
      }
    };

    // Main tokenization loop
    while (pos < code.length) {
      skipWhitespace();
      if (pos >= code.length) break;

      const char = peek();

      // Numbers
      if (/[0-9]/.test(char)) {
        let num = '';
        while (pos < code.length && /[0-9.]/.test(peek())) {
          num += peek();
          advance();
        }
        tokens.push(createToken(TokenType.NUMBER, num));
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const quote = char;
        let str = quote;
        advance();

        while (pos < code.length && peek() !== quote) {
          if (peek() === '\\') {
            str += peek();
            advance();
            if (pos < code.length) {
              str += peek();
              advance();
            }
          } else {
            str += peek();
            advance();
          }
        }

        if (peek() === quote) {
          str += quote;
          advance();
        } else {
          throw new Error(`Unterminated string at line ${line}`);
        }

        tokens.push(createToken(TokenType.STRING, str));
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (pos < code.length && /[a-zA-Z0-9_]/.test(peek())) {
          ident += peek();
          advance();
        }

        // Check for keywords and boolean literals
        if (ident === 'def' || ident === 'if' || ident === 'elif' || ident === 'else' ||
            ident === 'for' || ident === 'while' || ident === 'return' || ident === 'print' ||
            ident === 'in' || ident === 'range' || ident === 'and' || ident === 'or' || ident === 'not') {
          tokens.push(createToken(TokenType.KEYWORD, ident));
        } else if (ident === 'True' || ident === 'False') {
          tokens.push(createToken(TokenType.BOOLEAN, ident));
        } else if (ident === 'None') {
          tokens.push(createToken(TokenType.NONE, ident));
        } else {
          tokens.push(createToken(TokenType.IDENTIFIER, ident));
        }
        continue;
      }

      // Operators and delimiters
      switch (char) {
        case '+':
          tokens.push(createToken(TokenType.OPERATOR, '+'));
          advance();
          break;
        case '-':
          tokens.push(createToken(TokenType.OPERATOR, '-'));
          advance();
          break;
        case '*':
          if (peek(1) === '*') {
            tokens.push(createToken(TokenType.OPERATOR, '**'));
            advance(2);
          } else {
            tokens.push(createToken(TokenType.OPERATOR, '*'));
            advance();
          }
          break;
        case '/':
          tokens.push(createToken(TokenType.OPERATOR, '/'));
          advance();
          break;
        case '%':
          tokens.push(createToken(TokenType.OPERATOR, '%'));
          advance();
          break;
        case '=':
          if (peek(1) === '=') {
            tokens.push(createToken(TokenType.OPERATOR, '=='));
            advance(2);
          } else {
            tokens.push(createToken(TokenType.ASSIGN, '='));
            advance();
          }
          break;
        case '!':
          if (peek(1) === '=') {
            tokens.push(createToken(TokenType.OPERATOR, '!='));
            advance(2);
          } else {
            throw new Error(`Unexpected character '!' at line ${line}`);
          }
          break;
        case '<':
          if (peek(1) === '=') {
            tokens.push(createToken(TokenType.OPERATOR, '<='));
            advance(2);
          } else {
            tokens.push(createToken(TokenType.OPERATOR, '<'));
            advance();
          }
          break;
        case '>':
          if (peek(1) === '=') {
            tokens.push(createToken(TokenType.OPERATOR, '>='));
            advance(2);
          } else {
            tokens.push(createToken(TokenType.OPERATOR, '>'));
            advance();
          }
          break;
        case '(':
          tokens.push(createToken(TokenType.LPAREN, '('));
          advance();
          break;
        case ')':
          tokens.push(createToken(TokenType.RPAREN, ')'));
          advance();
          break;
        case '[':
          tokens.push(createToken(TokenType.LBRACKET, '['));
          advance();
          break;
        case ']':
          tokens.push(createToken(TokenType.RBRACKET, ']'));
          advance();
          break;
        case ':':
          tokens.push(createToken(TokenType.COLON, ':'));
          advance();
          break;
        case ',':
          tokens.push(createToken(TokenType.COMMA, ','));
          advance();
          break;
        case ' ':
        case '\t':
          // Should be handled by skipWhitespace
          advance();
          break;
        default:
          throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
      }
    }

    // Add EOF
    tokens.push(createToken(TokenType.EOF, ''));

    return tokens;
  }

  /**
   * 语法分析 - 将 token 流转换为 AST
   * @param tokens Token 数组
   * @returns 抽象语法树
   */
  private parse(tokens: Token[]): ASTNode {
    let pos = 0;

    // Helper function to peek at current token
    const peek = (): Token | null => {
      return pos < tokens.length ? tokens[pos] : null;
    };

    // Helper function to consume current token
    const consume = (): Token => {
      if (pos >= tokens.length) {
        throw new Error('Unexpected end of input');
      }
      return tokens[pos++];
    };

    // Helper function to check if current token matches expected type
    const match = (type: TokenType, value?: string): boolean => {
      const token = peek();
      if (!token) return false;
      if (token.type !== type) return false;
      if (value !== undefined && token.value !== value) return false;
      return true;
    };

    // Helper function to expect a specific token
    const expect = (type: TokenType, value?: string): Token => {
      const token = peek();
      if (!token) {
        throw new Error(`Expected ${TokenType[type]}${value ? ` "${value}"` : ''}, but got end of input`);
      }
      if (token.type !== type) {
        throw new Error(`Expected ${TokenType[type]}${value ? ` "${value}"` : ''}, but got ${TokenType[token.type]} "${token.value}" at line ${token.line}`);
      }
      if (value !== undefined && token.value !== value) {
        throw new Error(`Expected "${value}", but got "${token.value}" at line ${token.line}`);
      }
      return consume();
    };

    // Skip newlines
    const skipNewlines = () => {
      while (match(TokenType.NEWLINE)) {
        consume();
      }
    };

    // Parse a literal value
    const parseLiteral = (): ASTNode => {
      const token = peek();
      if (!token) throw new Error('Expected literal');

      if (token.type === TokenType.NUMBER) {
        consume();
        return {
          type: ASTNodeType.NUMBER_LITERAL,
          value: parseFloat(token.value)
        };
      } else if (token.type === TokenType.STRING) {
        consume();
        return {
          type: ASTNodeType.STRING_LITERAL,
          value: token.value.slice(1, -1) // Remove quotes
        };
      } else if (token.type === TokenType.BOOLEAN) {
        consume();
        return {
          type: ASTNodeType.BOOLEAN_LITERAL,
          value: token.value === 'True'
        };
      } else if (token.type === TokenType.NONE) {
        consume();
        return {
          type: ASTNodeType.IDENTIFIER,
          name: 'None'
        };
      }

      throw new Error(`Unexpected token type for literal: ${TokenType[token.type]}`);
    };

    // Parse an identifier
    const parseIdentifier = (): ASTNode => {
      const token = expect(TokenType.IDENTIFIER);
      return {
        type: ASTNodeType.IDENTIFIER,
        name: token.value
      };
    };

    // Parse a primary expression (literal, identifier, parenthesized expression, or unary operation)
    const parsePrimary = (): ASTNode => {
      // Handle unary 'not' operator
      if (match(TokenType.KEYWORD, 'not')) {
        consume(); // Consume 'not'
        const operand = parsePrimary();
        return {
          type: ASTNodeType.UNARY_OPERATION,
          operator: 'not',
          operand
        };
      }

      if (match(TokenType.NUMBER) || match(TokenType.STRING) || match(TokenType.BOOLEAN) || match(TokenType.NONE)) {
        return parseLiteral();
      } else if (match(TokenType.IDENTIFIER)) {
        return parseIdentifier();
      } else if (match(TokenType.LPAREN)) {
        consume(); // Consume '('
        const expr = parseExpression();
        expect(TokenType.RPAREN); // Expect ')'
        return expr;
      } else if (match(TokenType.LBRACKET)) {
        // List literal
        consume(); // Consume '['
        const elements: ASTNode[] = [];

        if (!match(TokenType.RBRACKET)) {
          elements.push(parseExpression());
          while (match(TokenType.COMMA)) {
            consume(); // Consume ','
            elements.push(parseExpression());
          }
        }

        expect(TokenType.RBRACKET); // Expect ']'
        return {
          type: ASTNodeType.LIST_LITERAL,
          elements
        };
      }

      throw new Error(`Unexpected token in expression: ${peek()?.value}`);
    };

    // Parse a binary operation
    const parseBinaryOperation = (left: ASTNode, minPrecedence: number = 0): ASTNode => {
      const precedenceMap: Record<string, number> = {
        'or': 0,
        'and': 1,
        '==': 2, '!=': 2, '<': 2, '>': 2, '<=': 2, '>=': 2,
        '+': 3, '-': 3,
        '*': 4, '/': 4, '%': 4,
        '**': 5,
      };

      let lookahead = peek();
      while (lookahead &&
             ((lookahead.type === TokenType.OPERATOR && precedenceMap[lookahead.value] !== undefined) ||
              (lookahead.type === TokenType.KEYWORD && (lookahead.value === 'and' || lookahead.value === 'or')))) {
        const operator = lookahead.value;
        const precedence = precedenceMap[operator] || 0;

        if (precedence < minPrecedence) break;

        consume(); // Consume operator
        let right = parsePrimary();

        lookahead = peek();
        while (lookahead &&
               ((lookahead.type === TokenType.OPERATOR && precedenceMap[lookahead.value] !== undefined) ||
                (lookahead.type === TokenType.KEYWORD && (lookahead.value === 'and' || lookahead.value === 'or')))) {
          const nextOperator = lookahead.value;
          const nextPrecedence = precedenceMap[nextOperator] || 0;

          if (nextPrecedence > precedence) {
            right = parseBinaryOperation(right, nextPrecedence);
            lookahead = peek();
          } else {
            break;
          }
        }

        left = {
          type: ASTNodeType.BINARY_OPERATION,
          operator,
          left,
          right
        };

        lookahead = peek();
      }

      return left;
    };

    // Parse an expression
    const parseExpression = (): ASTNode => {
      const left = parsePrimary();
      return parseBinaryOperation(left);
    };

    // Parse a print statement
    const parsePrintStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'print'); // Consume 'print'
      expect(TokenType.LPAREN); // Consume '('

      const args: ASTNode[] = [];
      if (!match(TokenType.RPAREN)) {
        args.push(parseExpression());
        while (match(TokenType.COMMA)) {
          consume(); // Consume ','
          args.push(parseExpression());
        }
      }

      expect(TokenType.RPAREN); // Consume ')'

      return {
        type: ASTNodeType.PRINT_STATEMENT,
        args
      };
    };

    // Parse an assignment statement
    const parseAssignment = (): ASTNode => {
      const identifier = parseIdentifier();
      expect(TokenType.ASSIGN); // Consume '='
      const value = parseExpression();

      return {
        type: ASTNodeType.ASSIGNMENT,
        identifier: identifier.name,
        value
      };
    };

    // Parse a statement
    const parseStatement = (): ASTNode => {
      skipNewlines();

      if (match(TokenType.KEYWORD, 'print')) {
        return parsePrintStatement();
      } else if (match(TokenType.IDENTIFIER) && tokens[pos + 1]?.type === TokenType.ASSIGN) {
        return parseAssignment();
      } else if (match(TokenType.KEYWORD)) {
        // Skip over unsupported statements (def, if, for, while, etc.)
        const keyword = consume().value;
        // Skip until end of line or colon
        while (pos < tokens.length && !match(TokenType.COLON) && !match(TokenType.NEWLINE) && !match(TokenType.EOF)) {
          consume();
        }
        if (match(TokenType.COLON)) {
          consume(); // Skip colon
        }
        // Return a no-op statement
        return {
          type: ASTNodeType.EXPRESSION_STATEMENT,
          expression: {
            type: ASTNodeType.NUMBER_LITERAL,
            value: 0
          }
        };
      } else {
        // Expression statement
        const expr = parseExpression();
        return {
          type: ASTNodeType.EXPRESSION_STATEMENT,
          expression: expr
        };
      }
    };

    // Parse the program
    const parseProgram = (): ASTNode => {
      const body: ASTNode[] = [];

      skipNewlines();

      while (pos < tokens.length && !match(TokenType.EOF)) {
        const stmt = parseStatement();
        body.push(stmt);

        // Skip newlines between statements
        skipNewlines();
      }

      expect(TokenType.EOF);

      return {
        type: ASTNodeType.PROGRAM,
        body
      };
    };

    return parseProgram();
  }

  /**
   * 编译 - 将 AST 编译为字节码
   * @param ast 抽象语法树
   * @returns 字节码
   */
  private compile(ast: ASTNode): ByteCode {
    const instructions: Instruction[] = [];
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

  /**
   * 执行 - 在虚拟机中执行字节码
   * @param bytecode 字节码
   * @returns 执行结果
   */
  private execute(bytecode: ByteCode): any {
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

  /**
   * 运行 Python 文件
   * @param filePath 文件路径
   * @returns 执行结果
   */
  runFile(filePath: string): any {
    const fs = require('fs');
    const code = fs.readFileSync(filePath, 'utf-8');
    return this.run(code);
  }
}

/**
 * Token 类型定义
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export enum TokenType {
  // Keywords
  KEYWORD,
  // Identifiers
  IDENTIFIER,
  // Literals
  NUMBER,
  STRING,
  BOOLEAN,
  NONE,
  // Operators
  OPERATOR,
  // Delimiters
  DELIMITER,
  // Parentheses
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  // Assignment
  ASSIGN,
  // Colon
  COLON,
  // Comma
  COMMA,
  // End of file
  EOF,
  // Indentation
  INDENT,
  DEDENT,
  NEWLINE,
}

/**
 * AST 节点类型定义
 */
export interface ASTNode {
  type: string;
  [key: string]: any;
}

// AST Node types
export enum ASTNodeType {
  PROGRAM = 'Program',
  PRINT_STATEMENT = 'PrintStatement',
  ASSIGNMENT = 'Assignment',
  BINARY_OPERATION = 'BinaryOperation',
  UNARY_OPERATION = 'UnaryOperation',
  NUMBER_LITERAL = 'NumberLiteral',
  STRING_LITERAL = 'StringLiteral',
  BOOLEAN_LITERAL = 'BooleanLiteral',
  LIST_LITERAL = 'ListLiteral',
  IDENTIFIER = 'Identifier',
  VARIABLE_DECLARATION = 'VariableDeclaration',
  EXPRESSION_STATEMENT = 'ExpressionStatement',
}

/**
 * 字节码类型定义
 */
export interface ByteCode {
  instructions: Instruction[];
  constants: any[];
  names: string[];
}

export interface Instruction {
  opcode: OpCode;
  arg?: number;
}

export enum OpCode {
  // Loading and storing
  LOAD_CONST,
  LOAD_NAME,
  STORE_NAME,

  // Binary operations
  BINARY_ADD,
  BINARY_SUBTRACT,
  BINARY_MULTIPLY,
  BINARY_DIVIDE,
  BINARY_MODULO,
  BINARY_POWER,

  // Comparison operations
  COMPARE_EQ,
  COMPARE_NE,
  COMPARE_LT,
  COMPARE_GT,
  COMPARE_LE,
  COMPARE_GE,

  // Logical operations
  LOGICAL_AND,
  LOGICAL_OR,
  LOGICAL_NOT,

  // Function calls
  CALL_FUNCTION,
  RETURN_VALUE,

  // Print
  PRINT_ITEM,
  PRINT_NEWLINE,
}
