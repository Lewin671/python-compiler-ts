import * as fs from 'fs';

export type ScopeValue = any;

export class ReturnSignal {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class BreakSignal {}
export class ContinueSignal {}

export class PyException extends Error {
  pyType: string;
  pyValue: any;
  constructor(pyType: string, message?: string, pyValue?: any) {
    super(message || pyType);
    this.pyType = pyType;
    this.pyValue = pyValue;
  }
}

export class Scope {
  values: Map<string, ScopeValue> = new Map();
  parent: Scope | null;
  globals: Set<string> = new Set();
  nonlocals: Set<string> = new Set();

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  get(name: string): ScopeValue {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new PyException('NameError', `name '${name}' is not defined`);
  }

  set(name: string, value: ScopeValue): void {
    if (this.globals.has(name) && this.parent) {
      this.root().values.set(name, value);
      return;
    }
    if (this.nonlocals.has(name) && this.parent) {
      const scope = this.parent.findScopeWith(name);
      if (!scope) {
        throw new PyException('NameError', `no binding for nonlocal '${name}' found`);
      }
      scope.values.set(name, value);
      return;
    }
    this.values.set(name, value);
  }

  root(): Scope {
    let scope: Scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  }

  findScopeWith(name: string): Scope | null {
    let scope: Scope | null = this;
    while (scope) {
      if (scope.values.has(name)) return scope;
      scope = scope.parent;
    }
    return null;
  }
}

export class PyFunction {
  name: string;
  params: any[];
  body: any[];
  closure: Scope;
  isGenerator: boolean;

  constructor(name: string, params: any[], body: any[], closure: Scope, isGenerator: boolean) {
    this.name = name;
    this.params = params;
    this.body = body;
    this.closure = closure;
    this.isGenerator = isGenerator;
  }
}

export class PyClass {
  name: string;
  bases: PyClass[];
  attributes: Map<string, any>;
  isException: boolean;

  constructor(name: string, bases: PyClass[], attributes: Map<string, any>, isException: boolean = false) {
    this.name = name;
    this.bases = bases;
    this.attributes = attributes;
    this.isException = isException;
  }
}

export class PyInstance {
  klass: PyClass;
  attributes: Map<string, any>;

  constructor(klass: PyClass) {
    this.klass = klass;
    this.attributes = new Map();
  }
}

export class PyGenerator {
  private iterator: Generator<any, any, any>;

  constructor(iterator: Generator<any, any, any>) {
    this.iterator = iterator;
  }

  next(value?: any) {
    const result = this.iterator.next(value === undefined ? null : value);
    if (result.done) {
      throw new PyException('StopIteration', 'StopIteration');
    }
    return result.value;
  }

  send(value?: any) {
    const result = this.iterator.next(value === undefined ? null : value);
    if (result.done) {
      throw new PyException('StopIteration', 'StopIteration');
    }
    return result.value;
  }

  [Symbol.iterator]() {
    return this.iterator;
  }
}

export type DictEntry = { key: any; value: any };

export class PyDict {
  private primitiveStore: Map<string, DictEntry> = new Map();
  private objectStore: Map<any, DictEntry> = new Map();

  get size(): number {
    return this.primitiveStore.size + this.objectStore.size;
  }

  set(key: any, value: any): this {
    const info = this.keyInfo(key);
    const existing = info.store.get(info.id);
    if (existing) {
      existing.value = value;
      return this;
    }
    info.store.set(info.id, { key, value });
    return this;
  }

  get(key: any): any {
    const info = this.keyInfo(key);
    const entry = info.store.get(info.id);
    return entry ? entry.value : undefined;
  }

  has(key: any): boolean {
    const info = this.keyInfo(key);
    return info.store.has(info.id);
  }

  delete(key: any): boolean {
    const info = this.keyInfo(key);
    return info.store.delete(info.id);
  }

  *entries(): IterableIterator<[any, any]> {
    for (const entry of this.primitiveStore.values()) {
      yield [entry.key, entry.value];
    }
    for (const entry of this.objectStore.values()) {
      yield [entry.key, entry.value];
    }
  }

  *keys(): IterableIterator<any> {
    for (const entry of this.primitiveStore.values()) {
      yield entry.key;
    }
    for (const entry of this.objectStore.values()) {
      yield entry.key;
    }
  }

  *values(): IterableIterator<any> {
    for (const entry of this.primitiveStore.values()) {
      yield entry.value;
    }
    for (const entry of this.objectStore.values()) {
      yield entry.value;
    }
  }

  [Symbol.iterator](): IterableIterator<[any, any]> {
    return this.entries();
  }

  private keyInfo(key: any): { store: Map<any, DictEntry>; id: any } {
    const numeric = this.normalizeNumericKey(key);
    if (numeric !== null) {
      return { store: this.primitiveStore, id: `n:${String(numeric)}` };
    }
    if (typeof key === 'string') {
      return { store: this.primitiveStore, id: `s:${key}` };
    }
    if (key === null) {
      return { store: this.primitiveStore, id: 'none' };
    }
    if (key === undefined) {
      return { store: this.primitiveStore, id: 'undefined' };
    }
    return { store: this.objectStore, id: key };
  }

  private normalizeNumericKey(key: any): number | bigint | null {
    if (typeof key === 'boolean') return key ? 1 : 0;
    if (typeof key === 'bigint') return key;
    if (typeof key === 'number') return key;
    if (key instanceof Number) return key.valueOf();
    return null;
  }
}

export class PyFile {
  path: string;
  mode: string;
  handle: number | null;

  constructor(path: string, mode: string) {
    this.path = path;
    this.mode = mode;
    this.handle = null;
  }

  open() {
    if (this.handle !== null) return;
    if (this.mode.includes('w')) {
      this.handle = fs.openSync(this.path, 'w');
    } else if (this.mode.includes('r')) {
      this.handle = fs.openSync(this.path, 'r');
    } else {
      this.handle = fs.openSync(this.path, 'r');
    }
  }

  write(data: string) {
    this.open();
    if (this.handle === null) return;
    fs.writeSync(this.handle, data);
  }

  read(): string {
    if (this.mode.includes('r')) {
      return fs.readFileSync(this.path, 'utf8');
    }
    return '';
  }

  close() {
    if (this.handle !== null) {
      fs.closeSync(this.handle);
      this.handle = null;
    }
  }

  __enter__() {
    this.open();
    return this;
  }

  __exit__() {
    this.close();
    return false;
  }
}
