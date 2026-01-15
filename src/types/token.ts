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
