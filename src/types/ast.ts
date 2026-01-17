export enum ASTNodeType {
  PROGRAM = 'Program',
  EXPRESSION_STATEMENT = 'ExpressionStatement',
  BINARY_OPERATION = 'BinaryOperation',
  UNARY_OPERATION = 'UnaryOperation',
  BOOL_OPERATION = 'BoolOperation',
  COMPARE = 'Compare',
  CALL = 'Call',
  ATTRIBUTE = 'Attribute',
  SUBSCRIPT = 'Subscript',
  IF_EXPRESSION = 'IfExpression',
  LIST_LITERAL = 'ListLiteral',
  TUPLE_LITERAL = 'TupleLiteral',
  DICT_LITERAL = 'DictLiteral',
  SET_LITERAL = 'SetLiteral',
  NUMBER_LITERAL = 'NumberLiteral',
  STRING_LITERAL = 'StringLiteral',
  BOOLEAN_LITERAL = 'BooleanLiteral',
  NONE_LITERAL = 'NoneLiteral',
  IDENTIFIER = 'Identifier',
  ASSIGNMENT = 'Assignment',
  AUG_ASSIGNMENT = 'AugAssignment',
  ASSERT_STATEMENT = 'AssertStatement',
  RAISE_STATEMENT = 'RaiseStatement',
  PASS_STATEMENT = 'PassStatement',
  BREAK_STATEMENT = 'BreakStatement',
  CONTINUE_STATEMENT = 'ContinueStatement',
  RETURN_STATEMENT = 'ReturnStatement',
  YIELD = 'Yield',
  GLOBAL_STATEMENT = 'GlobalStatement',
  NONLOCAL_STATEMENT = 'NonlocalStatement',
  DELETE_STATEMENT = 'DeleteStatement',
  IMPORT_STATEMENT = 'ImportStatement',
  IF_STATEMENT = 'IfStatement',
  WHILE_STATEMENT = 'WhileStatement',
  FOR_STATEMENT = 'ForStatement',
  TRY_STATEMENT = 'TryStatement',
  WITH_STATEMENT = 'WithStatement',
  FUNCTION_DEF = 'FunctionDef',
  CLASS_DEF = 'ClassDef',
  LAMBDA = 'Lambda',
  MATCH_STATEMENT = 'MatchStatement',
  MATCH_PATTERN_VALUE = 'MatchPatternValue',
  MATCH_PATTERN_WILDCARD = 'MatchPatternWildcard',
  MATCH_PATTERN_CAPTURE = 'MatchPatternCapture',
  MATCH_PATTERN_SEQUENCE = 'MatchPatternSequence',
  MATCH_PATTERN_OR = 'MatchPatternOr',
  LIST_COMP = 'ListComp',
  DICT_COMP = 'DictComp',
  SET_COMP = 'SetComp',
  GENERATOR_EXPR = 'GeneratorExpr',
  SLICE = 'Slice',
  STARRED = 'Starred',

  // Auxiliary types used in parser
  STAR_ARG = 'StarArg',
  KW_ARG = 'KwArg',
  KEYWORD_ARG = 'KeywordArg',
  VAR_ARG = 'VarArg',
  PARAM = 'Param',
  COMPREHENSION = 'Comprehension',
  KEY_VALUE = 'KeyValue',
}

export interface Program {
  type: ASTNodeType.PROGRAM;
  body: ASTNode[];
}

export interface ExpressionStatement {
  type: ASTNodeType.EXPRESSION_STATEMENT;
  expression: ASTNode;
}

export interface BinaryOperation {
  type: ASTNodeType.BINARY_OPERATION;
  left: ASTNode;
  right: ASTNode;
  operator: string;
}

export interface UnaryOperation {
  type: ASTNodeType.UNARY_OPERATION;
  operator: string;
  operand: ASTNode;
}

export interface BoolOperation {
  type: ASTNodeType.BOOL_OPERATION;
  operator: 'and' | 'or';
  values: ASTNode[];
}

export interface Compare {
  type: ASTNodeType.COMPARE;
  left: ASTNode;
  ops: string[];
  comparators: ASTNode[];
}

