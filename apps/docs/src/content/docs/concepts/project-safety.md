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

Current expectations:

- install Avis as a machine-level CLI, not as an application dependency
- use Avis in a repository tracked with version control
- review the ChangePlan before confirming
- inspect package manager changes after a failed dependency operation
- inspect generated starter code before building on it
- treat Avis as alpha software while the project is in active development

Avis should fail closed when it cannot confidently detect or configure a supported project.
