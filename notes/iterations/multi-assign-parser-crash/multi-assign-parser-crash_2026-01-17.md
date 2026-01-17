# Iteration: Multi-Assignment Parser Crash
**Date:** 2026-01-17
**Target:** Multiple targets in a single assignment statement (`a = b = c`).

## Exploit Hypothesis
Python supports assigning a value to multiple targets in a single statement (e.g., `a = b = 1` or `a[0] = b[0] = 1`). The parser should be able to handle consecutive `=` tokens in an assignment.

## Adversarial Code
```python
a = [0]
b = [0]
a[0] = b[0] = 1
print(f"a: {a}, b: {b}")
```

## Outcome
- **CPython Output:** 
  ```
  a: [1], b: [1]
  ```
- **Compiler Result:** `CRASH`
- **Error message:** `Error: Unexpected token type for literal: ASSIGN`

## Lessons Learned
The parser's expression/statement logic is likely too restrictive and doesn't handle multiple assignment targets. It seems to misinterpret the second `=` as part of an expression (maybe trying to parse a literal where it sees the assignment operator).

## Solution
Update the parser to support multiple assignment targets by allowing a chain of assignments before the final expression.
