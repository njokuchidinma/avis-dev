# NPM Publishing

Avis is published as a single npm package named `avis-dev`.

The installed command is `avis`.

```sh
npm install -g avis-dev@alpha
avis doctor
avis add state-management
```

## Alpha Package Shape

The npm package is built from the monorepo root. The public package includes:

- `dist/index.js`
- `dist/index.js.map`
- `README.md`
- `LICENSE.md`
- `NOTICE.md`
- `package.json`

Internal workspace packages are bundled into `dist/index.js` and are not published separately during alpha.

## Prepublish Checks

Run:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm pack:dry-run
```

Then inspect the `npm pack --dry-run` output. Do not publish if unrelated files, secrets, local fixtures, build caches, or workspace source packages appear in the package contents.

## Publish

Publish alpha releases with the `alpha` dist tag:

```sh
npm publish --tag alpha
```

If npm prompts for two-factor authentication, enter the one-time code from the authenticated npm account.

## Update the npmjs Package Page

The npmjs package page renders the README from a published package version. You cannot edit the README for an already-published immutable tarball.

To update the npmjs page:

1. Update `README.md`.
2. Bump `package.json` to a new version.
3. Publish the new version.
4. Make sure the `latest` tag points at the version whose README should appear on npmjs.

During alpha, keep `alpha` and `latest` on the same version if the npmjs package page should show the newest alpha README:

```sh
npm publish --tag alpha
npm dist-tag add avis-dev@0.1.0-alpha.1 latest
```

## Verify

After publishing:

```sh
npm view avis-dev dist-tags version
npm install -g avis-dev@alpha
avis list
avis doctor
```

Run `avis doctor` inside at least one disposable Next.js project and one disposable Django project before announcing the release.
