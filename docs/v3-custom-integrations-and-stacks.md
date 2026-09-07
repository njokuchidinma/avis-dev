# Avis V3 Custom Integrations and Stacks

This document captures the Phase 4-6 implementation boundary.

## Custom Integrations

Custom integrations teach Avis about a tool it does not officially support. V3 starts with a declarative local format:

- `avis.integration.json` declares identity, capability, ecosystem/framework/package-manager support, dependencies, config options, documentation, and source metadata.
- `plan.json` declares safe ChangePlan operations using the same primitives as official integrations.
- `verify.json` optionally declares static verification checks for early local workflows.

Avis intentionally does not execute arbitrary integration code in this phase. Local integrations are loaded as `AvisIntegration` objects and still pass through compatibility checks, ChangePlan validation, preview, confirmation, apply, and verification.

Local integrations always display `Trust: Local` at runtime, even if the manifest claims another trust level.

## Local Registration

Projects register local integrations in:

```text
.avis/integrations.json
```

The first supported registration flow is:

```sh
avis integration create company-auth
avis integration add ./company-auth
avis add auth
```

Local integration paths must resolve inside the current project root. This keeps local integration loading bounded to the project and avoids path traversal or symlink escape surprises.

## Custom Stacks

Custom stacks combine integrations Avis already knows, including locally registered integrations.

V3 starts with exact stack files:

```json
{
  "id": "company-next-standard",
  "name": "Company Next Standard",
  "integrations": ["zustand", "tanstack-query", "zod"]
}
```

Supported flows:

```sh
avis stack create company-next-standard
avis stack show ./company-next-standard.stack.json
avis stack use ./company-next-standard.stack.json
```

Capability-based universal stacks are intentionally later. Exact integration stacks are safer because they can be validated directly against the detected project and available integrations.
