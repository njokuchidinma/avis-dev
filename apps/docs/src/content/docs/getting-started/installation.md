---
title: Installation
description: Install Avis as a machine-level CLI and use it inside supported projects.
---

Avis is a machine-level developer CLI. Install it once on your computer, then run `avis` from inside any supported project.

During alpha, npm is the first distribution channel:

```sh
npm install -g avis-dev@alpha
```

Verify the command is available:

```sh
avis list
```

## Important Distinction

There are two separate package-management concerns:

1. How you install the Avis CLI on your machine.
2. How Avis installs dependencies into your target project.

Avis may be installed through npm because the CLI is currently built with TypeScript and Node.js. That does not make Avis a Node dependency of your Django, Flutter, Laravel, Rust, Go, or other target project.

Do not add Avis to:

- `requirements.txt`
- `pyproject.toml`
- `composer.json`
- `pubspec.yaml`
- `Cargo.toml`
- application package manifests for target projects

## Use Avis Inside a Project

After installation, enter an existing project:

```sh
cd my-next-app
avis doctor
avis add zustand
```

Or:

```sh
cd my-django-project
avis doctor
avis add django-rest-framework
```

When Avis adds an integration, it uses the target project's native package manager. For example, Next.js uses npm, pnpm, yarn, or bun. Django uses pip, uv, or Poetry.

## Local Development Install

If you are working from source instead of the npm alpha package, clone the repository and build locally:

Clone the repository and install dependencies:

```sh
git clone https://github.com/njokuchidinma/avis-dev.git
cd avis-dev
pnpm install
pnpm build
```

Run the CLI through the root script:

```sh
pnpm avis
```

Or run the built CLI directly:

```sh
node packages/cli/dist/index.js
```

## Try Avis Inside Another Project

Build Avis first, then run the built CLI from the project you want to inspect:

```sh
cd path/to/my-next-app
node path/to/avis-dev/packages/cli/dist/index.js
```
