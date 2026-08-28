---
title: Creating an Integration
description: How to add a new Avis integration.
---

An integration should describe one concrete way to add a capability to a compatible project.

At a high level, an integration exports:

- a manifest
- `isCompatible(context)`
- `plan({ context })`
- optionally `verify(context)`

The manifest should include:

- stable integration ID
- human-readable name and description
- capability ID
- version
- status
- supported ecosystems
- supported frameworks
- supported package managers
- dependencies
- configured items
- source ownership

Planning should inspect the project before proposing operations. Do not blindly create files, patch configuration, or install packages when the expected setup already exists.

Verification should check actual project state and classify health as precisely as the current implementation allows.

Do not document `avis integration create` as an available command until it exists.
