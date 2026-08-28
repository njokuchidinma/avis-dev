---
title: How Avis Works
description: The detect, plan, apply, and verify flow used by Avis.
---

Avis follows a small, inspectable flow:

1. Detect the current project.
2. Resolve a capability or integration.
3. Check integration compatibility.
4. Generate a ChangePlan.
5. Validate and display the ChangePlan.
6. Ask for confirmation.
7. Apply approved operations.
8. Run integration verification when available.

The important idea is that integrations do not directly mutate your project as their first step. They describe intended changes first. Avis validates and previews those changes before applying them.

## Detection

Avis creates a project context from the current working directory. The context includes ecosystem, framework, languages, package manager, target root, and evidence collected during detection.

## Planning

The selected integration receives the project context and returns a ChangePlan. Plans can include dependency changes, new files, JSON merges, text patches, environment variable ensures, and diagnostics.

## Applying

Avis applies supported operations after confirmation. File paths are validated to stay inside the target project root.

## Verifying

If an integration includes a verifier, Avis checks the real project state after applying changes and during `avis doctor`.
