# Avis

Equip your project after init.

Avis is a source-available, ecosystem-agnostic CLI that safely adds, configures, and verifies common development capabilities inside existing software projects.

Framework scaffolders create the project. Avis equips it.

```txt
$ avis add zustand

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

Apply changes? Yes
OK Installed zustand.
OK Created src/stores/index.ts.

Verification:
OK dependency installed
OK store detected
```

## Why Avis?

After `create-next-app`, `django-admin startproject`, `rails new`, `cargo new`, or another framework initializer, developers still repeat the same setup work: state management, data fetching, forms, validation, API tooling, and more.

Avis detects the project you already have, recommends compatible integrations, previews planned changes, asks before applying them, and verifies the result.

## Installation

Avis is currently in active development and is not documented here as a published global package yet.

Local development flow:

```sh
pnpm install
pnpm build
pnpm avis
```

To run Avis from another project:

```sh
cd path/to/project
node path/to/avis-dev/packages/cli/dist/index.js
```

## 30-Second Quick Start

```sh
cd my-next-app
node path/to/avis-dev/packages/cli/dist/index.js add zustand
node path/to/avis-dev/packages/cli/dist/index.js doctor
```

Review the ChangePlan before confirming.

## Current Supported Frameworks

| Framework | Status | Integrations |
| --- | --- | --- |
| Next.js | Alpha | Zustand, TanStack Query, Zod, React Hook Form |
| Django | Alpha | Django REST Framework |

## Current Integrations

- `zustand`
- `tanstack-query`
- `zod`
- `react-hook-form`
- `django-rest-framework`

## How Avis Works

```txt
existing project
-> detect project
-> choose capability or integration
-> preview ChangePlan
-> confirm
-> apply
-> verify
```

## ChangePlan Safety Model

Before Avis changes a project, integrations generate a ChangePlan. Avis validates the plan and displays the dependency, file, configuration, or environment operations before asking for confirmation.

## Avis Doctor

`avis doctor` checks the actual project state. Dependency presence alone does not mean an integration is healthy.

For example, a Next.js project with `@tanstack/react-query` installed but no Avis-recognized provider module is partially configured, not healthy.

## Documentation

The documentation site lives in `apps/docs` and is built with Astro + Starlight.

```sh
pnpm docs:dev
pnpm docs:build
```

## Contributing

New official integrations should include implementation, verification, tests, and documentation.

Start with the docs in `apps/docs/src/content/docs/contributing`.

## Project Status

Avis is alpha software in active development. Use it inside projects tracked with version control and review ChangePlans before applying changes.

## License

This repository is currently marked `UNLICENSED`.
