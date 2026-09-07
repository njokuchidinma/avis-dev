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
- `setupMaturity`
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

Setup maturity is separate from trust:

- `install`: Avis can add the native dependency for a compatible project.
- `configure`: Avis can install and create or update meaningful project files or
  configuration.
- `managed`: Avis can install, configure, verify, diagnose drift, and generate
  supported repair plans.

An official integration can be install-only. Avis reserves `managed` for
integrations whose verifier, repair plan, and project mutation safety are deep
enough for real project drift.

Catalog validation rejects `managed` integrations that do not expose a verifier
and declare `repair: "plan"`. Release validation also requires managed
integrations to declare non-dependency configuration behavior and fixture
coverage.

Supported V2 framework pages should only list integrations with stable manifests, documented behavior, verification, and tests. Future roadmap work should stay out of the public support table until it meets that bar.
