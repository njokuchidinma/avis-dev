---
title: Why Avis?
description: Why developers use Avis after initializing a project.
---

After a project is created, developers repeatedly install and wire the same capabilities:

- authentication
- state management
- data fetching
- forms
- validation
- monitoring
- testing
- background jobs
- storage

Avis removes repetitive setup work without pretending every project should look the same. It detects the project you already have and only offers integrations that declare compatibility with that project context.

## What Makes Avis Different

Avis is safe by default. Integrations generate a ChangePlan and Avis prints the planned dependency, file, and configuration operations before applying them.

Avis is framework aware. The current registry separates Next.js integrations from Django integrations and checks the detected ecosystem, framework, and package manager before planning changes.

Avis is more than installation. An integration can install dependencies, create starter files, patch configuration, and verify the final state.

Avis is intended to be idempotent. Running an integration again should not duplicate starter files or configuration when the expected setup is already present.

Avis is ecosystem agnostic by design. The current V2 alpha support covers Node, Python, PHP, Dart, and Rust projects through framework-specific capabilities and integrations.
