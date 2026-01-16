# compiler-runtime: starred unpacking parse failure

- Date: 2026-01-16
- Stage: test
- Status: open

## Problem / Symptom
Parser throws "Unexpected token in expression: *" when encountering starred assignment unpacking.

## Impact / Risk
Example files using starred unpacking cause the compiler test suite to fail.

## Current Understanding
CPython accepts `a, *middle, b = [1,2,3,4,5]`, but the TypeScript parser rejects `*` in assignment targets.

## Next Steps
Add starred assignment target support or document it as unsupported and exclude such examples.

## Evidence (optional)
- Tests: `./scripts/verify.sh`
- Logs: tests/compiler.test.ts reports "Unexpected token in expression: *"
