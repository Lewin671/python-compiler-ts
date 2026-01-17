# Iteration Report: Class Scope Invisibility
**Date:** 2026-01-17
**Test Case:** `examples/compiler_killer_class_scope.py`

## Exploit Hypothesis
Python class bodies are not accessible scopes for nested functions, generator expressions, or list/dict/set comprehensions. Any variable lookup inside a comprehension defined within a class should skip the class scope and look directly in the global/enclosing scope. If the variable is not found there, a `NameError` should be raised, even if the variable exists in the class body.

## Code
```python
print("--- Class Scope Invisibility ---")
try:
    class Test:
        secret = "class_var"
        # Comprehension creates a new scope.
        # It should NOT see 'secret' from the class body.
        data = [secret for _ in [1]]
    print(f"FAILURE: Accessed class variable: {Test.data}")
except NameError:
    print("SUCCESS: NameError caught (Class scope correctly skipped)")
except Exception as e:
    print(f"FAILURE: Wrong exception: {type(e).__name__}")
```

## Results
**Status:** ❌ FAILED (As expected for an adversarial test)

**Expected Output (CPython):**
```
--- Class Scope Invisibility ---
SUCCESS: NameError caught (Class scope correctly skipped)
```

**Actual Output (TS Compiler):**
```
--- Class Scope Invisibility ---
FAILURE: Accessed class variable: ['class_var']
```

## Analysis
The TypeScript compiler incorrectly implements standard lexical scoping for class bodies. It treats the class body as a parent scope for the list comprehension, allowing the comprehension to resolve `secret` to the class variable `Test.secret` ("class_var").

In CPython, class scopes are "special" and are not part of the scope chain for nested code blocks (except for the class body itself). The comprehension should look for `secret` in the global scope (since there is no other enclosing function), fail to find it, and raise `NameError`.
