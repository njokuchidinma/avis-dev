# Avis Documentation

Avis is a developer tool that helps add capabilities to an existing project safely.

Instead of asking users to remember individual package names, Avis is designed around what the developer wants to add:

- state management
- data fetching
- forms
- validation
- API tooling

Avis detects the project, finds compatible integrations, previews the exact changes, asks for confirmation, applies the changes, and verifies the result.

## Core Idea

Avis is capability-first.

Preferred:

```bash
avis add state-management
avis add data-fetching
avis add forms
avis add validation
avis add api
```

Advanced/direct:

```bash
avis add zustand
avis add tanstack-query
avis add react-hook-form
avis add zod
avis add django-rest-framework
```

Direct integration names are still useful for repeatable scripts, documentation, and developers who already know which tool they want. The main product experience should teach users to ask for the capability first.

## How `avis add` Works

Run Avis inside an existing project:

```bash
avis add state-management
```

Avis will:

1. Detect the current project.
2. Match compatible integrations for the requested capability.
3. If one compatible integration exists, generate a ChangePlan for it.
4. If multiple compatible integrations exist, show the available options.
5. Preview the exact dependency, file, and patch operations.
6. Ask for confirmation.
7. Apply the accepted changes.
8. Run verification checks.

Example flow:

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

Avis should not silently modify a project.

## Supported Capabilities In Core v1

### State Management

Command:

```bash
avis add state-management
```

Current integration:

- Zustand for Next.js projects

What Avis configures:

- installs `zustand`
- creates a starter store file
- verifies dependency and store presence

Direct shortcut:

```bash
avis add zustand
```

### Data Fetching

Command:

```bash
avis add data-fetching
```

Current integration:

- TanStack Query for Next.js projects

What Avis configures:

- installs `@tanstack/react-query`
- creates a QueryClient provider module
- verifies dependency and provider presence

Direct shortcut:

```bash
avis add tanstack-query
```

### Forms

Command:

```bash
avis add forms
```

Current integration:

- React Hook Form for Next.js projects

What Avis configures:

- installs `react-hook-form`
- creates a starter form component
- verifies dependency and component presence

Direct shortcut:

```bash
avis add react-hook-form
```

### Validation

Command:

```bash
avis add validation
```

Current integration:

- Zod for Next.js projects

What Avis configures:

- installs `zod`
- creates a starter schema module
- verifies dependency and schema presence

Direct shortcut:

```bash
avis add zod
```

### API

Command:

```bash
avis add api
```

Current integration:

- Django REST Framework for Django projects

What Avis configures:

- installs `djangorestframework`
- adds `rest_framework` to `INSTALLED_APPS`
- verifies dependency and Django settings configuration

Direct shortcut:

```bash
avis add django-rest-framework
```

## Inspecting What Avis Supports

List capabilities and integrations:

```bash
avis list
```

Show details for an integration:

```bash
avis show tanstack-query
```

Show integrations for a capability:

```bash
avis show state-management
```

`avis show` reads integration metadata. It does not need to run inside a supported target project.

## Checking Project Health

Run:

```bash
avis doctor
```

Avis doctor reports integration health:

- `NOT INSTALLED`: compatible with the project, but not added yet
- `HEALTHY`: dependency and expected configuration are present
- `PARTIAL`: dependency is present, but expected configuration is missing
- `BROKEN`: Avis found a failing installed/configured integration check
- `UNKNOWN`: Avis could not determine health safely

Important: not installed is not broken.

Example:

```text
Avis Project Health

Detected:
Framework: nextjs
Language: typescript
Ecosystem: node
Package manager: pnpm

Summary: healthy: 1, not installed: 3

HEALTHY

TanStack Query
Verification:
OK dependency installed
OK provider detected

NOT INSTALLED

Zustand
Verification:
SKIP dependency installed - zustand is not installed. (Run avis add zustand.)
```

## Safe ChangePlans

Avis applies changes through ChangePlans.

A ChangePlan may include:

- dependency additions
- new files
- text patches

Before applying, Avis prints the plan and asks for confirmation.

Running the same command twice should be idempotent. If the project is already configured, Avis should report:

```text
No changes required.
```

## Current Project Support

Core v1 supports:

- Node / Next.js
- Python / Django

Core v1 has IDs prepared for additional ecosystems, but those are not fully implemented yet:

- PHP
- Dart / Flutter
- Go
- Java / JVM

The next ecosystem-proofing phase should add a more complex Django integration, such as Celery, before expanding to Flutter/Dart.

## Development Usage In This Repo

Avis is not globally installed during local development. From the Avis repository root, use:

```bash
CI=true pnpm build
CI=true pnpm avis -- list
CI=true pnpm avis -- show state-management
CI=true pnpm avis -- doctor
```

Manual test scripts are documented in `test-doc.md`.

## Product Direction

The intended user experience is:

```bash
avis add <capability>
```

The user should not need to know whether the right answer is Zustand, TanStack Query, React Hook Form, Zod, or Django REST Framework.

Avis should understand the project and offer compatible choices.

Direct integration commands should remain available, but they are secondary.
