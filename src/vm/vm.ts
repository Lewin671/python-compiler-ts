import { installBuiltins } from './builtins';
import { callFunction, containsYield, evaluateComprehension, expressionHasYield, generateComprehension } from './callable';
import { execute, executeBlock, executeBlockGenerator, executeStatementGenerator, iterableToArray, matchPattern, matchValueEquals, applyBindings } from './execution';
import { evaluateExpressionGenerator } from './expression-generator';
import { createAsyncioModule, importModule, loadModuleFromFile, resolveModulePath } from './imports';
import {
  applyFormatSpec,
  applyWidth,
  contains,
  evaluateExpression,
  evaluateExpressionString,
  executeExpressionInline,
  splitFormatSpec,
} from './expressions';
import { assignTarget, deleteTarget, executeStatement, toIterableArray } from './statements';
import {
  applyBinary,
  computeSliceBounds,
  computeSliceIndices,
  findClassAttribute,
  formatPercent,
  getAttribute,
  getSubscript,
  normalizeSliceStep,
  setAttribute,
} from './operations';
import { isTruthy } from './truthy';
import { Scope } from './runtime-types';

export class VirtualMachine {
  public moduleCache: Map<string, any> = new Map();
  public moduleSearchPaths: string[];

  constructor(moduleSearchPaths: string[] = [process.cwd()]) {
    this.moduleSearchPaths = moduleSearchPaths;
  }

  execute = execute;
  installBuiltins = installBuiltins;
  importModule = importModule;
  createAsyncioModule = createAsyncioModule;
  loadModuleFromFile = loadModuleFromFile;
  resolveModulePath = resolveModulePath;
  executeBlock = executeBlock;
  iterableToArray = iterableToArray;
  matchValueEquals = matchValueEquals;
  matchPattern = matchPattern;
  applyBindings = applyBindings;
  executeBlockGenerator = executeBlockGenerator;
  executeStatementGenerator = executeStatementGenerator;
  evaluateExpressionGenerator = evaluateExpressionGenerator;
  executeStatement = executeStatement;
  assignTarget = assignTarget;
  toIterableArray = toIterableArray;
  deleteTarget = deleteTarget;
  evaluateExpression = evaluateExpression;
  evaluateExpressionString = evaluateExpressionString;
  executeExpressionInline = executeExpressionInline;
  applyFormatSpec = applyFormatSpec;
  splitFormatSpec = splitFormatSpec;
  applyWidth = applyWidth;
  contains = contains;
  isTruthy = isTruthy;
  applyBinary = applyBinary;
  formatPercent = formatPercent;
  getSubscript = getSubscript;
  computeSliceBounds = computeSliceBounds;
  computeSliceIndices = computeSliceIndices;
  normalizeSliceStep = normalizeSliceStep;
  getAttribute = getAttribute;
  setAttribute = setAttribute;
  findClassAttribute = findClassAttribute;
  callFunction = callFunction;
  containsYield = containsYield;
  evaluateComprehension = evaluateComprehension;
  generateComprehension = generateComprehension;
  expressionHasYield = expressionHasYield;
}

export * from './runtime-types';
