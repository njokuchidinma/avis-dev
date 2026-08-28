---
title: Project Detection
description: How Avis identifies the current project.
---

Avis detects projects from the current working directory.

## Node Detection

Avis detects a Node project when it finds `package.json`.

It detects package managers from:

- `packageManager` in `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `npm-shrinkwrap.json`
- `yarn.lock`
- `bun.lock`
- `bun.lockb`

It detects Next.js from:

- a `next` dependency
- `next.config.js`
- `next.config.mjs`
- `next.config.ts`

It detects TypeScript from `tsconfig.json` or a `typescript` dependency. Otherwise it treats the project as JavaScript.

## Python Detection

Avis detects a Python project from:

- `pyproject.toml`
- `requirements.txt`
- `manage.py`
- `uv.lock`
- `poetry.lock`

It detects Django from:

- `manage.py`
- Django dependency metadata in `pyproject.toml` or `requirements.txt`

It detects package managers from `uv.lock`, `poetry.lock`, Poetry metadata, and `requirements.txt`.
