/**
 * AST 节点类型定义
 */
export interface ASTNode {
  type: string;
  [key: string]: any;
}

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
