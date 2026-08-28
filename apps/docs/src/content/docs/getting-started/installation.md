---
title: Installation
description: Install Avis for current alpha development use.
---

Avis has not been documented here as a published global package yet. Until a public alpha package is released, use the local development workflow from this repository.

## Local Development Install

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

The published installation instructions should replace this page once Avis has an official alpha package.
