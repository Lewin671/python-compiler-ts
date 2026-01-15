import { Token, TokenType } from '../types';

/**
 * 词法分析器 - 将源代码转换为 token 流
 */
export class Lexer {
  private code: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];

  constructor(code: string) {
    this.code = code;
  }

  tokenize(): Token[] {
    // Helper function to create a token
    const createToken = (type: TokenType, value: string): Token => ({
      type,
      value,
      line: this.line,
      column: this.column - value.length
    });

    // Helper function to advance position
    const advance = (n: number = 1) => {
      for (let i = 0; i < n; i++) {
        if (this.code[this.pos] === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      }
    };

    // Helper function to peek ahead
    const peek = (n: number = 0) => this.code[this.pos + n] || '';

    // Helper function to match a pattern
    const match = (pattern: string): boolean => {
      if (this.code.slice(this.pos, this.pos + pattern.length) === pattern) {
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

      const currentIndent = this.indentStack[this.indentStack.length - 1];
      if (indent > currentIndent) {
        this.tokens.push(createToken(TokenType.INDENT, ''));
        this.indentStack.push(indent);
      } else if (indent < currentIndent) {
        while (indent < this.indentStack[this.indentStack.length - 1]) {
          this.tokens.push(createToken(TokenType.DEDENT, ''));
          this.indentStack.pop();
        }
        if (indent !== this.indentStack[this.indentStack.length - 1]) {
          throw new Error(`Indentation error at line ${this.line}`);
        }
      }
    };

    // Skip whitespace and handle indentation
    const skipWhitespace = () => {
      while (this.pos < this.code.length) {
        if (peek() === ' ' || peek() === '\t') {
          // Skip spaces and tabs for now (simplified)
          advance();
        } else if (peek() === '\n') {
          this.tokens.push(createToken(TokenType.NEWLINE, '\n'));
          advance();
          // Skip empty lines
          while (peek() === '\n') {
            this.tokens.push(createToken(TokenType.NEWLINE, '\n'));
            advance();
          }
        } else if (peek() === '#') {
          // Skip comments
          while (this.pos < this.code.length && peek() !== '\n') {
            advance();
          }
        } else {
          break;
        }
      }
    };

    // Main tokenization loop
    while (this.pos < this.code.length) {
      skipWhitespace();
      if (this.pos >= this.code.length) break;

      const char = peek();

      // Numbers
      if (/[0-9]/.test(char)) {
        let num = '';
        while (this.pos < this.code.length && /[0-9.]/.test(peek())) {
          num += peek();
          advance();
        }
        this.tokens.push(createToken(TokenType.NUMBER, num));
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const quote = char;
        let str = quote;
        advance();

        while (this.pos < this.code.length && peek() !== quote) {
          if (peek() === '\\') {
            str += peek();
            advance();
            if (this.pos < this.code.length) {
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
          throw new Error(`Unterminated string at line ${this.line}`);
        }

        this.tokens.push(createToken(TokenType.STRING, str));
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (this.pos < this.code.length && /[a-zA-Z0-9_]/.test(peek())) {
          ident += peek();
          advance();
        }

        // Check for keywords and boolean literals
        if (ident === 'def' || ident === 'if' || ident === 'elif' || ident === 'else' ||
            ident === 'for' || ident === 'while' || ident === 'return' || ident === 'print' ||
            ident === 'in' || ident === 'range' || ident === 'and' || ident === 'or' || ident === 'not') {
          this.tokens.push(createToken(TokenType.KEYWORD, ident));
        } else if (ident === 'True' || ident === 'False') {
          this.tokens.push(createToken(TokenType.BOOLEAN, ident));
        } else if (ident === 'None') {
          this.tokens.push(createToken(TokenType.NONE, ident));
        } else {
          this.tokens.push(createToken(TokenType.IDENTIFIER, ident));
        }
        continue;
      }

      // Operators and delimiters
      switch (char) {
        case '+':
          this.tokens.push(createToken(TokenType.OPERATOR, '+'));
          advance();
          break;
        case '-':
          this.tokens.push(createToken(TokenType.OPERATOR, '-'));
          advance();
          break;
        case '*':
          if (peek(1) === '*') {
            this.tokens.push(createToken(TokenType.OPERATOR, '**'));
            advance(2);
          } else {
            this.tokens.push(createToken(TokenType.OPERATOR, '*'));
            advance();
          }
          break;
        case '/':
          this.tokens.push(createToken(TokenType.OPERATOR, '/'));
          advance();
          break;
        case '%':
          this.tokens.push(createToken(TokenType.OPERATOR, '%'));
          advance();
          break;
        case '=':
          if (peek(1) === '=') {
            this.tokens.push(createToken(TokenType.OPERATOR, '=='));
            advance(2);
          } else {
            this.tokens.push(createToken(TokenType.ASSIGN, '='));
            advance();
          }
          break;
        case '!':
          if (peek(1) === '=') {
            this.tokens.push(createToken(TokenType.OPERATOR, '!='));
            advance(2);
          } else {
            throw new Error(`Unexpected character '!' at line ${this.line}`);
          }
          break;
        case '<':
          if (peek(1) === '=') {
            this.tokens.push(createToken(TokenType.OPERATOR, '<='));
            advance(2);
          } else {
            this.tokens.push(createToken(TokenType.OPERATOR, '<'));
            advance();
          }
          break;
        case '>':
          if (peek(1) === '=') {
            this.tokens.push(createToken(TokenType.OPERATOR, '>='));
            advance(2);
          } else {
            this.tokens.push(createToken(TokenType.OPERATOR, '>'));
            advance();
          }
          break;
        case '(':
          this.tokens.push(createToken(TokenType.LPAREN, '('));
          advance();
          break;
        case ')':
          this.tokens.push(createToken(TokenType.RPAREN, ')'));
          advance();
          break;
        case '[':
          this.tokens.push(createToken(TokenType.LBRACKET, '['));
          advance();
          break;
        case ']':
          this.tokens.push(createToken(TokenType.RBRACKET, ']'));
          advance();
          break;
        case ':':
          this.tokens.push(createToken(TokenType.COLON, ':'));
          advance();
          break;
        case ',':
          this.tokens.push(createToken(TokenType.COMMA, ','));
          advance();
          break;
        case ' ':
        case '\t':
          // Should be handled by skipWhitespace
          advance();
          break;
        default:
          throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
      }
    }

    // Add EOF
    this.tokens.push(createToken(TokenType.EOF, ''));

    return this.tokens;
  }
}
