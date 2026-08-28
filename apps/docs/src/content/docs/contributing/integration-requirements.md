---
title: Integration Requirements
description: Requirements for official Avis integrations.
---

Official integrations should include:

- compatibility checks
- ChangePlan generation
- idempotent behavior
- verification
- tests
- documentation

## Safety

Integrations must not assume every project has the same layout. Check the detected context and inspect the target project before planning changes.

## Idempotency

Running the same integration again should not duplicate files, dependencies, providers, settings entries, or environment variables.

## Verification

Verification should distinguish dependency presence from complete setup. A dependency-only project should often be `partial`, not `healthy`.

## Documentation

Each official integration should document:

- capability
- status
- supported ecosystems and frameworks
- command
- what Avis does
- files Avis may create
- files Avis may modify
- dependencies added
- doctor checks
- idempotence behavior
- manual setup differences
- official links
