# Augmented Assignment Index Re-evaluation Fix

## Problem
In Python, augmented assignments like `x[get_idx()] += 1` should evaluate the target's base and index only once. The previous implementation evaluated the target twice: once to get the current value and once to assign the result back. This caused side effects in the index expression (like `get_idx()`) to be executed twice.

## Solution
Modified `src/vm/statements.ts` to handle `ASTNodeType.AUG_ASSIGNMENT` by manually evaluating the target components (object and index/attribute) once, performing the operation, and then assigning back using the already evaluated components.

## Impact
- Correctly handles side effects in augmented assignment targets (subscripts and attributes).
- Prevents double evaluation of indices and object expressions.
