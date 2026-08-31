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

Public built-in integration statuses are:

- `stable`
- `deprecated`

Public built-in trust levels are:

- `official`
- `verified`
- `community`

Supported V2 framework pages should only list integrations with stable manifests, documented behavior, verification, and tests. Future roadmap work should stay out of the public support table until it meets that bar.
