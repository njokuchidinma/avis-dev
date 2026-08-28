# NPM Publishing

Avis is published as a single npm package named `avis-dev`.

The installed command is `avis`.

```sh
npm install -g avis-dev@alpha
avis doctor
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

## Verify

After publishing:

```sh
npm view avis-dev dist-tags version
npm install -g avis-dev@alpha
avis list
avis doctor
```

Run `avis doctor` inside at least one disposable Next.js project and one disposable Django project before announcing the release.
