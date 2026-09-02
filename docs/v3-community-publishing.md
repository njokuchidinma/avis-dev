# Avis V3 Community Publishing Foundation

This document captures the Phase 7-10 boundary for community integrations.

## Phase 7: Package For Publishing

Avis can package a local custom integration into a portable JSON artifact:

```sh
avis integration package ./company-auth
```

The package contains:

- normalized integration manifest metadata
- `plan.json`
- optional `verify.json`
- per-file SHA-256 hashes
- package-level SHA-256 digest
- security review findings

The package format is intentionally local/offline first. No remote registry write happens in this phase.

## Phase 8: Integrity And Inspection

Packaged integrations can be inspected before installation:

```sh
avis integration inspect .avis/packages/company-auth-0.1.0.avis-integration.json
```

Inspection recomputes integrity and reports tampering. A package with a mismatched digest fails the review.

## Phase 9: Safe Community Installation

Packaged integrations can be installed into the current project:

```sh
avis integration install .avis/packages/company-auth-0.1.0.avis-integration.json
```

Installed packages are expanded under:

```text
.avis/packaged-integrations/
```

They are then registered through the same local integration registry:

```text
.avis/integrations.json
```

At runtime, installed package integrations still display `Trust: Local` because the developer installed them into their own project. A package may be a community candidate, but using it locally does not make it verified.

## Phase 10: Registry-Ready Guardrails

The security review flags:

- invalid ChangePlan operations
- unsafe paths
- dependency installation
- dependency removal
- text patches
- environment variable writes
- missing verification files
- self-claimed official or verified trust

Avis still does not execute arbitrary third-party integration code. Remote community publishing remains a later step that should add contributor identity, ownership, signatures, compatibility CI, deprecation flows, and security review policy.
