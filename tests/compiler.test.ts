import { PythonCompiler } from '../src/index';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const pythonCommandCandidates = [
  process.env.PYTHON,
  'python3',
  'python',
].filter(Boolean) as string[];

const runPython = (code: string): string => {
  let lastError: unknown;
  for (const cmd of pythonCommandCandidates) {
    try {
      return execFileSync(cmd, ['-c', code], { encoding: 'utf8' });
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to execute Python interpreter. Tried: ${pythonCommandCandidates.join(', ')}. ` +
      `Last error: ${String(lastError)}`
  );
};

const runPythonFile = (filePath: string): string => {
  const code = fs.readFileSync(filePath, 'utf8');
  return runPython(code);
};

const captureOutput = (fn: () => void): string => {
  const outputChunks: string[] = [];
  const writeSpy = jest
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: any) => {
      const normalized =
        typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      outputChunks.push(normalized);
      return true;
    });

  try {
    fn();
  } finally {
    writeSpy.mockRestore();
  }

  return outputChunks.join('');
};

describe('PythonCompiler - Public API Tests', () => {
  let compiler: PythonCompiler;

  beforeEach(() => {
    compiler = new PythonCompiler();
  });

  describe('run() method', () => {
    it('should execute simple print statement', () => {
      const code = 'print("Hello, World!")';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle multiple print statements', () => {
      const code = `print("Hello")
print("World")`;
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle arithmetic operations', () => {
      const code = 'print(2 + 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle variable assignment and use', () => {
      const code = `x = 10
print(x)`;
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle string concatenation', () => {
      const code = 'print("Hello" + " " + "World")';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle subtraction', () => {
      const code = 'print(10 - 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle multiplication', () => {
      const code = 'print(4 * 5)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle division', () => {
      const code = 'print(10 / 2)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle modulo operation', () => {
      const code = 'print(10 % 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle power operation', () => {
      const code = 'print(2 ** 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle comparison operators', () => {
      const code = 'print(5 > 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle equality comparison', () => {
      const code = 'print(5 == 5)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle inequality comparison', () => {
      const code = 'print(5 != 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle boolean literals', () => {
      const code = `print(True)
print(False)`;
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle logical and operator', () => {
      const code = 'print(True and False)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle logical or operator', () => {
      const code = 'print(True or False)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle logical not operator', () => {
      const code = 'print(not True)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle string repetition', () => {
      const code = 'print("ab" * 3)';
      const expectedOutput = runPython(code);
      const actualOutput = captureOutput(() => {
        compiler.run(code);
      });
      expect(actualOutput).toBe(expectedOutput);
    });
  });

  describe('runFile() method', () => {
    it('should run hello.py example', () => {
      const filePath = path.join(__dirname, '../examples/hello.py');
      const expectedOutput = runPythonFile(filePath);
      const actualOutput = captureOutput(() => {
        compiler.runFile(filePath);
      });
      expect(actualOutput).toBe(expectedOutput);
    });

    it('should run math.py example', () => {
      const filePath = path.join(__dirname, '../examples/math.py');
      const expectedOutput = runPythonFile(filePath);
      const actualOutput = captureOutput(() => {
        compiler.runFile(filePath);
      });
      expect(actualOutput).toBe(expectedOutput);
    });
  });

  describe('Error handling', () => {
    it('should throw error for undefined variables', () => {
      const code = 'print(undefined_var)';
      expect(() => {
        compiler.run(code);
      }).toThrow();
    });

    it('should throw error for division by zero', () => {
      const code = 'print(10 / 0)';
      expect(() => {
        compiler.run(code);
      }).toThrow();
    });
  });
});
