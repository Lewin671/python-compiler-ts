# Iteration: BigInt and Float Precision Discrepancy

## Case Tested
Comparison between a large integer (beyond 2^53) and its float representation.

```python
x = 2**60 + 1
y = float(x)
print(x == y)
```

## Outcome
- **CPython**: Outputs `False` (correctly distinguishes 1152921504606846977 and 1152921504606846976.0).
- **TypeScript VM**: Outputs `False` (Fixed).

## Learned
1. The VM uses `BigInt` for large integers, but `numericEquals` and `numericCompare` previously converted both operands to JS `number` when one was a float, causing precision loss.
2. JavaScript's built-in comparison operators (`==`, `<`, etc.) correctly handle comparisons between `BigInt` and `number` based on their mathematical values without precision loss.
3. Boxed `Number` objects and `boolean` values need to be unboxed/converted to their primitive numeric type (number or bigint) before leveraging JS's built-in comparison to avoid `TypeError` or incorrect loose equality results for non-numeric types.
4. `PyDict` and `PySet` key normalization was using `String(value)`, which produces scientific notation for large floats (e.g., `"1e+21"`) but full integer strings for BigInts (e.g., `"1000000000000000000000"`), leading to unequal IDs for mathematically equal values.

## Fixed
1. Updated `numericEquals` and `numericCompare` in `src/vm/value-utils.ts` to unbox values and use JS's native comparison between `BigInt` and `number`.
2. Simplified `src/vm/expressions.ts` to use the updated `numericCompare` results directly.
3. Updated `PyDict` and `PySet` in `src/vm/runtime-types.ts` to normalize all integer-like numeric keys to `BigInt` before stringifying for the internal ID, ensuring that `10**21` and `10.0**21` share the same key.
