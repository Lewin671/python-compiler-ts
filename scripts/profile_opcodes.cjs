#!/usr/bin/env node
const { PythonCompiler } = require('../dist/index.js');

// Test programs
const testPrograms = [
  {
    name: "Fibonacci(30)",
    code: `
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)
print(fib(30))
`
  },
  {
    name: "Nested Loops",
    code: `
total = 0
for i in range(1118):
    for j in range(1118):
        total += i * j
print(total)
`
  }
];

const compiler = new PythonCompiler();

console.log("Running opcode frequency analysis...\n");

testPrograms.forEach(({ name, code }) => {
  console.log(`\n=== ${name} ===`);
  try {
    const start = process.hrtime.bigint();
    compiler.run(code);
    const end = process.hrtime.bigint();
    console.log(`Time: ${Number(end - start) / 1_000_000}ms`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
});
