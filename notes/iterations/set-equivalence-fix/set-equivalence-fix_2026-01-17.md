# Set and Dictionary Equivalence Fix

## Problem
The compiler was using native JavaScript `Set` and naive mapping for dictionaries, which led to incorrect behavior for Python-style equivalence.
- `{1, True}` resulted in a set of size 2 in JS, but should be size 1 in Python because `1 == True`.
- `NaN` values were being merged even if they were distinct objects, but Python treats different `NaN` objects as distinct in sets/dicts because `NaN != NaN`.

## Solution
1. Implemented `PySet` in `src/vm/runtime-types.ts` with custom hashing/id logic similar to `PyDict`.
2. Updated `PySet` and `PyDict` to handle numeric normalization:
   - `True` and `False` are normalized to `1` and `0`.
   - Integers and floats that are equal (like `1` and `1.0`) are normalized to the same string ID.
   - `NaN` values are handled by using their object identity (`id: value` in `objectStore`) because they don't equal themselves.
3. Updated `PySet.add` to keep the first added key among equivalent keys.
4. Updated all VM components to use `PySet` instead of native JS `Set`:
   - `src/vm/builtins.ts`
   - `src/vm/expressions.ts`
   - `src/vm/operations.ts`
   - `src/vm/truthy.ts`
   - `src/vm/value-utils.ts`
   - `src/vm/execution.ts`

## Verification
- `examples/compiler_killer_set_equivalence.py` now passes (len1: 1, len2: 1, len3: 1).
- `examples/nan_set.py` now passes (len: 2 for distinct NaN objects).
- All other tests passed.