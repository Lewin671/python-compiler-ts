# Iteration: UnboundLocalError and Scope Resolution

## Exploit Hypothesis
Python determines variable scope at compile-time. If a name is assigned to anywhere within a function's body, it is treated as a local variable for the entire scope of that function. Accessing such a variable before its assignment should raise an `UnboundLocalError`, even if a global variable with the same name exists.

## Adversarial Code
```python
x = "global"

def test():
    try:
        # Should raise UnboundLocalError because 'x' is local due to 'x = "local"' below
        print(x)
    except UnboundLocalError:
        print("Caught UnboundLocalError")
    except NameError:
        print("Caught NameError")
    except Exception as e:
        print(f"Caught {type(e).__name__}")
    
    x = "local"

test()
print(f"Global x remains: {x}")
```

## Outcome
- **CPython Output:**
  ```
  Caught UnboundLocalError
  Global x remains: global
  ```
- **TypeScript Compiler Output:**
  ```
  global
  Global x remains: global
  ```

## Findings
The TypeScript implementation incorrectly resolves the variable `x` to the global scope when it is accessed before its local assignment. This indicates that the compiler/VM is resolving names dynamically at runtime based on the current execution state, rather than performing the static scope analysis required by Python semantics. Specifically, it lacks the logic to mark names as local to a block if they appear as targets of an assignment within that block.
