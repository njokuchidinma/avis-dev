---
title: Generated Registry
description: Capability and integration metadata generated from Avis manifests.
---

This page is generated from Avis capability and integration manifests.

## Capabilities

| Capability | Description | Aliases | Defaults | Exclusive |
| --- | --- | --- | --- | --- |
| `state-management` | Client-side application state. | `state`, `store`, `stores` | `node`: `zustand`, `dart`: `flutter-riverpod` | yes |
| `data-fetching` | Client-side server-state and API fetching. | any | `node`: `tanstack-query` | no |
| `api` | API framework extensions and tooling. | `api-tooling`, `rest-api` | `python`: `django-rest-framework` | no |
| `forms` | Form state and submission helpers. | `form`, `form-state` | `node`: `react-hook-form` | no |
| `validation` | Runtime schema validation. | `schemas`, `schema-validation` | `node`: `zod` | no |
| `auth` | Authentication and API access control. | `authentication`, `api-auth`, `access-control` | `php`: `laravel-sanctum` | no |
| `observability` | Logging, tracing, and error visibility. | `logging`, `tracing` | `rust`: `rust-tracing` | no |
| `icons` | Icon libraries and icon systems for application interfaces. | `icon`, `icon-pack`, `icon-system` | `node`: `lucide-react` | no |

## Integrations

| Integration | Capability | Status | Trust | Ecosystems | Frameworks | Package Managers |
| --- | --- | --- | --- | --- | --- | --- |
| `zustand` | `state-management` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `redux-toolkit` | `state-management` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `tanstack-query` | `data-fetching` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `django-rest-framework` | `api` | stable | official | `python` | `django` | `pip`, `uv`, `poetry` |
| `react-hook-form` | `forms` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `zod` | `validation` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `laravel-sanctum` | `auth` | stable | official | `php` | `laravel` | `composer` |
| `flutter-riverpod` | `state-management` | stable | official | `dart` | `flutter` | `pub` |
| `rust-tracing` | `observability` | stable | official | `rust` | any | `cargo` |
| `lucide-react` | `icons` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `react-icons` | `icons` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `heroicons-react` | `icons` | stable | official | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
