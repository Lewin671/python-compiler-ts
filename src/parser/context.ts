import type { Parser } from './parser';
import { Token, TokenType } from '../types';

export function peek(this: Parser, offset: number = 0): Token | null {
  return this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
}

export function consume(this: Parser): Token {
  if (this.pos >= this.tokens.length) {
    throw new Error('Unexpected end of input');
  }
  return this.tokens[this.pos++];
}

export function match(this: Parser, type: TokenType, value?: string): boolean {
  const token = this.peek();
  if (!token) return false;
  if (token.type !== type) return false;
  if (value !== undefined && token.value !== value) return false;
  return true;
}

export function expect(this: Parser, type: TokenType, value?: string): Token {
  const token = this.peek();
  if (!token) {
    throw new Error(`Expected ${TokenType[type]}${value ? ` \"${value}\"` : ''}, but got end of input`);
  }
  if (token.type !== type) {
    throw new Error(
      `Expected ${TokenType[type]}${value ? ` \"${value}\"` : ''}, but got ${TokenType[token.type]} \"${token.value}\" at line ${token.line}`
    );
  }
  if (value !== undefined && token.value !== value) {
    throw new Error(`Expected \"${value}\", but got \"${token.value}\" at line ${token.line}`);
  }
  return this.consume();
}

export function skipNewlines(this: Parser) {
  while (this.match(TokenType.NEWLINE)) {
    this.consume();
  }
}
