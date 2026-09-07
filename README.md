# Avis

Equip your project after init.

Avis is a source-available, ecosystem-agnostic CLI that safely adds, configures, and verifies common development capabilities inside existing software projects.

Framework scaffolders create the project. Avis equips it.

[Documentation](https://avis-dev.vercel.app/) | [GitHub](https://github.com/njokuchidinma/avis-dev)

```txt
$ npm install -g avis-dev@alpha
$ cd my-next-app
$ avis search icons

Search results for "icons":
- capability: icons (Icons) - Icon libraries and icon systems for application interfaces.
- integration: lucide-react (Lucide React) - A consistent, tree-shakeable outline icon system for React interfaces.

$ avis add icons

Detected:
Framework: nextjs
Language: typescript
Ecosystem: node
Package manager: pnpm

Recommendation:
Use lucide-react for icons.

Avis will make these changes:

Dependencies
+ lucide-react

Apply changes? Yes
OK Installed lucide-react.

Verification:
OK dependency installed
```

## Why Avis?

After `create-next-app`, `django-admin startproject`, `rails new`, `cargo new`, or another framework initializer, developers still repeat the same setup work: state management, data fetching, forms, validation, API tooling, and more.

Avis detects the project you already have, recommends compatible integrations, previews planned changes, asks before applying them, and verifies the result.

Avis is capability-first. Prefer asking for the purpose:

```sh
avis add icons
avis add validation
avis add state-management
```

Avis can then recommend a compatible integration and show alternatives. Exact tool names such as `avis add lucide-react` still work when you already know what you want.

## What's New in V3.1 Alpha

V3.1 focuses on making Avis sturdier before broader release. The biggest changes are about truthful capability depth, safer repairs, and stronger release checks.

- Integration setup is now classified as `install`, `configure`, or `managed`.
- `avis repair` only runs for integrations with explicit repair-plan support.
- Repair fails closed when Avis detects user-modified managed files instead of overwriting them.
- Django REST Framework and django-cors-headers have managed setup and verification paths.
- Configure-level slices now cover Sentry, Redis, SQLAlchemy, email, storage, API docs, and Celery patterns across supported ecosystems.
- The release gate now packs the npm artifact, installs it into a clean temporary project, and exercises the shipped `avis` binary.
- Registry contracts and fixture QA verify detectable frameworks, managed integration requirements, and realistic Next.js/Django setup flows.

Avis is still alpha software, but V3.1 raises the bar from “can add integrations” to “can explain, verify, and safely constrain the work it performs.”

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
avis add icons --dry-run
```

Check the installed CLI version:

```sh
avis --version
```

Update an existing alpha install:

```sh
npm install -g avis-dev@alpha
```

Avis can print update instructions too:

```sh
avis upgrade
```

Avis itself is not an application dependency. Do not add Avis to `requirements.txt`, `pyproject.toml`, `composer.json`, `pubspec.yaml`, `Cargo.toml`, or equivalent project dependency files.

During alpha, npm is the distribution channel for the Avis CLI. When Avis operates inside a project, it uses that project's native package manager.

Before publishing a new alpha package, run:

```sh
pnpm release:check
```

This command builds the workspace, regenerates registry docs, validates catalog contracts, runs type checks/lint/tests, builds docs, packs the npm artifact, installs the generated tarball into a temporary project, and smoke-tests the shipped CLI.

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

Install a capability by purpose:

```sh
cd my-next-app
avis search icons
avis add icons
avis doctor
```

Add state management the same way:

```sh
cd my-next-app
avis add state-management
avis doctor
```

Review the ChangePlan before confirming.

Stacks compose several capabilities into one preview:

```sh
avis stack show next-standard
avis stack use next-standard --dry-run
```

Search discovers capabilities, integrations, and stacks:

```sh
avis search icons
avis show icons
```

## Current Supported Frameworks

| Framework | Status | Purpose commands | Default integrations |
| --- | --- | --- | --- |
| Next.js | Alpha | `state-management`, `data-fetching`, `forms`, `validation`, `icons`, `auth`, `monitoring` | Zustand, TanStack Query, React Hook Form, Zod, Lucide React, Auth.js, Sentry |
| Django | Alpha | `api`, `rest-api`, `security`, `background-jobs`, `caching`, `email`, `storage`, `api-documentation`, `monitoring` | Django REST Framework, django-cors-headers, Celery, django-redis, django-anymail, django-storages, drf-spectacular, Sentry |
| Laravel | Alpha | `auth`, `authentication`, `api-auth` | Laravel Sanctum |
| Flutter | Alpha | `state-management`, `state`, `stores` | Flutter Riverpod |
| Rust | Alpha | `observability`, `logging`, `tracing` | Rust tracing |

## Current Integration Highlights

- `zustand`
- `redux-toolkit`
- `tanstack-query`
- `zod`
- `react-hook-form`
- `next-auth`
- `sentry-nextjs`
- `django-rest-framework`
- `django-cors-headers`
- `celery`
- `django-redis`
- `django-storages`
- `django-anymail`
- `drf-spectacular`
- `sentry-python`
- `laravel-sanctum`
- `flutter-riverpod`
- `rust-tracing`
- `lucide-react`
- `react-icons`
- `heroicons-react`

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

For example, `avis add icons` in a compatible Next.js project recommends Lucide React and shows React Icons and Heroicons as alternatives. The public workflow stays capability-first while integration pages document the concrete tool Avis selects.

Avis V3.1 also distinguishes setup depth:

- `install`: Avis installs a compatible package.
- `configure`: Avis installs and creates useful starter configuration.
- `managed`: Avis can install, configure, verify, diagnose drift, and produce supported repair plans.

`avis repair` is intentionally conservative. It requires explicit repair-plan support and checks Avis' recorded file hashes before mutating previously managed files. If a file has changed outside Avis, repair stops and asks for manual review instead of guessing.

## Avis Doctor

`avis doctor` checks the actual project state. Dependency presence alone does not mean an integration is healthy.

For example, a Next.js project with `@tanstack/react-query` installed but no Avis-recognized provider module is partially configured, not healthy.

For CI, use:

```sh
avis doctor --json
avis doctor --strict
```

Avis records successful applies in `.avis/state.json`, but project inspection remains the source of truth.

Generated registry docs can be refreshed from manifests:

```sh
pnpm docs:generate-registry
```

## Documentation

Read the public documentation at [avis-dev.vercel.app](https://avis-dev.vercel.app/).

The documentation source lives in `apps/docs` and is built with Astro + Starlight.

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
