# Avis Manual Test Notes

This document tracks the repeatable manual tests we add as Avis grows.

## Prerequisites

From the Avis repository root:

```bash
CI=true pnpm install
CI=true pnpm build
```

`CI=true` avoids pnpm prompting in non-interactive terminals.

## Test 1: Next.js + Zustand First Slice

This test exercises the current end-to-end flow:

- detect a Next.js-like Node project
- detect `pnpm`
- generate a Zustand `ChangePlan`
- preview changes
- ask for confirmation
- apply safe file changes
- verify the result
- rerun without duplicating the store

### A. Preview The Plan Without Applying

Create a disposable fixture without Zustand installed:

```bash
CI=true pnpm test:manual:zustand -- fresh
```

Run Avis:

```bash
CI=true pnpm test:manual:zustand -- run
```

Expected preview:

```text
Detected:
Framework: nextjs
Language: typescript
Ecosystem: node
Package manager: pnpm

Avis will make these changes:

Dependencies
+ zustand
Files
+ src/stores/index.ts

Apply changes? [y/N]
```

Answer `n`.

Expected result:

```text
Cancelled.
```

Confirm nothing changed:

```bash
CI=true pnpm test:manual:zustand -- show
```

### B. Apply Without Network

The real dependency install path runs `pnpm add zustand`, which may need network access.
For the first local test, use a fixture that already lists `zustand` in `package.json`.
This lets Avis apply the file operation and verify idempotence without installing packages.

Create the fixture:

```bash
CI=true pnpm test:manual:zustand -- installed
```

Run Avis:

```bash
CI=true pnpm test:manual:zustand -- run
```

Expected preview:

```text
Avis will make these changes:

Files
+ src/stores/index.ts

Apply changes? [y/N]
```

Answer `y`.

Expected result includes:

```text
OK Created src/stores/index.ts.

Verification:
OK dependency installed
OK store detected
```

Inspect the created store:

```bash
CI=true pnpm test:manual:zustand -- show
```

### C. Rerun For Idempotence

Run Avis again:

```bash
CI=true pnpm test:manual:zustand -- run
```

Expected result:

```text
Avis will make these changes:

No changes required.

No changes required.

Verification:
OK dependency installed
OK store detected
```

The duplicate "No changes required." text is current CLI behavior and can be polished later.

### D. Optional Real Install Test

If you want to test actual package installation, use the fresh fixture:

```bash
CI=true pnpm test:manual:zustand -- fresh
CI=true pnpm test:manual:zustand -- run
```

Answer `y`.

Avis will run:

```bash
pnpm add zustand
```

This requires network access unless the package is already cached.
