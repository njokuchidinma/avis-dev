---
title: Building Avis Locally
description: Build and run Avis from source.
---

Build all packages:

```sh
pnpm build
```

Run the CLI from the repository root:

```sh
pnpm avis
```

Run the built CLI from another project:

```sh
cd path/to/project
node path/to/avis-dev/packages/cli/dist/index.js
```

When testing integration behavior manually, use disposable projects or fixtures tracked in version control.
