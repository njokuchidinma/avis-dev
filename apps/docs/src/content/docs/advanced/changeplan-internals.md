---
title: ChangePlan Internals
description: The operation model used by Avis plans.
---

A ChangePlan contains:

- `id`
- `title`
- `integrationId`
- `target`
- `operations`
- `diagnostics`

Current operation types:

- `dependency.add`
- `dependency.remove`
- `file.create`
- `json.merge`
- `text.patch`
- `env.ensure`

`dependency.remove` is represented in the operation type system but is not implemented by the current apply flow.

Before application, Avis validates required plan fields, duplicate operation IDs, package names, and safe relative paths for file-like operations.
