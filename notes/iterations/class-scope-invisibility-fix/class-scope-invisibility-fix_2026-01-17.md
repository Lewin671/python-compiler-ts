# Class Scope Invisibility Fix

## Problem
Python class bodies are not accessible scopes for nested functions, generator expressions, or list/dict/set comprehensions. Variable lookups in these nested scopes should skip any enclosing class scopes and look directly in the global or enclosing function scope.

## Solution
1. Modified `Scope.get` in `src/vm/runtime-types.ts` to skip parent scopes that have `isClassScope: true`.
2. Modified `Scope.set` and `Scope.findScopeWith` to also skip class scopes when searching for `nonlocal` bindings.
3. Added missing built-in exceptions (`NameError`, `AttributeError`, `StopIteration`) to `src/vm/builtins.ts` to ensure they are available for exception handling in Python code.

## Impact
- Correctly implements Python's unique scoping rules for class bodies.
- Fixes failures where nested comprehensions incorrectly accessed class-level variables.
- Improves compatibility with standard Python exception handling by providing more built-in exception classes.
