# Iteration: UnboundLocalError Fix

## Goal
Implement proper scope analysis to handle `UnboundLocalError` in Python.

## Changes
- **src/vm/runtime-types.ts**: 
    - Added `locals` set to `Scope` class.
    - Updated `Scope.get` to throw `UnboundLocalError` if a name is in `locals` but not in `values`.
    - Added `localNames` set to `PyFunction` class.
- **src/vm/value-utils.ts**:
    - Implemented `findLocalVariables` function to perform static analysis on AST blocks to identify local variables (assigned names, function/class defs, imports, etc.), excluding names declared as `global` or `nonlocal`.
- **src/vm/statements.ts**:
    - Updated `FUNCTION_DEF` to use `findLocalVariables` and store the results in the `PyFunction` object.
- **src/vm/callable.ts**:
    - Updated `callFunction` to populate the `locals` set of the new scope from the function's `localNames`.
- **src/vm/builtins.ts**:
    - Added `UnboundLocalError` (subclass of `NameError`) to the builtins.

## Outcome
The compiler now correctly identifies local variables at function definition time and raises `UnboundLocalError` at runtime if they are accessed before being assigned, matching Python's behavior. `examples/compiler_killer_unbound_local.py` now passes.
