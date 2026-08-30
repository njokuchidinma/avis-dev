---
title: Integration Manifest
description: Fields used to describe an Avis integration.
---

An integration manifest describes what the integration is and where it can run.

Current fields include:

- `id`
- `name`
- `description`
- `capability`
- `version`
- `status`
- `trust`
- `supports`
- `dependencies`
- `configures`
- `documentation`
- `source`

Supported statuses are:

- `experimental`
- `stable`
- `deprecated`

Supported trust levels are:

- `official`
- `verified`
- `community`
- `experimental`

Project support should still be described carefully in documentation while Avis itself is alpha.
