---
title: Project Safety
description: Safety expectations and current protections in Avis.
---

Avis modifies existing projects, so safety is a core product feature.

Current protections:

- compatibility checks run before planning
- ChangePlans are displayed before applying changes
- plans are validated before application
- file mutations are snapshotted and rolled back after failed applies
- dependencies newly installed by a failed apply are removed when the package
  manager exposes a safe remove command
- file paths are checked as safe relative paths
- file creation refuses to overwrite existing files
- integrations verify project state after setup when a verifier exists
- `avis repair` checks Avis state hashes before mutating files Avis has already
  touched, and fails closed when a file has changed since Avis last recorded it

Current expectations:

- install Avis as a machine-level CLI, not as an application dependency
- use Avis in a repository tracked with version control
- review the ChangePlan before confirming
- inspect package manager changes after a failed dependency operation
- inspect generated starter code before building on it
- treat Avis as alpha software while the project is in active development

Avis should fail closed when it cannot confidently detect or configure a supported project.

## Current Alpha Limitations

Avis does not claim broad transactional guarantees across every possible package
manager failure. File mutations are snapshotted and rolled back when an apply
fails, and newly added dependencies are removed when the package manager exposes
a safe remove command. If a package manager operation fails in a way Avis cannot
reverse confidently, review the project with version control before continuing.

Generated framework snippets are intentionally conservative. For example, some
Django integrations create opt-in settings snippets instead of automatically
rewriting complex settings modules. Provider-specific variants for storage,
email, Redis, and monitoring are expected to deepen incrementally after alpha.
