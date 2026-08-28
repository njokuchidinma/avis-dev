---
title: Security Model
description: Current safety boundaries and security expectations in Avis.
---

Avis is a local CLI that modifies the project where it runs. Its current security model focuses on predictable local mutations.

Current protections:

- integration compatibility checks before planning
- ChangePlan preview before mutation
- validation before applying operations
- safe relative path validation for file-like operations
- root-contained path resolution during apply
- no overwrite for generated starter files

Current limitations:

- Avis should be run inside version-controlled projects
- users should review ChangePlans before confirmation
- integrations should not be treated as a substitute for reviewing generated code
- the docs site is static and does not provide accounts, dashboards, private registries, or hosted project analysis

Future integrations that touch secrets, auth, payments, webhooks, databases, or external services must document their additional safety model before being accepted.
