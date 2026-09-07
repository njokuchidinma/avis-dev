---
title: Using Avis with Axum
description: Current Avis support for Axum projects.
---

Status: alpha

## Detected Through

Avis recognizes Axum through Rust package metadata and Axum dependency signals.

## Supported Package Manager

- Cargo

## Supported Capabilities

- API middleware/tooling
- database clients
- configuration
- monitoring
- observability

## Current Integrations

- tower-http for Axum
- SQLx
- config-rs
- Sentry Rust SDK
- Rust tracing

## Purpose-First Commands

```sh
avis add api
avis add database
avis add configuration
avis add monitoring
avis add observability
```

## What Avis May Change

Current Axum support is install-level. Avis adds compatible Cargo dependencies and keeps the plan reviewable.

## Not Handled By Avis

Avis does not create routers, layers, state containers, migrations, telemetry subscribers, or deployment configuration.