export interface Call {
  type: ASTNodeType.CALL;
  callee: ASTNode;
  args: ASTNode[];
}

export interface Attribute {
  type: ASTNodeType.ATTRIBUTE;
  object: ASTNode;
  name: string;
}

export interface Subscript {
  type: ASTNodeType.SUBSCRIPT;
  object: ASTNode;
  index: ASTNode;
}

export interface IfExpression {
  type: ASTNodeType.IF_EXPRESSION;
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface ListLiteral {
  type: ASTNodeType.LIST_LITERAL;
  elements: ASTNode[];
}

export interface TupleLiteral {
  type: ASTNodeType.TUPLE_LITERAL;
  elements: ASTNode[];
}

export interface DictLiteral {
  type: ASTNodeType.DICT_LITERAL;
  entries: { key: ASTNode; value: ASTNode }[];
}

export interface SetLiteral {
  type: ASTNodeType.SET_LITERAL;
  elements: ASTNode[];
}

export interface NumberLiteral {
  type: ASTNodeType.NUMBER_LITERAL;
  value: string | number;
}

export interface StringLiteral {
  type: ASTNodeType.STRING_LITERAL;
  value: string;
}

export interface BooleanLiteral {
  type: ASTNodeType.BOOLEAN_LITERAL;
  value: boolean;
}

export interface NoneLiteral {
  type: ASTNodeType.NONE_LITERAL;
  value: null;
}

export interface Identifier {
  type: ASTNodeType.IDENTIFIER;
  name: string;
}

export interface Assignment {
  type: ASTNodeType.ASSIGNMENT;
  targets: ASTNode[];
  value: ASTNode;
}

export interface AugAssignment {
  type: ASTNodeType.AUG_ASSIGNMENT;
  target: ASTNode;
  operator: string;
  value: ASTNode;
}

export interface AssertStatement {
  type: ASTNodeType.ASSERT_STATEMENT;
  test: ASTNode;
  message: ASTNode | null;
}

export interface RaiseStatement {
  type: ASTNodeType.RAISE_STATEMENT;
  exception: ASTNode | null;
}

export interface PassStatement {
  type: ASTNodeType.PASS_STATEMENT;
}

export interface BreakStatement {
  type: ASTNodeType.BREAK_STATEMENT;
}

export interface ContinueStatement {
  type: ASTNodeType.CONTINUE_STATEMENT;
}

export interface ReturnStatement {
  type: ASTNodeType.RETURN_STATEMENT;
  value: ASTNode | null;
}

export interface Yield {
  type: ASTNodeType.YIELD;
  value: ASTNode | null;
}

export interface GlobalStatement {
  type: ASTNodeType.GLOBAL_STATEMENT;
  names: string[];
}

export interface NonlocalStatement {
  type: ASTNodeType.NONLOCAL_STATEMENT;
  names: string[];
}

export interface DeleteStatement {
  type: ASTNodeType.DELETE_STATEMENT;
  targets?: ASTNode[]; // CFGBuilder uses targets
  target?: ASTNode;    // parser uses target
}

export interface ImportStatement {
  type: ASTNodeType.IMPORT_STATEMENT;
  names: { name: string; alias: string | null; asname?: string | null }[];
}

export interface IfStatement {
  type: ASTNodeType.IF_STATEMENT;
  test: ASTNode;
  body: ASTNode[];
  elifs: { test: ASTNode; body: ASTNode[] }[];
  orelse: ASTNode[];
}

export interface WhileStatement {
  type: ASTNodeType.WHILE_STATEMENT;
  test: ASTNode;
  body: ASTNode[];
}

export interface ForStatement {
  type: ASTNodeType.FOR_STATEMENT;
  target: ASTNode;
  iter: ASTNode;
  body: ASTNode[];
}

export interface TryStatement {
  type: ASTNodeType.TRY_STATEMENT;
  body: ASTNode[];
  handlers: { exceptionType: ASTNode | null; name: string | null; body: ASTNode[] }[];
  orelse: ASTNode[];
  finalbody: ASTNode[];
}

export interface WithStatement {
  type: ASTNodeType.WITH_STATEMENT;
  items: { context: ASTNode; target: ASTNode | null }[];
  body: ASTNode[];
}

export interface FunctionDef {
  type: ASTNodeType.FUNCTION_DEF;
  name: string;
  params: ASTNode[];
  body: ASTNode[];
  decorators: ASTNode[];
  isAsync?: boolean;
}

export interface ClassDef {
  type: ASTNodeType.CLASS_DEF;
  name: string;
  bases: ASTNode[];
  body: ASTNode[];
  decorators: ASTNode[];
}

export interface Lambda {
  type: ASTNodeType.LAMBDA;
  params: string[];
  body: ASTNode;
}

export interface MatchStatement {
  type: ASTNodeType.MATCH_STATEMENT;
  subject: ASTNode;
  cases: { pattern: ASTNode; guard: ASTNode | null; body: ASTNode[] }[];
}

export interface MatchPatternValue {
  type: ASTNodeType.MATCH_PATTERN_VALUE;
  value: ASTNode;
}

export interface MatchPatternWildcard {
  type: ASTNodeType.MATCH_PATTERN_WILDCARD;
}

export interface MatchPatternCapture {
  type: ASTNodeType.MATCH_PATTERN_CAPTURE;
  name: string;
}

export interface MatchPatternSequence {
  type: ASTNodeType.MATCH_PATTERN_SEQUENCE;
  elements: ASTNode[];
}

export interface MatchPatternOr {
  type: ASTNodeType.MATCH_PATTERN_OR;
  patterns: ASTNode[];
}

export interface ListComp {
  type: ASTNodeType.LIST_COMP | ASTNodeType.SET_COMP | ASTNodeType.GENERATOR_EXPR;
  expression: ASTNode;
  comprehension: ASTNode;
}

export interface DictComp {
  type: ASTNodeType.DICT_COMP;
  key: ASTNode;
  value: ASTNode;
  comprehension: ASTNode;
}

export interface Slice {
  type: ASTNodeType.SLICE;
  start: ASTNode | null;
  end: ASTNode | null;
  step: ASTNode | null;
}

export interface Starred {
  type: ASTNodeType.STARRED;
  target: ASTNode;
}

// Auxiliary Nodes
export interface StarArg {
  type: ASTNodeType.STAR_ARG;
  value: ASTNode;
}

export interface KwArg {
  type: ASTNodeType.KW_ARG;
  value?: ASTNode; // For call
  name?: string;  // For param
}

export interface KeywordArg {
  type: ASTNodeType.KEYWORD_ARG;
  name: string;
  value: ASTNode;
}

export interface VarArg {
  type: ASTNodeType.VAR_ARG;
  name: string;
}

export interface Param {
  type: ASTNodeType.PARAM;
  name: string;
  defaultValue: ASTNode | null;
}

export interface Comprehension {
  type: ASTNodeType.COMPREHENSION;
  clauses: { target: ASTNode; iter: ASTNode; ifs: ASTNode[] }[];
  expression: ASTNode;
}

export interface KeyValue {
  type: ASTNodeType.KEY_VALUE;
  key: ASTNode;
  value: ASTNode;
}

export type ASTNode =
  | Program
  | ExpressionStatement
  | BinaryOperation
  | UnaryOperation
  | BoolOperation
  | Compare
  | Call
  | Attribute
  | Subscript
  | IfExpression
  | ListLiteral
  | TupleLiteral
  | DictLiteral
  | SetLiteral
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NoneLiteral
  | Identifier
  | Assignment
  | AugAssignment
  | AssertStatement
  | RaiseStatement
  | PassStatement
  | BreakStatement
  | ContinueStatement
  | ReturnStatement
  | Yield
  | GlobalStatement
  | NonlocalStatement
  | DeleteStatement
  | ImportStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | TryStatement
  | WithStatement
  | FunctionDef
  | ClassDef
  | Lambda
  | MatchStatement
  | MatchPatternValue
  | MatchPatternWildcard
  | MatchPatternCapture
  | MatchPatternSequence
  | MatchPatternOr
  | ListComp
  | DictComp
  | Slice
  | Starred
  | StarArg
  | KwArg
  | KeywordArg
  | VarArg
  | Param
  | Comprehension
  | KeyValue;
