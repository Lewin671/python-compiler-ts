# Iteration: List Sort Mutation Fix - 2026-01-17

## Problem
The Python compiler (python-compiler-ts) failed to raise a `ValueError` when a list was modified during its `sort()` method, specifically within the `key` function. Python's `list.sort()` is designed to detect such mutations and raise `ValueError: list modified during sort`.

## Analysis
The `list.sort()` implementation in `src/vm/operations.ts` used `Array.prototype.map()` and `Array.prototype.sort()` without tracking if the underlying list was modified during the execution of the `key` function or the sorting process itself.

## Solution
1. Modified the `sort` method in `src/vm/operations.ts` to:
    - Capture the `initialLength` of the list before starting.
    - Use a manual `for` loop to evaluate the `key` function for each item.
    - After each `key` function call, check if `obj.length` has changed.
    - If a change is detected, throw a `PyException('ValueError', 'list modified during sort')`.
    - Also added checks after the internal `sort()` call and before updating the original list.

## Verification
The test case `examples/compiler_killer_list_sort_mutation.py` now passes, as it correctly catches the `ValueError` thrown by the VM when `L.append(x)` is called within the `key_func`.

```python
# examples/compiler_killer_list_sort_mutation.py
L = [3, 1, 2]
def key_func(x):
    L.append(x)
    return x

try:
    L.sort(key=key_func)
    print("Failure: List modified during sort but no error raised")
except ValueError:
    print("Success: ValueError caught")
```

All tests passed with the fix.