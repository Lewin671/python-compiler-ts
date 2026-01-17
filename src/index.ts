#!/usr/bin/env node

import { PythonCompiler } from './python_compiler';
import * as fs from 'fs';

// 导出公共 API
export { PythonCompiler };

import { Serializer } from './compiler/serializer';
import { VirtualMachine } from './vm';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage:');
    console.error('  python-compiler-ts <file.py>             Run a Python source file directly');
    console.error('  python-compiler-ts compile <file.py>     Compile Python source to bytecode');
    console.error('  python-compiler-ts run <file.json>       Run compiled bytecode');
    process.exit(1);
  }

  const command = args[0];
  const compiler = new PythonCompiler();

  if (command === 'compile') {
    const inputFile = args[1];
    if (!inputFile) {
      console.error('Error: No input file specified for compilation');
      process.exit(1);
    }
    const outputFile = args[2] || inputFile + 'c'; // .py -> .pyc

    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File '${inputFile}' not found`);
      process.exit(1);
    }

    try {
      const code = fs.readFileSync(inputFile, 'utf-8');
      const bytecode = compiler.compile(code);
      const buffer = Serializer.serialize(bytecode);
      fs.writeFileSync(outputFile, buffer);
      console.log(`Compiled '${inputFile}' to '${outputFile}'`);
    } catch (error) {
      console.error('Compilation Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === 'run') {
    const inputFile = args[1];
    if (!inputFile) {
      console.error('Error: No input file specified for running');
      process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File '${inputFile}' not found`);
      process.exit(1);
    }

    try {
      const buffer = fs.readFileSync(inputFile);
      const bytecode = Serializer.deserialize(buffer);
      const vm = new VirtualMachine([process.cwd()]);
      const result = vm.execute(bytecode);
      if (result !== undefined) {
        console.log(result);
      }
    } catch (error) {
      console.error('Runtime Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  // Legacy/Direct Run
  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File '${filePath}' not found`);
    process.exit(1);
  }

  try {
    const result = compiler.runFile(filePath);
    if (result !== undefined) {
      console.log(result);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}