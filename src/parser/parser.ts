import { Token, TokenType, ASTNode, ASTNodeType } from '../types';

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const peek = (offset: number = 0): Token | null =>
      this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
    const consume = (): Token => {
      if (this.pos >= this.tokens.length) throw new Error('Unexpected end of input');
      return this.tokens[this.pos++];
    };
    const match = (type: TokenType, value?: string): boolean => {
      const token = peek();
      return !!token && token.type === type && (value === undefined || token.value === value);
    };
    const expect = (type: TokenType, value?: string): Token => {
      const token = peek();
      if (!token) throw new Error(`Expected ${TokenType[type]}${value ? ` \"${value}\"` : ''}, but got end of input`);
      if (token.type !== type) {
        throw new Error(
          `Expected ${TokenType[type]}${value ? ` \"${value}\"` : ''}, but got ${TokenType[token.type]} \"${token.value}\" at line ${token.line}`
        );
      }
      if (value !== undefined && token.value !== value) {
        throw new Error(`Expected \"${value}\", but got \"${token.value}\" at line ${token.line}`);
      }
      return consume();
    };
    const skipNewlines = () => {
      while (match(TokenType.NEWLINE)) consume();
    };

    const parseStringLiteral = (): ASTNode => {
      let value = '';
      while (match(TokenType.STRING)) value += consume().value;
      return { type: ASTNodeType.STRING_LITERAL, value };
    };
    const parseLiteral = (): ASTNode => {
      const token = peek();
      if (!token) throw new Error('Expected literal');
      if (token.type === TokenType.NUMBER) {
        consume();
        return { type: ASTNodeType.NUMBER_LITERAL, value: token.value };
      }
      if (token.type === TokenType.STRING) return parseStringLiteral();
      if (token.type === TokenType.BOOLEAN) {
        consume();
        return { type: ASTNodeType.BOOLEAN_LITERAL, value: token.value === 'True' };
      }
      if (token.type === TokenType.NONE) {
        consume();
        return { type: ASTNodeType.NONE_LITERAL, value: null };
      }
      throw new Error(`Unexpected token type for literal: ${TokenType[token.type]}`);
    };
    const parseIdentifier = (): ASTNode => {
      const token = expect(TokenType.IDENTIFIER);
      return { type: ASTNodeType.IDENTIFIER, name: token.value };
    };
    const parseArguments = (): ASTNode[] => {
      const args: ASTNode[] = [];
      if (!match(TokenType.RPAREN)) {
        while (true) {
          if (match(TokenType.OPERATOR, '*') || match(TokenType.OPERATOR, '**')) {
            const op = consume().value;
            const value = parseExpression();
            args.push({ type: op === '*' ? 'StarArg' : 'KwArg', value } as any);
          } else if (match(TokenType.IDENTIFIER) && peek(1)?.type === TokenType.ASSIGN) {
            const name = consume().value;
            consume();
            const value = parseExpression();
            args.push({ type: 'KeywordArg', name, value } as any);
          } else {
            args.push(parseExpression());
          }
          if (!match(TokenType.COMMA)) break;
          consume();
          if (match(TokenType.RPAREN)) break;
        }
      }
      return args;
    };
    const parseSlice = (): ASTNode => {
      let start: ASTNode | null = null;
      let end: ASTNode | null = null;
      let step: ASTNode | null = null;
      if (!match(TokenType.COLON)) start = parseExpression();
      if (match(TokenType.COLON)) {
        consume();
        if (!match(TokenType.COLON) && !match(TokenType.RBRACKET)) end = parseExpression();
        if (match(TokenType.COLON)) {
          consume();
          if (!match(TokenType.RBRACKET)) step = parseExpression();
        }
        return { type: ASTNodeType.SLICE, start, end, step };
      }
      return start as ASTNode;
    };
    const parsePatternAtom = (): ASTNode => {
      if (match(TokenType.NUMBER) || match(TokenType.STRING) || match(TokenType.BOOLEAN) || match(TokenType.NONE)) {
        return { type: ASTNodeType.MATCH_PATTERN_VALUE, value: parseLiteral() } as any;
      }
      if (match(TokenType.IDENTIFIER)) {
        const name = consume().value;
        if (name === '_') return { type: ASTNodeType.MATCH_PATTERN_WILDCARD } as any;
        return { type: ASTNodeType.MATCH_PATTERN_CAPTURE, name } as any;
      }
      if (match(TokenType.LBRACKET)) {
        consume();
        const elements: ASTNode[] = [];
        if (!match(TokenType.RBRACKET)) {
          elements.push(parsePattern());
          while (match(TokenType.COMMA)) {
            consume();
            if (match(TokenType.RBRACKET)) break;
            elements.push(parsePattern());
          }
        }
        expect(TokenType.RBRACKET);
        return { type: ASTNodeType.MATCH_PATTERN_SEQUENCE, elements } as any;
      }
      throw new Error(`Unexpected token in pattern: ${peek()?.value}`);
    };
    const parsePattern = (): ASTNode => {
      let pattern = parsePatternAtom();
      if (match(TokenType.OPERATOR, '|')) {
        const patterns: ASTNode[] = [pattern];
        while (match(TokenType.OPERATOR, '|')) {
          consume();
          patterns.push(parsePatternAtom());
        }
        pattern = { type: ASTNodeType.MATCH_PATTERN_OR, patterns } as any;
      }
      return pattern;
    };
    const parseAtom = (): ASTNode => {
      if (match(TokenType.LPAREN)) {
        consume();
        if (match(TokenType.RPAREN)) {
          consume();
          return { type: ASTNodeType.TUPLE_LITERAL, elements: [] };
        }
        const expr = parseExpression();
        if (match(TokenType.COMMA)) {
          const elements = [expr];
          while (match(TokenType.COMMA)) {
            consume();
            if (match(TokenType.RPAREN)) break;
            elements.push(parseExpression());
          }
          expect(TokenType.RPAREN);
          return { type: ASTNodeType.TUPLE_LITERAL, elements };
        }
        expect(TokenType.RPAREN);
        return expr;
      }
      if (match(TokenType.LBRACKET)) {
        consume();
        if (match(TokenType.RBRACKET)) {
          consume();
          return { type: ASTNodeType.LIST_LITERAL, elements: [] };
        }
        const first = parseExpression();
        if (match(TokenType.KEYWORD, 'for')) {
          const comprehension = parseComprehension(first);
          expect(TokenType.RBRACKET);
          return { type: ASTNodeType.LIST_COMP, expression: first, comprehension };
        }
        const elements = [first];
        while (match(TokenType.COMMA)) {
          consume();
          if (match(TokenType.RBRACKET)) break;
          elements.push(parseExpression());
        }
        expect(TokenType.RBRACKET);
        return { type: ASTNodeType.LIST_LITERAL, elements };
      }
      if (match(TokenType.LBRACE)) {
        consume();
        if (match(TokenType.RBRACE)) {
          consume();
          return { type: ASTNodeType.DICT_LITERAL, entries: [] };
        }
        const key = parseExpression();
        if (match(TokenType.COLON)) {
          consume();
          const value = parseExpression();
          if (match(TokenType.KEYWORD, 'for')) {
            const comprehension = parseComprehension({ type: 'KeyValue', key, value } as any);
            expect(TokenType.RBRACE);
            return { type: ASTNodeType.DICT_COMP, key, value, comprehension };
          }
          const entries = [{ key, value }];
          while (match(TokenType.COMMA)) {
            consume();
            if (match(TokenType.RBRACE)) break;
            const k = parseExpression();
            expect(TokenType.COLON);
            const v = parseExpression();
            entries.push({ key: k, value: v });
          }
          expect(TokenType.RBRACE);
          return { type: ASTNodeType.DICT_LITERAL, entries };
        }
        if (match(TokenType.KEYWORD, 'for')) {
          const comprehension = parseComprehension(key);
          expect(TokenType.RBRACE);
          return { type: ASTNodeType.SET_COMP, expression: key, comprehension };
        }
        const elements = [key];
        while (match(TokenType.COMMA)) {
          consume();
          if (match(TokenType.RBRACE)) break;
          elements.push(parseExpression());
        }
        expect(TokenType.RBRACE);
        return { type: ASTNodeType.SET_LITERAL, elements };
      }
      if (match(TokenType.IDENTIFIER)) {
        const name = consume().value;
        return { type: ASTNodeType.IDENTIFIER, name };
      }
      return parseLiteral();
    };
    const parsePostfix = (): ASTNode => {
      let expr = parseAtom();
      while (true) {
        if (match(TokenType.DOT)) {
          consume();
          const name = expect(TokenType.IDENTIFIER).value;
          expr = { type: ASTNodeType.ATTRIBUTE, object: expr, name };
          continue;
        }
        if (match(TokenType.LPAREN)) {
          consume();
          const args = parseArguments();
          expect(TokenType.RPAREN);
          expr = { type: ASTNodeType.CALL, callee: expr, args };
          continue;
        }
        if (match(TokenType.LBRACKET)) {
          consume();
          if (match(TokenType.RBRACKET)) throw new Error('Empty subscript');
          const slice = parseSlice();
          expect(TokenType.RBRACKET);
          expr = { type: ASTNodeType.SUBSCRIPT, object: expr, index: slice };
          continue;
        }
        break;
      }
      return expr;
    };
    const parsePostfixTarget = (): ASTNode => {
      let expr = parseAtom();
      while (match(TokenType.LBRACKET) || match(TokenType.DOT)) {
        if (match(TokenType.LBRACKET)) {
          consume();
          if (match(TokenType.RBRACKET)) throw new Error('Empty subscript');
          const slice = parseSlice();
          expect(TokenType.RBRACKET);
          expr = { type: ASTNodeType.SUBSCRIPT, object: expr, index: slice };
        } else if (match(TokenType.DOT)) {
          consume();
          const name = expect(TokenType.IDENTIFIER).value;
          expr = { type: ASTNodeType.ATTRIBUTE, object: expr, name };
        }
      }
      return expr;
    };
    const parseTargetElement = (): ASTNode => {
      if (match(TokenType.IDENTIFIER)) return parseIdentifier();
      if (match(TokenType.LPAREN)) {
        consume();
        const target = parseTarget();
        expect(TokenType.RPAREN);
        return target;
      }
      if (match(TokenType.LBRACKET)) {
        consume();
        const elements: ASTNode[] = [];
        if (!match(TokenType.RBRACKET)) {
          elements.push(parseTarget());
          while (match(TokenType.COMMA)) {
            consume();
            if (match(TokenType.RBRACKET)) break;
            elements.push(parseTarget());
          }
        }
        expect(TokenType.RBRACKET);
        return { type: ASTNodeType.LIST_LITERAL, elements };
      }
      return parsePostfixTarget();
    };
    const parseTarget = (): ASTNode => {
      if (match(TokenType.OPERATOR, '*')) {
        consume();
        const target = parseTargetElement();
        return { type: ASTNodeType.STARRED, target };
      }
      const first = parseTargetElement();
      if (match(TokenType.COMMA)) {
        const elements = [first];
        while (match(TokenType.COMMA)) {
          consume();
          if (match(TokenType.NEWLINE) || match(TokenType.EOF)) break;
          elements.push(parseTargetElement());
        }
        return { type: ASTNodeType.TUPLE_LITERAL, elements };
      }
      return first;
    };
    const parseUnary = (): ASTNode => {
      if (match(TokenType.OPERATOR, '+') || match(TokenType.OPERATOR, '-') || match(TokenType.OPERATOR, '~')) {
        const operator = consume().value;
        const operand = parseUnary();
        return { type: ASTNodeType.UNARY_OPERATION, operator, operand };
      }
      if (match(TokenType.KEYWORD) && peek()?.value === 'not') {
        consume();
        const operand = parseUnary();
        return { type: ASTNodeType.UNARY_OPERATION, operator: 'not', operand };
      }
      return parsePostfix();
    };
    const parsePower = (): ASTNode => {
      let left = parseUnary();
      if (match(TokenType.OPERATOR, '**')) {
        consume();
        const right = parsePower();
        left = { type: ASTNodeType.BINARY_OPERATION, operator: '**', left, right };
      }
      return left;
    };
    const parseFactor = (): ASTNode => {
      let left = parsePower();
      while (match(TokenType.OPERATOR, '*') || match(TokenType.OPERATOR, '/') || match(TokenType.OPERATOR, '//') || match(TokenType.OPERATOR, '%')) {
        const operator = consume().value;
        const right = parsePower();
        left = { type: ASTNodeType.BINARY_OPERATION, operator, left, right };
      }
      return left;
    };
    const parseTerm = (): ASTNode => {
      let left = parseFactor();
      while (match(TokenType.OPERATOR, '+') || match(TokenType.OPERATOR, '-')) {
        const operator = consume().value;
        const right = parseFactor();
        left = { type: ASTNodeType.BINARY_OPERATION, operator, left, right };
      }
      return left;
    };
    const parseShift = (): ASTNode => {
      let left = parseTerm();
      while (match(TokenType.OPERATOR, '<<') || match(TokenType.OPERATOR, '>>')) {
        const operator = consume().value;
        const right = parseTerm();
        left = { type: ASTNodeType.BINARY_OPERATION, operator, left, right };
      }
      return left;
    };
    const parseBitAnd = (): ASTNode => {
      let left = parseShift();
      while (match(TokenType.OPERATOR, '&')) {
        consume();
        const right = parseShift();
        left = { type: ASTNodeType.BINARY_OPERATION, operator: '&', left, right };
      }
      return left;
    };
    const parseBitXor = (): ASTNode => {
      let left = parseBitAnd();
      while (match(TokenType.OPERATOR, '^')) {
        consume();
        const right = parseBitAnd();
        left = { type: ASTNodeType.BINARY_OPERATION, operator: '^', left, right };
      }
      return left;
    };
    const parseBitOr = (): ASTNode => {
      let left = parseBitXor();
      while (match(TokenType.OPERATOR, '|')) {
        consume();
        const right = parseBitXor();
        left = { type: ASTNodeType.BINARY_OPERATION, operator: '|', left, right };
      }
      return left;
    };
    const parseComparison = (): ASTNode => {
      let left = parseBitOr();
      const operators: string[] = [];
      const comparators: ASTNode[] = [];
      while (
        match(TokenType.OPERATOR, '==') ||
        match(TokenType.OPERATOR, '!=') ||
        match(TokenType.OPERATOR, '<') ||
        match(TokenType.OPERATOR, '>') ||
        match(TokenType.OPERATOR, '<=') ||
        match(TokenType.OPERATOR, '>=') ||
        (match(TokenType.KEYWORD) && (['in', 'is', 'not'].includes(peek()?.value || '')))
      ) {
        if (match(TokenType.KEYWORD)) {
          const kw = consume().value;
          if (kw === 'not' && match(TokenType.KEYWORD, 'in')) {
            consume();
            operators.push('not in');
          } else {
            operators.push(kw);
          }
        } else {
          operators.push(consume().value);
        }
        comparators.push(parseBitOr());
      }
      if (operators.length === 0) return left;
      return { type: ASTNodeType.COMPARE, left, ops: operators, comparators };
    };
    const parseNot = (): ASTNode => {
      if (match(TokenType.KEYWORD, 'not')) {
        consume();
        const operand = parseNot();
        return { type: ASTNodeType.UNARY_OPERATION, operator: 'not', operand };
      }
      return parseComparison();
    };
    const parseAnd = (): ASTNode => {
      let left = parseNot();
      while (match(TokenType.KEYWORD, 'and')) {
        consume();
        const right = parseNot();
        left = { type: ASTNodeType.BOOL_OPERATION, operator: 'and', values: [left, right] };
      }
      return left;
    };
    const parseOr = (): ASTNode => {
      let left = parseAnd();
      while (match(TokenType.KEYWORD, 'or')) {
        consume();
        const right = parseAnd();
        left = { type: ASTNodeType.BOOL_OPERATION, operator: 'or', values: [left, right] };
      }
      return left;
    };
    const parseIfExpression = (): ASTNode => {
      const expr = parseOr();
      if (match(TokenType.KEYWORD, 'if')) {
        consume();
        const test = parseOr();
        expect(TokenType.KEYWORD, 'else');
        const alternate = parseIfExpression();
        return { type: ASTNodeType.IF_EXPRESSION, test, consequent: expr, alternate };
      }
      return expr;
    };
    const parseExpression = (): ASTNode => parseIfExpression();
    const parseExpressionNoIf = (): ASTNode => parseOr();
    const parseComprehension = (expression: ASTNode): ASTNode => {
      const clauses: any[] = [];
      while (match(TokenType.KEYWORD, 'for')) {
        consume();
        const target = parseTarget();
        expect(TokenType.KEYWORD, 'in');
        const iter = parseExpression();
        const ifs: ASTNode[] = [];
        while (match(TokenType.KEYWORD, 'if')) {
          consume();
          ifs.push(parseExpression());
        }
        clauses.push({ target, iter, ifs });
        if (!match(TokenType.COMMA)) break;
        consume();
      }
      return { clauses, expression } as any;
    };
    const parseExpressionStatement = (): ASTNode => ({ type: ASTNodeType.EXPRESSION_STATEMENT, expression: parseExpression() });
    const parseExpressionList = (): ASTNode => {
      const first = parseExpression();
      if (match(TokenType.COMMA)) {
        const elements: ASTNode[] = [first];
        while (match(TokenType.COMMA)) {
          consume();
          if (match(TokenType.NEWLINE) || match(TokenType.RPAREN) || match(TokenType.RBRACKET) || match(TokenType.RBRACE)) break;
          elements.push(parseExpression());
        }
        return { type: ASTNodeType.TUPLE_LITERAL, elements };
      }
      return first;
    };
    const parseAssignmentOrExpression = (): ASTNode => {
      const startPos = this.pos;
      const target = parseTarget();
      if (match(TokenType.ASSIGN)) {
        consume();
        const value = parseExpressionList();
        return { type: ASTNodeType.ASSIGNMENT, targets: [target], value };
      }
      if (match(TokenType.OPERATOR) && ['+=', '-=', '*=', '/=', '%=', '//=', '**='].includes(peek()?.value || '')) {
        const op = consume().value;
        const value = parseExpressionList();
        return { type: ASTNodeType.AUG_ASSIGNMENT, target, operator: op, value };
      }
      this.pos = startPos;
      return parseExpressionStatement();
    };
    const parseBlock = (): ASTNode[] => {
      expect(TokenType.NEWLINE);
      expect(TokenType.INDENT);
      const body: ASTNode[] = [];
      while (!match(TokenType.DEDENT) && !match(TokenType.EOF)) {
        const stmt = parseStatement();
        body.push(stmt);
        skipNewlines();
      }
      expect(TokenType.DEDENT);
      return body;
    };
    const parseIfStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'if');
      const test = parseExpression();
      expect(TokenType.COLON);
      const body = parseBlock();
      const elifs: Array<{ test: ASTNode; body: ASTNode[] }> = [];
      while (match(TokenType.KEYWORD, 'elif')) {
        consume();
        const elifTest = parseExpression();
        expect(TokenType.COLON);
        const elifBody = parseBlock();
        elifs.push({ test: elifTest, body: elifBody });
      }
      let orelse: ASTNode[] = [];
      if (match(TokenType.KEYWORD, 'else')) {
        consume();
        expect(TokenType.COLON);
        orelse = parseBlock();
      }
      return { type: ASTNodeType.IF_STATEMENT, test, body, elifs, orelse };
    };
    const parseWhileStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'while');
      const test = parseExpression();
      expect(TokenType.COLON);
      const body = parseBlock();
      return { type: ASTNodeType.WHILE_STATEMENT, test, body };
    };
    const parseForStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'for');
      const target = parseTarget();
      expect(TokenType.KEYWORD, 'in');
      const iter = parseExpression();
      expect(TokenType.COLON);
      const body = parseBlock();
      return { type: ASTNodeType.FOR_STATEMENT, target, iter, body };
    };
    const parseFunctionParameters = (): ASTNode[] => {
      const params: ASTNode[] = [];
      if (!match(TokenType.RPAREN)) {
        while (true) {
          if (match(TokenType.OPERATOR, '*')) {
            consume();
            const name = expect(TokenType.IDENTIFIER).value;
            params.push({ type: 'VarArg', name } as any);
          } else if (match(TokenType.OPERATOR, '**')) {
            consume();
            const name = expect(TokenType.IDENTIFIER).value;
            params.push({ type: 'KwArg', name } as any);
          } else if (match(TokenType.IDENTIFIER)) {
            const name = consume().value;
            let defaultValue: ASTNode | null = null;
            if (match(TokenType.ASSIGN)) {
              consume();
              defaultValue = parseExpression();
            }
            params.push({ type: 'Param', name, defaultValue } as any);
          }
          if (!match(TokenType.COMMA)) break;
          consume();
          if (match(TokenType.RPAREN)) break;
        }
      }
      return params;
    };
    const parseFunctionDef = (decorators: ASTNode[] = []): ASTNode => {
      expect(TokenType.KEYWORD, 'def');
      const name = expect(TokenType.IDENTIFIER).value;
      expect(TokenType.LPAREN);
      const params = parseFunctionParameters();
      expect(TokenType.RPAREN);
      expect(TokenType.COLON);
      const body = parseBlock();
      return { type: ASTNodeType.FUNCTION_DEF, name, params, body, decorators };
    };
    const parseClassDef = (decorators: ASTNode[] = []): ASTNode => {
      expect(TokenType.KEYWORD, 'class');
      const name = expect(TokenType.IDENTIFIER).value;
      let bases: ASTNode[] = [];
      if (match(TokenType.LPAREN)) {
        consume();
        if (!match(TokenType.RPAREN)) {
          bases.push(parseExpression());
          while (match(TokenType.COMMA)) {
            consume();
            if (match(TokenType.RPAREN)) break;
            bases.push(parseExpression());
          }
        }
        expect(TokenType.RPAREN);
      }
      expect(TokenType.COLON);
      const body = parseBlock();
      return { type: ASTNodeType.CLASS_DEF, name, bases, body, decorators };
    };
    const parseDecorators = (): ASTNode[] => {
      const decorators: ASTNode[] = [];
      while (match(TokenType.AT)) {
        consume();
        const decorator = parseExpression();
        decorators.push(decorator);
        expect(TokenType.NEWLINE);
      }
      return decorators;
    };
    const parseTryStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'try');
      expect(TokenType.COLON);
      const body = parseBlock();
      const handlers: Array<{ exceptionType: ASTNode | null; name: string | null; body: ASTNode[] }> = [];
      while (match(TokenType.KEYWORD, 'except')) {
        consume();
        let exceptionType: ASTNode | null = null;
        let name: string | null = null;
        if (!match(TokenType.COLON)) {
          exceptionType = parseExpression();
          if (match(TokenType.KEYWORD, 'as')) {
            consume();
            name = expect(TokenType.IDENTIFIER).value;
          }
        }
        expect(TokenType.COLON);
        const handlerBody = parseBlock();
        handlers.push({ exceptionType, name, body: handlerBody });
      }
      let orelse: ASTNode[] = [];
      if (match(TokenType.KEYWORD, 'else')) {
        consume();
        expect(TokenType.COLON);
        orelse = parseBlock();
      }
      let finalbody: ASTNode[] = [];
      if (match(TokenType.KEYWORD, 'finally')) {
        consume();
        expect(TokenType.COLON);
        finalbody = parseBlock();
      }
      return { type: ASTNodeType.TRY_STATEMENT, body, handlers, orelse, finalbody };
    };
    const parseWithStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'with');
      const items: any[] = [];
      while (true) {
        const context = parseExpression();
        let target: ASTNode | null = null;
        if (match(TokenType.KEYWORD, 'as')) {
          consume();
          target = parseTarget();
        }
        items.push({ context, target });
        if (!match(TokenType.COMMA)) break;
        consume();
      }
      expect(TokenType.COLON);
      const body = parseBlock();
      return { type: ASTNodeType.WITH_STATEMENT, items, body };
    };
    const parseMatchStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'match');
      const subject = parseExpression();
      expect(TokenType.COLON);
      expect(TokenType.NEWLINE);
      expect(TokenType.INDENT);
      const cases: Array<{ pattern: ASTNode; guard: ASTNode | null; body: ASTNode[] }> = [];
      while (!match(TokenType.DEDENT) && !match(TokenType.EOF)) {
        expect(TokenType.KEYWORD, 'case');
        const pattern = parsePattern();
        let guard: ASTNode | null = null;
        if (match(TokenType.KEYWORD, 'if')) {
          consume();
          guard = parseExpression();
        }
        expect(TokenType.COLON);
        const body = parseBlock();
        cases.push({ pattern, guard, body });
      }
      expect(TokenType.DEDENT);
      return { type: ASTNodeType.MATCH_STATEMENT, subject, cases };
    };
    const parseImportStatement = (): ASTNode => {
      expect(TokenType.KEYWORD, 'import');
      const names: Array<{ name: string; alias: string | null }> = [];
      const parseName = () => {
        let name = expect(TokenType.IDENTIFIER).value;
        while (match(TokenType.DOT)) {
          consume();
          name += `.${expect(TokenType.IDENTIFIER).value}`;
        }
        let alias: string | null = null;
        if (match(TokenType.KEYWORD, 'as')) {
          consume();
          alias = expect(TokenType.IDENTIFIER).value;
        }
        names.push({ name, alias });
      };
      parseName();
      while (match(TokenType.COMMA)) {
        consume();
        parseName();
      }
      return { type: ASTNodeType.IMPORT_STATEMENT, names };
    };
    const parseStatement = (): ASTNode => {
      skipNewlines();
      if (match(TokenType.AT)) {
        const decorators = parseDecorators();
        if (match(TokenType.KEYWORD, 'async')) {
          consume();
          if (!match(TokenType.KEYWORD, 'def')) throw new Error('async must be followed by def');
          const node = parseFunctionDef(decorators);
          (node as any).isAsync = true;
          return node;
        }
        if (match(TokenType.KEYWORD, 'def')) return parseFunctionDef(decorators);
        if (match(TokenType.KEYWORD, 'class')) return parseClassDef(decorators);
        throw new Error('Decorator must be followed by def or class');
      }
      if (match(TokenType.KEYWORD, 'async')) {
        consume();
        if (!match(TokenType.KEYWORD, 'def')) throw new Error('async must be followed by def');
        const node = parseFunctionDef();
        (node as any).isAsync = true;
        return node;
      }
      if (match(TokenType.KEYWORD, 'import')) return parseImportStatement();
      if (match(TokenType.KEYWORD, 'def')) return parseFunctionDef();
      if (match(TokenType.KEYWORD, 'class')) return parseClassDef();
      if (match(TokenType.KEYWORD, 'if')) return parseIfStatement();
      if (match(TokenType.KEYWORD, 'for')) return parseForStatement();
      if (match(TokenType.KEYWORD, 'while')) return parseWhileStatement();
      if (match(TokenType.KEYWORD, 'try')) return parseTryStatement();
      if (match(TokenType.KEYWORD, 'with')) return parseWithStatement();
      if (match(TokenType.KEYWORD, 'match')) return parseMatchStatement();
      if (match(TokenType.KEYWORD, 'return')) {
        consume();
        const value = match(TokenType.NEWLINE) ? null : parseExpressionList();
        return { type: ASTNodeType.RETURN_STATEMENT, value };
      }
      if (match(TokenType.KEYWORD, 'break')) {
        consume();
        return { type: ASTNodeType.BREAK_STATEMENT };
      }
      if (match(TokenType.KEYWORD, 'continue')) {
        consume();
        return { type: ASTNodeType.CONTINUE_STATEMENT };
      }
      if (match(TokenType.KEYWORD, 'pass')) {
        consume();
        return { type: ASTNodeType.PASS_STATEMENT };
      }
      if (match(TokenType.KEYWORD, 'assert')) {
        consume();
        const test = parseExpression();
        let message: ASTNode | null = null;
        if (match(TokenType.COMMA)) {
          consume();
          message = parseExpression();
        }
        return { type: ASTNodeType.ASSERT_STATEMENT, test, message };
      }
      if (match(TokenType.KEYWORD, 'raise')) {
        consume();
        const exc = match(TokenType.NEWLINE) ? null : parseExpression();
        return { type: ASTNodeType.RAISE_STATEMENT, exception: exc };
      }
      if (match(TokenType.KEYWORD, 'global')) {
        consume();
        const names: string[] = [];
        names.push(expect(TokenType.IDENTIFIER).value);
        while (match(TokenType.COMMA)) {
          consume();
          names.push(expect(TokenType.IDENTIFIER).value);
        }
        return { type: ASTNodeType.GLOBAL_STATEMENT, names };
      }
      if (match(TokenType.KEYWORD, 'nonlocal')) {
        consume();
        const names: string[] = [];
        names.push(expect(TokenType.IDENTIFIER).value);
        while (match(TokenType.COMMA)) {
          consume();
          names.push(expect(TokenType.IDENTIFIER).value);
        }
        return { type: ASTNodeType.NONLOCAL_STATEMENT, names };
      }
      if (match(TokenType.KEYWORD, 'del')) {
        consume();
        const target = parseExpression();
        return { type: ASTNodeType.DELETE_STATEMENT, target };
      }
      return parseAssignmentOrExpression();
    };
    const parseProgram = (): ASTNode => {
      const body: ASTNode[] = [];
      skipNewlines();
      while (this.pos < this.tokens.length && !match(TokenType.EOF)) {
        const stmt = parseStatement();
        body.push(stmt);
        skipNewlines();
      }
      expect(TokenType.EOF);
      return { type: ASTNodeType.PROGRAM, body };
    };
    return parseProgram();
  }
}
