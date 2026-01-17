# Tuple Augmented Assignment Failure
**Date:** 2026-01-17
**Test Case:** `examples/compiler_killer_tuple_assign.py`

## Observation
When executing `t[0] += [20]` where `t` is `([10],)`:
- **CPython**: Modifies the list to `[10, 20]` AND raises `TypeError` (tuple is immutable).
- **TS Compiler**: Modifies the list to `[10, 20]` but **raises NO error**.

## Root Cause Analysis
The compiler likely treats `+=` on a mutable object (like a list) purely as an in-place operation (calling `__iadd__` or `extend`) without performing the mandatory re-assignment step `t[0] = result`. In Python, `+=` is always an assignment, causing a write attempt to the tuple index, which must fail.

## Secondary Issue
A parser bug was observed where placing a comment (`# ...`) as the first line of a `try` block caused an `Expected INDENT` error. The comment had to be removed to run the semantic test.

## Resolution
1.  **Enforced Tuple Immutability**:
    -   Modified `assignTarget` and `deleteTarget` in `src/vm/statements.ts` to check for `__tuple__` property on the target object.
    -   Now raises `TypeError` if attempting to assign to or delete from a tuple item.

2.  **Implemented In-Place Operation**:
    -   Added `applyInPlaceBinary` in `src/vm/operations.ts` to handle in-place modification for lists (e.g., `+=`).
    -   This ensures that `t[0] += [20]` modifies the list inside the tuple *before* the assignment back to the tuple fails.

3.  **Fixed TRY_STATEMENT Logic**:
    -   Corrected `TRY_STATEMENT` execution flow in `src/vm/statements.ts`.
    -   `orelse` block is now only executed if NO exception was raised in the `try` block (previously it ran unconditionally if `catch` didn't re-throw).