import { PythonCompiler } from '../src/index';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const pythonCommandCandidates = [
  process.env.PYTHON,
  'python3',
  'python',
].filter(Boolean) as string[];

const runPythonFile = (filePath: string): string => {
  const errors: { cmd: string; error: string }[] = [];
  
  for (const cmd of pythonCommandCandidates) {
    try {
      return execFileSync(cmd, [filePath], { encoding: 'utf8' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ cmd, error: errorMsg });
    }
  }

  const errorDetails = errors
    .map(({ cmd, error }) => `  • ${cmd}: ${error}`)
    .join('\n');

  throw new Error(
    `❌ Python interpreter not found\n\n` +
    `Attempted commands:\n${errorDetails}\n\n` +
    `Please ensure Python 3 is installed and in your PATH, or set the PYTHON environment variable.`
  );
};

const captureOutput = (fn: () => void): string => {
  const outputChunks: string[] = [];
  const originalWrite = process.stdout.write;

  process.stdout.write = ((chunk: any) => {
    const normalized =
      typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    outputChunks.push(normalized);
    return true;
  }) as any;

  try {
    fn();
  } finally {
    process.stdout.write = originalWrite;
  }

  return outputChunks.join('');
};

describe('PythonCompiler - Public API Tests', () => {
  let compiler: PythonCompiler;

  beforeEach(() => {
    compiler = new PythonCompiler();
  });

  describe('runFile() method', () => {
    const examplesDir = path.join(__dirname, '../examples');
    const exampleFiles = fs
      .readdirSync(examplesDir)
      .filter((file) => file.endsWith('.py'))
      .sort();

    it('should match output for example files', () => {
      const failedTests: Array<{ file: string; expected: string; actual: string }> = [];

      for (const fileName of exampleFiles) {
        const filePath = path.join(examplesDir, fileName);
        const expectedOutput = runPythonFile(filePath);
        const actualOutput = captureOutput(() => {
          compiler.runFile(filePath);
        });

        if (actualOutput !== expectedOutput) {
          failedTests.push({
            file: fileName,
            expected: expectedOutput,
            actual: actualOutput,
          });
        }
      }

      if (failedTests.length > 0) {
        const failureDetails = failedTests
          .map(({ file, expected, actual }) => {
            return (
              `\n📄 ${file}\n` +
              `   Expected:\n${expected
                .split('\n')
                .map((l) => `     ${l}`)
                .join('\n')}\n` +
              `   Actual:\n${actual
                .split('\n')
                .map((l) => `     ${l}`)
                .join('\n')}`
            );
          })
          .join('\n');

        throw new Error(
          `❌ ${failedTests.length} test(s) failed:${failureDetails}`
        );
      }
    });
  });
});
