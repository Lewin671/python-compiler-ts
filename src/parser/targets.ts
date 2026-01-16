import type { Parser } from './parser';
import { ASTNode, ASTNodeType, TokenType } from '../types';

export function parsePostfixTarget(this: Parser): ASTNode {
  let expr = this.parseAtom();
  while (
    this.match(TokenType.LBRACKET) ||
    (this.match(TokenType.DOT) && this.peek(1)?.type === TokenType.IDENTIFIER)
  ) {
    if (this.match(TokenType.LBRACKET)) {
      this.consume();
      const index = this.parseSlice();
      this.expect(TokenType.RBRACKET);
      expr = { type: ASTNodeType.SUBSCRIPT, object: expr, index };
    } else if (this.match(TokenType.DOT)) {
      this.consume();
      const name = this.expect(TokenType.IDENTIFIER).value;
      expr = { type: ASTNodeType.ATTRIBUTE, object: expr, name };
    }
  }
  return expr;
}

export function parseTargetElement(this: Parser): ASTNode {
  if (this.match(TokenType.OPERATOR, '*')) {
    this.consume();
    const target = this.parseTargetElement();
    return { type: ASTNodeType.STARRED, target };
  }
  if (this.match(TokenType.IDENTIFIER)) return this.parsePostfixTarget();
  if (this.match(TokenType.LPAREN)) {
    this.consume();
    const target = this.parseTarget();
    this.expect(TokenType.RPAREN);
    return target;
  }
  if (this.match(TokenType.LBRACKET)) {
    this.consume();
    const elements: ASTNode[] = [];
    if (!this.match(TokenType.RBRACKET)) {
      elements.push(this.parseTarget());
      while (this.match(TokenType.COMMA)) {
        this.consume();
        if (this.match(TokenType.RBRACKET)) break;
        elements.push(this.parseTarget());
      }
    }
    this.expect(TokenType.RBRACKET);
    return { type: ASTNodeType.LIST_LITERAL, elements };
  }
  return this.parsePostfixTarget();
}

export function parseTarget(this: Parser): ASTNode {
  if (this.match(TokenType.OPERATOR, '*')) {
    this.consume();
    const target = this.parseTargetElement();
    return { type: ASTNodeType.STARRED, target };
  }
  const first = this.parseTargetElement();
  if (this.match(TokenType.COMMA)) {
    const elements = [first];
    while (this.match(TokenType.COMMA)) {
      this.consume();
      if (this.match(TokenType.NEWLINE) || this.match(TokenType.EOF)) break;
      elements.push(this.parseTargetElement());
    }
    return { type: ASTNodeType.TUPLE_LITERAL, elements };
  }
  return first;
}
