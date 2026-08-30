---
title: npm Release Checklist
description: Checks to run before publishing an Avis alpha package to npm.
---

Avis publishes the CLI package as `avis-dev` and exposes the `avis` binary.

During alpha, publish with the alpha tag:

```sh
npm publish --tag alpha
```

## Required Checks

Run the release check from the repository root:

```sh
pnpm release:check
```

This refreshes generated registry docs, generates the native target manifest, runs type checking, runs tests, builds the package and docs site, and performs an npm pack dry run.

The package also has publish guards:

- `prepack` builds the bundled CLI in `dist`.
- `prepublishOnly` runs type checking and tests before `npm publish`.

## Expected Package Contents

The npm package should stay small. The expected tarball contents are:

- `dist/index.js`
- `dist/index.js.map`
- `package.json`
- `README.md`
- `LICENSE.md`
- `NOTICE.md`

The source packages, docs app, tests, and local distribution scripts are repository assets, not npm package contents.

## Local npm Cache Issue

If `npm pack --dry-run` fails because the machine's npm cache has permission issues, use a temporary writable cache for the dry run:

```sh
npm_config_cache=/private/tmp/avis-npm-cache npm pack --dry-run
```

That workaround does not change package contents; it only avoids a local cache permission problem.
