import { PyClass, PyDict, PyException, PyFunction, PyInstance, PySet } from './runtime-types';

export const isPyNone = (value: any) => value === null;

export const isBigInt = (value: any): value is bigint => typeof value === 'bigint';
export const isIntObject = (value: any): boolean => value instanceof Number && (value as any).__int__ === true;
export const isFloatObject = (value: any): boolean => value instanceof Number && !isIntObject(value);
export const isFloatLike = (value: any): boolean => isFloatObject(value) || (typeof value === 'number' && !Number.isInteger(value));
export const isIntLike = (value: any): boolean =>
  isBigInt(value) ||
  value === true ||
  value === false ||
  (typeof value === 'number' && Number.isInteger(value)) ||
  isIntObject(value);
export const isNumericLike = (value: any): boolean =>
  isBigInt(value) || typeof value === 'number' || value instanceof Number || typeof value === 'boolean';
export const toNumber = (value: any): number => {
  if (value instanceof Number) return value.valueOf();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'bigint') return Number(value);
  return value;
};
export const toBigIntValue = (value: any): bigint => {
  if (typeof value === 'bigint') return value;
  if (value instanceof Number) return BigInt(Math.trunc(value.valueOf()));
  if (typeof value === 'number') return BigInt(value);
  return BigInt(value);
};
export const shouldUseBigInt = (left: any, right: any): boolean =>
  (isBigInt(left) || isBigInt(right)) && !isFloatLike(left) && !isFloatLike(right);
export const numericEquals = (left: any, right: any): boolean => {
  if (isNumericLike(left) && isNumericLike(right)) {
    if (isFloatLike(left) || isFloatLike(right)) {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      return !Number.isNaN(leftNum) && !Number.isNaN(rightNum) && leftNum === rightNum;
    }
    return toBigIntValue(left) === toBigIntValue(right);
  }
  return left === right;
};
export const numericCompare = (
  left: any,
  right: any
): { kind: 'float' | 'int'; left: number | bigint; right: number | bigint } | null => {
  if (!isNumericLike(left) || !isNumericLike(right)) return null;
  if (isFloatLike(left) || isFloatLike(right)) {
    return { kind: 'float', left: toNumber(left), right: toNumber(right) };
  }
  return { kind: 'int', left: toBigIntValue(left), right: toBigIntValue(right) };
};

export const bigIntFloorDiv = (left: bigint, right: bigint): bigint => {
  const quotient = left / right;
  if (left % right === 0n) return quotient;
  if ((left < 0n) !== (right < 0n)) return quotient - 1n;
  return quotient;
};

export const pyTypeName = (value: any): string => {
  if (value === null) return 'NoneType';
  if (isBigInt(value)) return 'int';
  if (isIntObject(value)) return 'int';
  if (value instanceof Number) return 'float';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'string') return 'str';
  if (Array.isArray(value)) return (value as any).__tuple__ ? 'tuple' : 'list';
  if (value instanceof PySet) return 'set';
  if (value instanceof PyDict) return 'dict';
  if (value instanceof PyFunction) return 'function';
  if (value instanceof PyClass) return 'type';
  if (value instanceof PyInstance) return value.klass.name;
  return typeof value;
};

export const pyRepr = (value: any, seen: Set<any> = new Set()): string => {
  if (value === null) return 'None';
  if (value instanceof Number) {
    const num = value.valueOf();
    if (Number.isNaN(num)) return 'nan';
    if (num === Infinity) return 'inf';
    if (num === -Infinity) return '-inf';
    if (isIntObject(value)) return String(num);
    if (Object.is(num, -0)) return '-0.0';
    return Number.isInteger(num) ? `${num}.0` : String(num);
  }
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return Number.isNaN(value) ? 'nan' : String(value);
  if (typeof value === 'bigint') return value.toString();
  if (value && value.__complex__) {
    const sign = value.im >= 0 ? '+' : '-';
    const imag = Math.abs(value.im);
    return `(${value.re}${sign}${imag}j)`;
  }
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;

  const isContainer = Array.isArray(value) || value instanceof PySet || value instanceof PyDict;
  if (isContainer) {
    if (seen.has(value)) {
      if (Array.isArray(value)) return (value as any).__tuple__ ? '(...)' : '[...]';
      return '{...}';
    }
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        const items = value.map((v: any) => pyRepr(v, seen)).join(', ');
        if ((value as any).__tuple__) {
          if (value.length === 1) return `(${items},)`;
          return `(${items})`;
        }
        return `[${items}]`;
      }
      if (value instanceof PySet) {
        const items = Array.from(value.values())
          .map((v) => pyRepr(v, seen))
          .join(', ');
        return `{${items}}`;
      }
      if (value instanceof PyDict) {
        const items = Array.from(value.entries())
          .map(([k, v]) => `${pyRepr(k, seen)}: ${pyRepr(v, seen)}`)
          .join(', ');
        return `{${items}}`;
      }
    } finally {
      seen.delete(value);
    }
  }

  if (value instanceof PyFunction) return `<function ${value.name}>`;
  if (value instanceof PyClass) return `<class '${value.name}'>`;
  if (value instanceof PyInstance) return `<${value.klass.name} object>`;
  return String(value);
};

export const pyStr = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value && value.__complex__) return pyRepr(value);
  if (value && value.__typeName__) return `<class '${value.__typeName__}'>`;
  if (value instanceof PyException) return value.message;
  return pyRepr(value);
};

export const isComplex = (value: any) => value && value.__complex__;

export const toComplex = (value: any) => {
  if (isComplex(value)) return value;
  if (isNumericLike(value)) return { __complex__: true, re: toNumber(value), im: 0 };
  return { __complex__: true, re: 0, im: 0 };
};

export const pythonModulo = (left: any, right: any) => {
  if (shouldUseBigInt(left, right)) {
    const leftNum = toBigIntValue(left);
    const rightNum = toBigIntValue(right);
    if (rightNum === 0n) throw new PyException('ZeroDivisionError', 'division by zero');
    const remainder = leftNum % rightNum;
    const adjust = remainder !== 0n && (leftNum < 0n) !== (rightNum < 0n);
    const quotient = leftNum / rightNum - (adjust ? 1n : 0n);
    return leftNum - quotient * rightNum;
  }
  const leftNum = toNumber(left);
  const rightNum = toNumber(right);
  if (rightNum === 0) throw new PyException('ZeroDivisionError', 'division by zero');
  const quotient = Math.floor(leftNum / rightNum);
  const result = leftNum - quotient * rightNum;
  if (isFloatObject(left) || isFloatObject(right)) {
    return new Number(result);
  }
  return result;
};

export const parseStringToken = (tokenValue: string): { value: string; isFString: boolean } => {
  let raw = tokenValue;
  let isFString = false;
  if (raw.startsWith('f') || raw.startsWith('F')) {
    isFString = true;
    raw = raw.slice(1);
  }
  const quote = raw[0];
  if (raw.startsWith(quote.repeat(3))) {
    const inner = raw.slice(3, -3);
    return { value: inner, isFString };
  }
  const inner = raw.slice(1, -1);
  return {
    value: inner.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'"),
    isFString,
  };
};
