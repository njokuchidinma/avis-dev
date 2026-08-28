# Avis

Equip your project after init.

Avis is a source-available, ecosystem-agnostic CLI that safely adds, configures, and verifies common development capabilities inside existing software projects.

Framework scaffolders create the project. Avis equips it.

```txt
$ npm install -g avis-dev@alpha
$ cd my-next-app
$ avis add state-management

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

Install Avis once on your machine:

```sh
npm install -g avis-dev@alpha
```

Then run `avis` inside any supported project:

```sh
cd my-next-app
avis doctor
avis add state-management
```

Avis itself is not an application dependency. Do not add Avis to `requirements.txt`, `pyproject.toml`, `composer.json`, `pubspec.yaml`, `Cargo.toml`, or equivalent project dependency files.

During alpha, npm is the distribution channel for the Avis CLI. When Avis operates inside a project, it uses that project's native package manager.

## Local Development

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
avis add state-management
avis doctor
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

For example, `avis add state-management` currently resolves to Zustand in compatible Next.js projects because Zustand is the only built-in state-management integration today. The public workflow stays capability-first while integration pages document the concrete tool Avis selects.

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

Avis is not ready for broad external code contributions yet. Issues, feedback, and early adopter reports are welcome once the project owner opens the relevant GitHub channels.

The repository includes contributor-oriented docs so the project can open up cleanly later. New official integrations should eventually include implementation, verification, tests, and documentation.

## Project Status

Avis is alpha software in active development. Use it inside projects tracked with version control and review ChangePlans before applying changes.

## License

Avis is source-available under the PolyForm Noncommercial License 1.0.0. You may inspect, use, modify, and share the software for noncommercial purposes under the license terms. Commercial use, resale, paid redistribution, or selling Avis as a product requires a separate commercial license from the project owner.
