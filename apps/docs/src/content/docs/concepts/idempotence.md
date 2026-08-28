---
title: Idempotence
description: How Avis avoids duplicating setup when an integration runs again.
---

Avis integrations should be idempotent: running the same integration repeatedly should not duplicate configuration or overwrite user code.

Current examples:

- file creation operations use `overwrite: "never"`
- integrations skip dependency installation when the package manager adapter detects the dependency
- starter files are not recreated when they already exist
- Django REST Framework is not patched into `INSTALLED_APPS` when `rest_framework` is already present

Idempotence is both a product requirement and a contribution requirement. New integrations should check the existing project state before planning changes.
