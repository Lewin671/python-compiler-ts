import { Token, TokenType, ASTNode, ASTNodeType } from '../types';

/**
 * 语法分析器 - 将 token 流转换为 AST
 */
export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    // Helper function to peek at current token
    const peek = (): Token | null => {
      return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    };

    // Helper function to consume current token
    const consume = (): Token => {
      if (this.pos >= this.tokens.length) {
        throw new Error('Unexpected end of input');
      }
      return this.tokens[this.pos++];
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
      } else if (match(TokenType.IDENTIFIER) && this.tokens[this.pos + 1]?.type === TokenType.ASSIGN) {
        return parseAssignment();
      } else if (match(TokenType.KEYWORD)) {
        // Skip over unsupported statements (def, if, for, while, etc.)
        const keyword = consume().value;
        // Skip until end of line or colon
        while (this.pos < this.tokens.length && !match(TokenType.COLON) && !match(TokenType.NEWLINE) && !match(TokenType.EOF)) {
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

      while (this.pos < this.tokens.length && !match(TokenType.EOF)) {
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
}
