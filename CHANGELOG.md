# Changelog

All notable changes to Avis will be documented in this file.

## 0.1.0-alpha.2

V3.1 is a release-hardening alpha focused on safer project mutation, deeper official integration setup, and a stronger npm release gate.

### Added

- Integration setup maturity: `install`, `configure`, and `managed`.
- Configure-level setup slices for Sentry, Redis, SQLAlchemy, email, storage, API documentation, and Celery-style workflows.
- Managed Django setup coverage for Django REST Framework and django-cors-headers.
- Release fixture QA for realistic Next.js/Auth.js and Django managed setup flows.
- Registry contract validation for framework definitions, defaults, detectable framework coverage, and managed integration requirements.
- npm artifact smoke testing that packs Avis, installs the generated tarball into a temporary project, and exercises the shipped `avis` binary.

### Changed

- `avis repair` now requires explicit `repair: "plan"` support from an integration.
- Release checks now build the workspace, regenerate registry docs, generate the native manifest, typecheck, lint, test, build docs, smoke-test the npm artifact, and run an npm pack dry run.
- Public documentation now describes setup maturity, repair safety, managed integration expectations, and current alpha limitations.

### Fixed

- Packaged CLI entrypoint detection now works when Avis is invoked through npm's `.bin/avis` symlink.
- Repair flows now fail closed when Avis cannot verify that a managed file still matches its recorded baseline.

### Known Limitations

- Repair is intentionally conservative and may refuse valid repairs when Avis lacks a clean ownership record or baseline hash.
- Some configure-level Django integrations generate opt-in settings snippets rather than directly modifying project settings.
- Provider-specific variants for monitoring, Redis, email, storage, and API documentation can be deepened as later vertical slices.
- Package-manager rollback depends on the target package manager exposing a safe remove command.
