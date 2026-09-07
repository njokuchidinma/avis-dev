# Avis V3 Architecture Audit

This audit captures the Phase 0 findings that shaped the V3 foundation work.

## Existing V2 Structure

- Project detection already returns `DetectionResult` and `ProjectTarget` values with ecosystem, language, framework, package-manager, evidence, and diagnostics.
- `createProjectContext` converts the selected target into the context passed through integrations, planning, verification, and registry resolution.
- Ecosystem behavior is already split into detector and package-manager modules for Node, Python, PHP, Dart, and Rust.
- Integrations already expose manifests, compatibility checks, ChangePlans, and optional verification.
- Registry behavior already supports capabilities, aliases, defaults, recommendations, support grouping, search, stack resolution, and conflict checks.

## V3 Gaps Found

- Go was listed as a V3 target but did not have detection or package-manager support.
- Generic project detection manually called ecosystem detectors instead of routing through a formal six-ecosystem registry.
- Project context only preserved the primary framework and package manager, losing other candidates and confidence details.
- Project type was not represented, so capability filtering could not distinguish frontend, backend, fullstack, mobile, CLI, library, or service shape.
- Framework support maturity was not centralized, making it hard for Avis to communicate Tier 1, Tier 2, and experimental support honestly.
- Capability metadata existed, but framework-specific relevance was not centralized.

## V3 Foundation Decisions

- Keep the existing V2 detector and integration shapes. They are already close to the desired architecture and do not need a rewrite.
- Add thin `EcosystemAdapter` metadata around existing detectors instead of moving all detection logic immediately.
- Extend `ProjectContext` compatibly: keep `framework` and `packageManager`, while adding candidate arrays, confidence, and project type.
- Add framework definitions with support tiers and relevant capabilities, then let the registry expose available capabilities for a detected context.
- Treat Go modules as a native dependency model with `go.mod`, `go.sum`, and `go get`; do not map it onto package.json semantics.
- Infer project type only from strong framework or tool evidence. If confidence is low, return no project type rather than guessing.

## Current Phase Boundary

This implements the foundation for phases 1-3:

- Six V3 ecosystem families are formalized.
- Project context carries V3 detection metadata.
- Framework support tiers and project-type defaults are centralized.
- Go joins the official detection and package-manager path.
- The registry can ask for capabilities that are both relevant to the detected framework and backed by compatible integrations.

Custom integrations, local integration loading, custom stacks, and community publishing remain later phases.
