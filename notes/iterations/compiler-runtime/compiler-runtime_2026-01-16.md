# compiler-runtime: Starred assignment unpacking

- Date: 2026-01-16
- Stage: test
- Status: resolved

## Problem / Symptom

Tests failed parsing assignment targets with starred unpacking (e.g., `a, *middle, b = values`) and raised "Unexpected token in expression: *".

## Impact / Risk

Example files using starred unpacking could not be parsed or executed, blocking `scripts/verify.sh`.

## Current Understanding

Parser did not allow `*` in assignment targets and VM assignment logic only handled fixed-length tuple/list destructuring. Added a STARRED AST node for targets, parsed it in assignment targets, and implemented unpacking logic in the VM with iterable normalization.

## Next Steps

None. Re-run verify if adding more starred assignment cases.

## Evidence (optional)
- Tests: `scripts/verify.sh`
