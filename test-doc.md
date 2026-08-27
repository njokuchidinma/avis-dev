# Avis Manual Test Notes

This document tracks the repeatable manual tests we add as Avis grows.

## Prerequisites

From the Avis repository root:

```bash
CI=true pnpm install
CI=true pnpm build
```

`CI=true` avoids pnpm prompting in non-interactive terminals.

## Command Names

The intended product command is:

```bash
avis add zustand
```

Avis is not globally installed yet, so these manual tests use a wrapper script that calls the built CLI from inside a disposable fixture.

In the test script, `apply` means "run the built Avis CLI against the fixture":

```bash
CI=true pnpm test:manual:zustand -- apply
```

There is no intended `avis run` command right now.

Useful development shims from the Avis repo root:

```bash
CI=true pnpm avis --
CI=true pnpm avis -- list
CI=true pnpm avis -- doctor
```

`pnpm avis -- <args>` runs the built CLI directly.

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
CI=true pnpm test:manual:zustand -- apply
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
CI=true pnpm test:manual:zustand -- apply
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
CI=true pnpm test:manual:zustand -- apply
```

Expected result:

```text
Avis will make these changes:

No changes required.

Verification:
OK dependency installed
OK store detected
```

### D. Optional Real Install Test

If you want to test actual package installation, use the fresh fixture:

```bash
CI=true pnpm test:manual:zustand -- fresh
CI=true pnpm test:manual:zustand -- apply
```

Answer `y`.

Avis will run:

```bash
pnpm add zustand
```

This requires network access unless the package is already cached.

## Test 2: Next.js + TanStack Query

This test exercises:

- capability/direct integration routing for `data-fetching`
- dependency planning for `@tanstack/react-query`
- provider file creation
- idempotence
- doctor warnings/checks for Node integrations

### A. Apply Without Network

Create a fixture that already lists TanStack Query:

```bash
CI=true pnpm test:manual:query -- installed
```

Run Avis:

```bash
CI=true pnpm test:manual:query -- apply
```

Expected preview:

```text
Avis will make these changes:

Files
+ src/app/providers.tsx

Apply changes? [y/N]
```

Answer `y`.

Expected result includes:

```text
OK Created src/app/providers.tsx.

Verification:
OK dependency installed
OK provider detected
```

Rerun for idempotence:

```bash
CI=true pnpm test:manual:query -- apply
```

Expected result includes:

```text
No changes required.
```

Inspect the fixture:

```bash
CI=true pnpm test:manual:query -- show
```

Run doctor:

```bash
CI=true pnpm test:manual:query -- doctor
```

### B. Optional Real Install Test

```bash
CI=true pnpm test:manual:query -- fresh
CI=true pnpm test:manual:query -- apply
```

Answer `y`.

Avis will run:

```bash
pnpm add @tanstack/react-query
```

This requires network access unless the package is already cached.

## Test 3: Django + Django REST Framework

This test exercises:

- Python project detection
- Django detection
- `pip` detection through `requirements.txt`
- DRF dependency planning
- safe `settings.py` patching
- idempotence
- `avis doctor` for a Python/Django target

### A. Apply Without Network

Create a fixture that already lists DRF:

```bash
CI=true pnpm test:manual:drf -- installed
```

Run Avis:

```bash
CI=true pnpm test:manual:drf -- apply
```

Expected preview:

```text
Avis will make these changes:

Files
~ config/settings.py

Apply changes? [y/N]
```

Answer `y`.

Expected result includes:

```text
OK Patched config/settings.py.

Verification:
OK dependency installed
OK rest_framework configured
```

Rerun for idempotence:

```bash
CI=true pnpm test:manual:drf -- apply
```

Expected result includes:

```text
No changes required.
```

Inspect the fixture:

```bash
CI=true pnpm test:manual:drf -- show
```

Run doctor:

```bash
CI=true pnpm test:manual:drf -- doctor
```

### B. Optional Real Install Test

```bash
CI=true pnpm test:manual:drf -- fresh
CI=true pnpm test:manual:drf -- apply
```

Answer `y`.

Avis will run:

```bash
python -m pip install djangorestframework
```

This requires network access unless the package is already available locally.

## Test 4: Additional Next.js V1 Integrations

This test covers the broader V1 Next.js integrations added after the first slices:

- `zod` for validation
- `react-hook-form` for forms

### Zod

Create a fixture that already lists Zod:

```bash
CI=true pnpm test:manual:next -- zod installed
```

Run Avis:

```bash
CI=true pnpm test:manual:next -- zod apply
```

Answer `y`.

Expected result includes:

```text
OK Created src/schemas/index.ts.

Verification:
OK dependency installed
OK schema detected
```

Rerun for idempotence:

```bash
CI=true pnpm test:manual:next -- zod apply
```

Run doctor:

```bash
CI=true pnpm test:manual:next -- zod doctor
```

### React Hook Form

Create a fixture that already lists React Hook Form:

```bash
CI=true pnpm test:manual:next -- react-hook-form installed
```

Run Avis:

```bash
CI=true pnpm test:manual:next -- react-hook-form apply
```

Answer `y`.

Expected result includes:

```text
OK Created src/components/example-form.tsx.

Verification:
OK dependency installed
OK example form detected
```

Rerun for idempotence:

```bash
CI=true pnpm test:manual:next -- react-hook-form apply
```

Run doctor:

```bash
CI=true pnpm test:manual:next -- react-hook-form doctor
```

### Capability Routing

Inside a Next.js fixture, these should route to the single compatible integration for now:

```bash
node /Users/chidinmanjoku/Work/startups/avis-dev/packages/cli/dist/index.js add validation
node /Users/chidinmanjoku/Work/startups/avis-dev/packages/cli/dist/index.js add forms
```
