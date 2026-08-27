# Avis Project State Model

This document defines the Core v1 design for local Avis state.

Avis state is a memory of what Avis did. It is not the source of truth for whether a project is healthy.

## Source Of Truth

Avis should always evaluate project health from two inputs:

- Actual project inspection: files, dependency manifests, framework configuration, and other real project state.
- Avis state: historical metadata about prior Avis actions.

Actual project inspection wins when the two disagree.

Example:

1. Avis configures TanStack Query.
2. `.avis/state.json` records that the integration was applied.
3. A developer deletes the provider file manually.
4. `avis doctor` must report the actual integration as `partial` or `broken`, not `healthy`.

## Proposed File

```json
{
  "schemaVersion": 1,
  "integrations": {
    "zustand": {
      "integrationVersion": "1.0.0",
      "appliedAt": "2026-08-27T00:00:00.000Z",
      "managedFiles": [
        {
          "path": "src/stores/index.ts",
          "createdByAvis": true,
          "lastKnownHash": "sha256:..."
        }
      ],
      "operations": [
        {
          "id": "create-zustand-store",
          "type": "file.create",
          "appliedAt": "2026-08-27T00:00:00.000Z"
        }
      ]
    }
  }
}
```

## Core v1 Rules

- State should be stored inside `.avis/state.json`.
- The state file should be committed by default unless a project chooses otherwise.
- State should never contain secrets, tokens, environment values, absolute local paths, or package manager credentials.
- Paths should be project-relative.
- Integration versions should come from `AvisIntegrationManifest.version`.
- State should record files Avis created or modified, but should not claim ownership over unrelated user code.
- State should be updated only after a ChangePlan operation succeeds.
- Partial failures should preserve enough information for `doctor` to explain what happened.

## Doctor Behavior

`avis doctor` should inspect the project first and may use Avis state as additional context.

Examples:

- State says an integration was applied, but files are missing: report `partial` or `broken`.
- Files exist but state is missing: report based on inspection and optionally mention unmanaged configuration.
- State version is older than manifest version: report healthy or partial based on inspection, with an upgrade note once upgrades exist.

## Deferred Work

Core v1 documents this model but does not implement `.avis/state.json` yet.

Implementation should wait until Avis has:

- more fixture coverage for modified files
- a clear upgrade flow
- conflict handling for merged ChangePlans
- a policy for hashing and comparing managed files
