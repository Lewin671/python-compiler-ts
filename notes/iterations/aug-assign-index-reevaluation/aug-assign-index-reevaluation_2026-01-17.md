# Iteration: Augmented Assignment Index Re-evaluation
**Date:** 2026-01-17
**Target:** Python augmented assignment (`+=`) evaluation order and side effects.

## Exploit Hypothesis
In Python, for an augmented assignment like `x[get_idx()] += 1`, the target expression `x[get_idx()]` is evaluated only once to determine the object and the key. The VM should fetch the value, perform the addition, and store it back using the *same* object and key without re-evaluating `get_idx()`. If the VM re-evaluates the index during the store phase, it will cause multiple side effects and potentially store to the wrong location.

## Adversarial Code
```python
# Exploit: Re-evaluation of index in augmented assignment
i = 0
def get_idx():
    global i
    res = i
    i += 1
    return res

x = [0, 0]
x[get_idx()] += 1
print(f"x: {x}, i: {i}")
```

## Outcome
- **CPython Output:** 
  ```
  x: [1, 0], i: 1
  ```
- **Compiler Result:** `FAIL`
- **Actual Output:**
  ```
  x: [0, 1], i: 2
  ```

## Lessons Learned
The VM's implementation of augmented assignment on subscription targets is likely decomposing `x[i] += 1` into something like `tmp = x[i]; x[i] = tmp + 1`, where `i` is evaluated twice. In Python bytecode, `BINARY_SUBSCR` followed by `INPLACE_ADD` and `STORE_SUBSCR` should share the same index/target on the stack or use specialized instructions that handle the duplication correctly without side-effecting twice.

## Solution
Ensure that during augmented assignment, the target's components (like the index in a subscript or the object in an attribute access) are evaluated only once and reused for both the fetch and the store operations.
