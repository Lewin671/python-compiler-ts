# Iteration: Recursive List Repr
**Date:** 2026-01-17
**Target:** Python recursive data structure string representation

## Exploit Hypothesis
Python's `repr()` and `str()` (and the `print()` function) handle recursive data structures by detecting cycles and using `[...]` or `{...}` placeholders. A TypeScript-based VM that naively recurses through lists to generate their string representation will fail with a `RangeError: Maximum call stack size exceeded` when encountering a self-referential list.

## Adversarial Code
```python
l = [1]
l.append(l)
print(l)
```

## Outcome
- **CPython Output:** `[1, [...]]`
- **Compiler Result:** `FAIL`
- **Error:** `RangeError: Maximum call stack size exceeded` at `pyRepr (src/vm/value-utils.ts:98:25)`

## Lessons Learned
The VM's value utilities lack cycle detection during stringification. To fix this, `pyRepr` should track visited objects (using a `Set` or similar) to identify recursion and return the standard Python ellipsis notation instead of descending infinitely.

## Solution
Implemented cycle detection in `pyRepr` using a `Set` to track container objects currently being processed in the recursion stack. When a cycle is detected, it returns standard Python ellipsis markers (`[...]`, `(...)`, or `{...}`) based on the container type. This prevents the `RangeError` and matches CPython's behavior for recursive structures.

