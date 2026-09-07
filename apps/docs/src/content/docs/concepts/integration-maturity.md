---
title: Integration Maturity
description: How Avis classifies install, configure, and managed integration support.
---

Avis integrations do not all promise the same depth. V3.1 makes that explicit with three setup maturity levels.

## Install

`install` means Avis can add a compatible dependency using the detected project package manager.

Use this level for libraries where installation is the safest useful action, or where project-specific wiring varies too much for Avis to automate yet.

Examples:

- icon libraries such as Lucide React, React Icons, and Heroicons React
- Rust tracing
- Laravel Sanctum
- several ecosystem service clients

## Configure

`configure` means Avis can install the dependency and create useful starter files, configuration snippets, or environment examples.

Configure-level integrations are useful, but they may still require a developer to import a snippet, add a route, select a provider, or finish deployment-specific settings.

Examples:

- Next.js Auth.js route scaffolding
- Sentry starter files
- Celery `config/celery.py`
- SQLAlchemy session helper
- Redis client/cache snippets
- Resend, Anymail, AWS S3, django-storages, and API documentation helpers

## Managed

`managed` means Avis can install, configure, verify, diagnose drift, and generate supported repair plans.

Managed is intentionally stricter. A managed integration needs:

- verifier behavior for `avis doctor`
- explicit `repair: "plan"` support
- non-trivial configuration behavior beyond dependency installation
- release fixture coverage
- conservative repair safety checks

Current managed examples include:

- Django REST Framework
- django-cors-headers

## How Repair Uses Maturity

`avis repair` only runs for integrations that declare repair-plan support. During repair, Avis checks its recorded `.avis/state.json` file hashes before mutating files it previously managed.

If a file changed outside Avis, repair stops for manual review instead of overwriting the user's work.

## Why This Matters

The maturity model keeps Avis honest. It lets the registry grow across many ecosystems without pretending every integration is equally automated.

For users, this means the CLI can say what it will do, what it can verify, and what still belongs to the developer.
