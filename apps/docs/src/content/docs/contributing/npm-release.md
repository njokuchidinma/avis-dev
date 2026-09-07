---
title: npm Release Checklist
description: Checks to run before publishing an Avis alpha package to npm.
---

Avis publishes the CLI package as `avis-dev` and exposes the `avis` binary.

The automated npm workflow runs when a version tag is pushed. Ordinary Git
pushes run CI and documentation deployment, but do not publish a package.

During alpha, publish with the alpha tag:

```sh
npm publish --tag alpha
```

The release workflow also moves npm's `latest` tag to the newly published
version. This means the newest alpha is discoverable through both `latest`
and `alpha` until a stable release is available.

## Automated Release

Create a version tag that exactly matches the root `package.json` version:

```sh
git tag v0.1.0-alpha.2
git push origin v0.1.0-alpha.2
```

The workflow validates the tag, runs `pnpm release:check`, publishes the
package, updates `latest`, and verifies the published npm tags. Stable tags
such as `v0.1.0` publish to `latest` as well.

Configure npm Trusted Publishing for the `njokuchidinma/avis-dev` repository
and the `npm-publish.yml` workflow. The workflow uses its OIDC identity for
`npm publish`, so no publish token is exposed to package lifecycle scripts.

The repository must also have an `NPM_TOKEN` secret with permission to manage
the `avis-dev` dist-tags. npm's OIDC trusted publishing does not authenticate
`npm dist-tag` or `npm view` commands, so this token is used only after the
publish step. Keep it as a protected repository or environment secret.

Inspect the tags after a release:

```sh
npm dist-tag ls avis-dev
```

## Required Checks

Run the release check from the repository root:

```sh
pnpm release:check
```

This refreshes generated registry docs, generates the native target manifest, runs type checking, runs tests, builds the package and docs site, and performs an npm pack dry run.
It also runs the npm artifact smoke test, which creates a real tarball, installs it into a temporary project outside the monorepo, and exercises the shipped `avis` binary.

To run only the artifact smoke test:

```sh
pnpm release:smoke
```

The smoke test verifies:

- `avis --version`
- `avis --help`
- `avis list`
- `avis search authentication`
- `avis doctor`
- `avis stack list`
- `avis integration list`

The test suite also validates the release catalog contract:

- every detectable framework is present in the framework catalog
- framework definitions reference known ecosystems, project types, and capabilities
- capability defaults reference known compatible integrations
- framework-specific recommendations take precedence over ecosystem defaults
- `managed` integrations expose verification, repair-plan support, non-dependency configuration behavior, and release fixture coverage

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
