---
title: Pull Request Guide
description: Expectations for Avis pull requests.
---

Before opening a pull request:

- keep changes focused
- add or update tests for behavior changes
- update docs for user-facing behavior
- run type checks
- run relevant tests
- avoid unrelated formatting churn

Recommended verification:

```sh
pnpm typecheck
pnpm test
pnpm docs:build
```

For integration pull requests, include fixture coverage for planning and verification whenever practical.
