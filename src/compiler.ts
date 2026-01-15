/**
 * Python Compiler - 主入口
 * 用于编译和执行 Python 代码
 */

import fs from 'fs';
import vm from 'vm';

export class PythonCompiler {
  private static skInitialized = false;
  private static skRuntime: any;

  /**
   * 初始化 Skulpt 运行时
   */
  private ensureSkulpt() {
    if (PythonCompiler.skInitialized && PythonCompiler.skRuntime) {
      return PythonCompiler.skRuntime;
    }

    const skSource = fs.readFileSync(
      require.resolve('skulpt/dist/skulpt.min.js'),
      'utf8'
    );
    const stdlibSource = fs.readFileSync(
      require.resolve('skulpt/dist/skulpt-stdlib.js'),
      'utf8'
    );

    vm.runInThisContext('var Sk; if (typeof Sk === "undefined") { Sk = {}; }\n' + skSource);
    vm.runInThisContext(stdlibSource);

    const Sk: any = vm.runInThisContext('Sk');
    (global as any).Sk = Sk;

    const builtinRead = (filename: string) => {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][filename] === undefined) {
        throw new Error(`File not found: '${filename}'`);
      }
      return Sk.builtinFiles['files'][filename];
    };

    Sk.configure({
      output: (text: string) => process.stdout.write(text),
      read: builtinRead,
      python3: true
    });

    const fileNotFound = Sk.builtin.IOError;
    Sk.builtin.FileNotFoundError = fileNotFound;
    Sk.builtins['FileNotFoundError'] = fileNotFound;

    const nodeFileClass = Sk.misceval.buildClass(
      Sk.builtins,
      function ($gbl: any, $loc: any) {
        $loc.__init__ = new Sk.builtin.func(function (self: any, fileObj: any, modeObj?: any) {
          const filePath = Sk.ffi.remapToJs(fileObj);
          const modeStr = modeObj ? Sk.ffi.remapToJs(modeObj) : 'r';
          const isRead = modeStr.includes('r');
          const isAppend = modeStr.includes('a');
          const isWrite = modeStr.includes('w') || isAppend;

          if (isRead && !fs.existsSync(filePath)) {
            throw new fileNotFound(`No such file or directory: '${filePath}'`);
          }

          if (isWrite) {
            const flag = isAppend ? 'a' : 'w';
            fs.writeFileSync(filePath, '', { flag });
          }

          self.$path = filePath;
          self.$mode = modeStr;
          self.$closed = false;
          return Sk.builtin.none.none$;
        });

        $loc.write = new Sk.builtin.func(function (self: any, data: any) {
          if (self.$closed) {
            throw new Sk.builtin.ValueError('I/O operation on closed file.');
          }
          const text = Sk.ffi.remapToJs(data);
          fs.writeFileSync(self.$path, text, { flag: 'a' });
          return new Sk.builtin.int_(String(text).length);
        });

        $loc.read = new Sk.builtin.func(function (self: any) {
          if (self.$closed) {
            throw new Sk.builtin.ValueError('I/O operation on closed file.');
          }
          const content = fs.readFileSync(self.$path, 'utf8');
          return new Sk.builtin.str(content);
        });

        $loc.close = new Sk.builtin.func(function (self: any) {
          self.$closed = true;
          return Sk.builtin.none.none$;
        });

        $loc.__enter__ = new Sk.builtin.func(function (self: any) {
          return self;
        });

        $loc.__exit__ = new Sk.builtin.func(function (self: any) {
          self.$closed = true;
          return Sk.builtin.bool.false$;
        });
      },
      'NodeFile',
      []
    );

    const openFunc = new Sk.builtin.func(function (fileObj: any, modeObj?: any) {
      return Sk.misceval.callsim(nodeFileClass, fileObj, modeObj || new Sk.builtin.str('r'));
    });

    Sk.builtin.open = openFunc;
    Sk.builtins.open = openFunc;

    PythonCompiler.skInitialized = true;
    PythonCompiler.skRuntime = Sk;
    return Sk;
  }

  /**
   * 编译并运行 Python 代码
   * @param code Python 源代码
   * @returns 执行结果
   */
  run(code: string): any {
    // 简单处理 Skulpt 暂不支持的 nonlocal 关键字
    const defs: Array<{ index: number; indent: number }> = [];
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const defMatch = /^(\s*)def\s+/.exec(lines[i]);
      if (defMatch) {
        defs.push({ index: i, indent: defMatch[1].length });
      }
    }

    for (let idx = 0; idx < lines.length; idx++) {
      const match = /^(\s*)nonlocal\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(lines[idx]);
      if (match) {
        const indent = match[1];
        const name = match[2];
        lines[idx] = `${indent}global ${name}`;

        const nonlocalIndent = indent.length;
        const innerDef = [...defs]
          .filter((d) => d.index < idx && d.indent < nonlocalIndent)
          .pop();
        let outerDef: { index: number; indent: number } | undefined;
        if (innerDef) {
          outerDef = [...defs]
            .filter((d) => d.index < innerDef.index && d.indent < innerDef.indent)
            .pop();
        }

        if (outerDef) {
          const insertLine = ' '.repeat(outerDef.indent + 4) + `global ${name}`;
          lines.splice(outerDef.index + 1, 0, insertLine);
          idx++;
          for (const d of defs) {
            if (d.index > outerDef.index) {
              d.index += 1;
            }
          }
        }
      }
    }
    const normalized = lines.join('\n');
    const Sk = this.ensureSkulpt();
    return Sk.importMainWithBody('<stdin>', false, normalized, true);
  }

  /**
   * 运行 Python 文件
   * @param filePath 文件路径
   * @returns 执行结果
   */
  runFile(filePath: string): any {
    const fs = require('fs');
    const code = fs.readFileSync(filePath, 'utf-8');
    return this.run(code);
  }
}

// 重新导出类型，供外部使用
export * from './types';
