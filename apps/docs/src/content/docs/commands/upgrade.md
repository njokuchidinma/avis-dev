---
title: avis upgrade
description: Show how to upgrade Avis to the newest npm alpha release.
---

```sh
avis upgrade
avis update
avis --version
```

`avis --version` prints the installed Avis CLI version.

`avis upgrade` and `avis update` print the npm commands for moving an existing global install to the newest alpha release.

During alpha, use:

```sh
npm install -g avis-dev@alpha
```

This follows npm's `alpha` dist-tag. New alpha publishes should move that tag to the newest alpha version.

To inspect the current npm tags:

```sh
npm dist-tag ls avis-dev
```

After upgrading, verify the installed command:

```sh
avis --version
```
